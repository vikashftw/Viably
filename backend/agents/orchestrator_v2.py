"""
Orchestrator Agent V2: Combines Engineer + Competitor analysis with upskilling.

Matches Person 4's output schema while keeping multi-agent architecture.
"""

import logging
from typing import Dict, Any
from .base_agent import BaseAgent
from .engineer_agent import EngineerAgent
from .competitor_agent import CompetitorAgent
from utils.upskilling import get_tracker
from agents.market_intelligence_agent import MarketIntelligenceAgent
from agents.similar_feature_agent import SimilarFeatureAgent
from agents.roi_calculator_agent import ROICalculatorAgent

logger = logging.getLogger(__name__)


class OrchestratorV2(BaseAgent):
    """
    Orchestrator that combines Engineer and Competitor agents.

    Output matches Person 4's schema:
    {
        "feature_name": str,
        "engineer_analysis": {...},
        "competitor_analysis": {...},
        "overall_recommendation": {...},
        "upskilling_insights": {...}
    }
    """

    def __init__(self, use_vector_embeddings: bool = False):
        """
        Initialize Orchestrator.

        Args:
            use_vector_embeddings: Pass to Engineer Agent for RAG mode
        """
        super().__init__()
        self.engineer = EngineerAgent(use_vector_embeddings=use_vector_embeddings)
        self.competitor = CompetitorAgent()
        self.upskilling_tracker = get_tracker()
        # NEW AGENTS
        self.market_intel = MarketIntelligenceAgent()
        self.similar_features = SimilarFeatureAgent(use_vector_embeddings)
        self.roi_calculator = ROICalculatorAgent()
        logger.info("OrchestratorV2 initialized")

    def analyze(
        self,
        feature_name: str,
        feature_description: str,
        target_user: str = "PNC customers",
        business_goal: str = "increase engagement and revenue",
        industry: str = "banking",
        **kwargs
    ) -> Dict[str, Any]:
        """
        Orchestrate complete product feature analysis.

        Args:
            feature_name: Name of the feature
            feature_description: Detailed description
            target_user: Who will use this (default: "PNC customers")
            business_goal: Why build this (default: "increase engagement and revenue")
            industry: Industry context (default: "banking")
            **kwargs: Additional parameters

        Returns:
            Analysis matching Person 4's schema
        """
        logger.info(f"=== ORCHESTRATOR V2: Starting analysis for '{feature_name}' ===")

        try:
            # Step 1: Engineer Agent - Cost estimation
            logger.info("Step 1: Running Engineer Agent...")
            engineer_result = self.engineer.analyze(
                feature_description=feature_description,
                feature_name=feature_name
            )

            # Extract sprints/engineers/cost from engineer result
            engineer_analysis = {
                "estimated_sprints": engineer_result.get("estimated_sprints", 0),
                "estimated_engineers": engineer_result.get("estimated_engineers", 0),
                "estimated_cost_usd": engineer_result.get("estimated_cost_usd", 0),
                "key_risks": engineer_result.get("key_risks", []),
                "confidence": engineer_result.get("confidence", 0.7)
            }

            # Step 2: Competitor Agent - Market analysis
            logger.info("Step 2: Running Competitor Agent...")
            competitor_result = self.competitor.analyze(
                feature_description=feature_description,
                feature_name=feature_name,
                industry=industry
            )

            # Extract competitor analysis
            competitor_analysis = {
                "key_competitors": competitor_result.get("key_competitors", []),
                "expected_response_time_sprints": competitor_result.get("expected_response_time_sprints", 0),
                "response_play": competitor_result.get("response_play", ""),
                "competitive_risk_level": competitor_result.get("competitive_risk_level", "MEDIUM")
            }

            # NEW: Market intelligence
            logger.info("Step 2.1: Running Market Intelligence Agent...")
            market_intel_result = self.market_intel.analyze(
                feature_name=feature_name,
                industry=industry,
                config={
                    "search_market_size": True,
                    "search_competitors": True  # Optional: set to False to save tokens
                }
            )

            # NEW: Similar features (adds transparency to engineer estimate)
            logger.info("Step 2.2: Running Similar Features Agent...")
            similar_features_result = self.similar_features.analyze(
                feature_name=feature_name,
                feature_description=feature_description,
                estimated_sprints=engineer_analysis["estimated_sprints"]
            )

            # NEW: ROI calculation
            logger.info("Step 2.3: Running ROI Calculator Agent...")
            roi_result = self.roi_calculator.analyze(
                feature_name=feature_name,
                cost=engineer_analysis["estimated_cost_usd"],
                similar_projects=similar_features_result["similar_projects"],
                target_users=6_000_000,  # 10% of PNC's 60M customers
                industry=industry
            )

            # Step 3: Generate overall recommendation
            logger.info("Step 3: Synthesizing recommendation...")
            recommendation = self._generate_recommendation(
                feature_name=feature_name,
                engineer_analysis=engineer_analysis,
                competitor_analysis=competitor_analysis,
                business_goal=business_goal
            )

            # Step 4: Get upskilling insights
            logger.info("Step 4: Generating upskilling insights...")
            # Track skills from similar projects (from engineer's RAG results)
            similar_projects_found = engineer_result.get("similar_projects_found", 0)
            if similar_projects_found > 0:
                # In real system, we'd track actual skills from the engineer analysis
                # For demo, we simulate based on feature type
                inferred_skills = self._infer_skills_from_feature(feature_description)
                self.upskilling_tracker.track_skills(inferred_skills)

            upskilling_insights = self.upskilling_tracker.get_insights()

            # Step 5: Combine into final output
            result = {
                "feature_name": feature_name,
                "engineer_analysis": engineer_analysis,
                "competitor_analysis": competitor_analysis,
                "overall_recommendation": recommendation,
                "upskilling_insights": upskilling_insights,

                # NEW SECTIONS
                "market_intelligence": market_intel_result,
                "similar_features": similar_features_result,
                "roi_projections": roi_result
            }

            logger.info("=== ORCHESTRATOR V2: Analysis complete ===")
            return result

        except Exception as e:
            logger.error(f"Orchestrator analysis failed: {str(e)}")
            return {
                "feature_name": feature_name,
                "engineer_analysis": {
                    "estimated_sprints": 0,
                    "estimated_engineers": 0,
                    "estimated_cost_usd": 0,
                    "key_risks": [f"Analysis failed: {str(e)}"],
                    "confidence": 0.0
                },
                "competitor_analysis": {
                    "key_competitors": [],
                    "expected_response_time_sprints": 0,
                    "response_play": "Unknown",
                    "competitive_risk_level": "MEDIUM"
                },
                "overall_recommendation": {
                    "summary": "Unable to complete analysis",
                    "rationale": f"Error: {str(e)}",
                    "action_items": ["Fix analysis errors", "Retry with valid inputs"]
                },
                "upskilling_insights": {
                    "bottleneck_skills": [],
                    "suggested_training": []
                },
                "error": str(e)
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

        Args:
            feature_name: Name of feature
            engineer_analysis: Engineer agent output
            competitor_analysis: Competitor agent output
            business_goal: Why we're building this

        Returns:
            Recommendation dict with summary, rationale, action_items
        """
        cost = engineer_analysis.get("estimated_cost_usd", 0)
        sprints = engineer_analysis.get("estimated_sprints", 0)
        engineers = engineer_analysis.get("estimated_engineers", 0)
        confidence = engineer_analysis.get("confidence", 0.7)

        risk_level = competitor_analysis.get("competitive_risk_level", "MEDIUM")
        competitors = competitor_analysis.get("key_competitors", [])
        response_time = competitor_analysis.get("expected_response_time_sprints", 0)

        # Decision logic
        action_items = []

        # High cost + high risk = defer or differentiate
        if cost > 500000 and risk_level == "HIGH":
            summary = "DEFER - High cost with high competitive risk"
            rationale = f"${cost:,} investment with {len(competitors)} strong competitors that can match in {response_time} sprints. Consider differentiation strategy or defer."
            action_items = [
                "Identify unique differentiation angle",
                "Reduce scope to lower cost",
                "Wait for market maturity signals"
            ]

        # Low risk + reasonable cost = proceed
        elif risk_level == "LOW" and cost < 300000:
            summary = "PROCEED - Low competitive risk, manageable cost"
            rationale = f"${cost:,} over {sprints} sprints is reasonable given {risk_level.lower()} competitive risk. {business_goal.capitalize()} aligns with expected ROI."
            action_items = [
                "Assemble team and kick off discovery",
                "Create detailed technical spec",
                "Set up success metrics"
            ]

        # Medium risk, medium cost = proceed with caution
        elif risk_level == "MEDIUM" and cost < 500000:
            summary = "PROCEED WITH CAUTION - Balanced risk/reward"
            rationale = f"{sprints} sprints with {engineers} engineers is feasible. Medium competitive risk requires differentiation in execution."
            action_items = [
                "Define clear differentiation vs competitors",
                "Plan phased rollout to validate assumptions",
                "Monitor competitor moves closely"
            ]

        # Low confidence = investigate first
        elif confidence < 0.7:
            summary = "INVESTIGATE - Low estimation confidence"
            rationale = f"Confidence only {confidence:.0%}. Need more discovery to refine estimates and derisk assumptions."
            action_items = [
                "Conduct technical spike/POC",
                "Interview target users for validation",
                "Refine requirements and re-estimate"
            ]

        # Default: proceed
        else:
            summary = "PROCEED - Acceptable risk/cost profile"
            rationale = f"{sprints} sprints, ${cost:,}. Competitive positioning requires execution excellence."
            action_items = [
                "Finalize scope and technical approach",
                "Assemble cross-functional team",
                "Create project plan and milestones"
            ]

        return {
            "summary": summary,
            "rationale": rationale,
            "action_items": action_items
        }

    def _infer_skills_from_feature(self, description: str) -> list:
        """
        Infer required skills from feature description.

        This is a simple keyword-based inference for demo purposes.
        In production, would use the actual skills from engineer analysis.
        """
        description_lower = description.lower()
        skills = []

        # Check for keywords
        if any(word in description_lower for word in ['mobile', 'app', 'ios', 'android']):
            skills.append('mobile')
        if any(word in description_lower for word in ['api', 'backend', 'server', 'database']):
            skills.append('backend')
        if any(word in description_lower for word in ['security', 'auth', 'encryption', 'compliance']):
            skills.append('security')
        if any(word in description_lower for word in ['payment', 'transaction', 'checkout']):
            skills.append('payments')
        if any(word in description_lower for word in ['ai', 'ml', 'machine learning', 'prediction']):
            skills.append('ml')
        if any(word in description_lower for word in ['frontend', 'ui', 'dashboard', 'interface']):
            skills.append('frontend')
        if any(word in description_lower for word in ['data', 'analytics', 'insights']):
            skills.append('data-science')
        if any(word in description_lower for word in ['cloud', 'aws', 'azure', 'infrastructure']):
            skills.append('cloud')

        return skills if skills else ['backend', 'frontend']  # Default
