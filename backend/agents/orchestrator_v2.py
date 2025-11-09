"""
Orchestrator Agent V2: Combines analysis from 6 agents in parallel.
"""

import logging
import asyncio
from typing import Dict, Any
from .base_agent import BaseAgent
from .engineer_agent import EngineerAgent
from .competitor_agent import CompetitorAgent
from .market_intelligence_agent import MarketIntelligenceAgent
from .roi_calculator_agent import ROICalculatorAgent
from .similar_feature_agent import SimilarFeatureAgent
from .implementation_planner_agent import ImplementationPlannerAgent
from utils.upskilling import get_tracker

logger = logging.getLogger(__name__)


class OrchestratorV2(BaseAgent):
    """
    Orchestrator that runs a 3-wave parallel analysis using 6 agents.
    """

    def __init__(self, use_vector_embeddings: bool = False):
        """
        Initialize Orchestrator with all required agents.
        """
        super().__init__()
        # Wave 1
        self.engineer_agent = EngineerAgent(use_vector_embeddings=use_vector_embeddings)
        self.competitor_agent = CompetitorAgent()
        self.market_intel_agent = MarketIntelligenceAgent()
        # Wave 2
        self.roi_calculator = ROICalculatorAgent()
        self.similar_features_agent = SimilarFeatureAgent()
        # Wave 3
        self.implementation_planner = ImplementationPlannerAgent()
        
        self.upskilling_tracker = get_tracker()
        logger.info("OrchestratorV2 initialized with 6 agents for 3-wave execution")

    async def analyze(
        self,
        feature_name: str,
        feature_description: str,
        target_user: str,
        business_goal: str,
        industry: str,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Analyze feature using 3-wave parallel execution
        Wave 1: Independent agents (Engineer, Competitor, Market Intel)
        Wave 2: Dependent on Engineer (ROI, Similar Features)
        Wave 3: Depends on all (Implementation Planner)
        """
        logger.info(f"=== ORCHESTRATOR V2 (3-WAVE): Starting analysis for '{feature_name}' ===")

        try:
            # WAVE 1: Run independent agents in parallel (8 seconds)
            print("[Orchestrator] Wave 1: Running independent agents...")
            logger.info("[Orchestrator] Wave 1: Running independent agents...")
            
            # Simulating teammate's work with provided mock data
            engineer_result, competitor_result, market_result = await asyncio.gather(
                self.engineer_agent.analyze(
                    feature_name=feature_name,
                    feature_description=feature_description,
                ),
                self.competitor_agent.analyze(
                    feature_name=feature_name,
                    feature_description=feature_description,
                    industry=industry
                ),
                self.market_intel_agent.analyze(
                    feature_name=feature_name,
                    feature_description=feature_description,
                    industry=industry
                )
            )
            engineer_cost = engineer_result.get("estimated_cost_usd") or engineer_result.get("cost", 0) or 0
            competitor_count = len(competitor_result.get("key_competitors", []))
            market_size = market_result.get("estimated_market_size_usd") or market_result.get("market_size_usd", 0) or 0
            print(f"[Orchestrator] Wave 1 complete: Engineer (${engineer_cost:,}), Competitors ({competitor_count}), Market (${market_size:,})")
            logger.info(f"[Orchestrator] Wave 1 complete.")

            # WAVE 2: Run Engineer-dependent agents in parallel (4 seconds)
            print("[Orchestrator] Wave 2: Running dependent agents...")
            logger.info("[Orchestrator] Wave 2: Running dependent agents...")
            roi_result, similar_result = await asyncio.gather(
                self.roi_calculator.calculate(
                    feature_name=feature_name,
                    engineer_analysis=engineer_result
                ),
                self.similar_features_agent.find(
                    feature_name=feature_name,
                    feature_description=feature_description,
                    engineer_analysis=engineer_result
                )
            )
            print(f"[Orchestrator] Wave 2 complete: ROI ({roi_result.get('base_case', {}).get('roi_percent', 0)}%), Similar Features ({len(similar_result.get('similar_projects', []))})")
            logger.info(f"[Orchestrator] Wave 2 complete.")

            # WAVE 3: Run final agent that depends on everything (3 seconds)
            print("[Orchestrator] Wave 3: Running final agent...")
            logger.info("[Orchestrator] Wave 3: Running final agent...")
            planning_payload = {
                "feature_name": feature_name,
                "feature_description": feature_description,
                "engineer_analysis": engineer_result,
                "competitor_analysis": competitor_result,
                "market_intelligence": market_result,
                "roi_scenarios": roi_result,
                "similar_features": similar_result
            }
            impl_result = await self.implementation_planner.plan(planning_payload)
            print(f"[Orchestrator] Wave 3 complete: {len(impl_result.get('search_patterns', []))} search patterns, {len(impl_result.get('tasks', []))} tasks")
            logger.info(f"[Orchestrator] Wave 3 complete.")

            # Generate overall recommendation (using existing logic)
            logger.info("Synthesizing recommendation...")
            recommendation = self._generate_recommendation(
                feature_name=feature_name,
                engineer_analysis=engineer_result,
                competitor_analysis=competitor_result,
                business_goal=business_goal
            )

            # Get upskilling insights (using existing logic)
            logger.info("Generating upskilling insights...")
            if engineer_result.get("similar_projects_found", 0) > 0:
                inferred_skills = self._infer_skills_from_feature(feature_description)
                self.upskilling_tracker.track_skills(inferred_skills)
            upskilling_insights = self.upskilling_tracker.get_insights()

            # Combine into final output
            result = {
                "feature_name": feature_name,
                "engineer_analysis": engineer_result,
                "competitor_analysis": competitor_result,
                "market_intelligence": market_result,
                "roi_scenarios": roi_result,
                "similar_features": similar_result,
                "implementation_plan": impl_result,
                "overall_recommendation": recommendation,
                "upskilling_insights": upskilling_insights,
            }

            logger.info("=== ORCHESTRATOR V2 (3-WAVE): Analysis complete ===")
            return result

        except Exception as e:
            logger.error(f"Orchestrator analysis failed: {str(e)}", exc_info=True)
            return {
                "feature_name": feature_name,
                "error": str(e),
                "details": "An exception occurred during the analysis pipeline."
            }

    def _generate_recommendation(
        self,
        feature_name: str,
        engineer_analysis: Dict[str, Any],
        competitor_analysis: Dict[str, Any],
        business_goal: str
    ) -> Dict[str, Any]:
        """
        Generate overall strategic recommendation.
        """
        cost = engineer_analysis.get("estimated_cost_usd", 0)
        sprints = engineer_analysis.get("estimated_sprints", 0)
        engineers = engineer_analysis.get("estimated_engineers", 0)
        confidence = engineer_analysis.get("confidence", 0.7)

        risk_level = competitor_analysis.get("competitive_risk_level", "MEDIUM")
        competitors = competitor_analysis.get("key_competitors", [])
        response_time = competitor_analysis.get("expected_response_time_sprints", 0)

        action_items = []
        if cost > 500000 and risk_level == "HIGH":
            summary = "DEFER - High cost with high competitive risk"
            rationale = f"${cost:,} investment with {len(competitors)} strong competitors that can match in {response_time} sprints."
            action_items = ["Identify unique differentiation angle", "Reduce scope to lower cost"]
        elif risk_level == "LOW" and cost < 300000:
            summary = "PROCEED - Low competitive risk, manageable cost"
            rationale = f"${cost:,} over {sprints} sprints is reasonable given low competitive risk."
            action_items = ["Assemble team and kick off discovery", "Create detailed technical spec"]
        elif confidence < 0.7:
            summary = "INVESTIGATE - Low estimation confidence"
            rationale = f"Confidence only {confidence:.0%}. Need more discovery to refine estimates."
            action_items = ["Conduct technical spike/POC", "Interview target users for validation"]
        else:
            summary = "PROCEED - Acceptable risk/cost profile"
            rationale = f"{sprints} sprints, ${cost:,}. Competitive positioning requires execution excellence."
            action_items = ["Finalize scope and technical approach", "Assemble cross-functional team"]

        return {
            "summary": summary,
            "rationale": rationale,
            "action_items": action_items
        }

    def _infer_skills_from_feature(self, description: str) -> list:
        """
        Infer required skills from feature description for demo purposes.
        """
        description_lower = description.lower()
        skills = []
        if 'mobile' in description_lower: skills.append('mobile')
        if 'api' in description_lower: skills.append('backend')
        if 'security' in description_lower: skills.append('security')
        if 'payment' in description_lower: skills.append('payments')
        if 'ml' in description_lower: skills.append('ml')
        if 'frontend' in description_lower: skills.append('frontend')
        if 'data' in description_lower: skills.append('data-science')
        if 'cloud' in description_lower: skills.append('cloud')
        return skills if skills else ['backend', 'frontend']
