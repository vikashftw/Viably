"""
Orchestrator Agent: Multi-agent coordination and synthesis.

Coordinates Engineer and Competitor agents, synthesizes their
outputs, and generates strategic recommendations.
"""

import logging
from typing import Dict, Any
from .base_agent import BaseAgent
from .engineer_agent import EngineerAgent
from .competitor_agent import CompetitorAgent

logger = logging.getLogger(__name__)


class Orchestrator(BaseAgent):
    """
    Orchestrator for multi-agent coordination.

    Manages the workflow:
    1. Engineer Agent → Cost estimate
    2. Competitor Agent → Market analysis
    3. Synthesis → Strategic recommendation
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
        logger.info("Orchestrator initialized")

    def analyze(
        self,
        feature_description: str,
        feature_name: str = None,
        industry: str = "fintech",
        **kwargs
    ) -> Dict[str, Any]:
        """
        Orchestrate complete product feature analysis.

        Args:
            feature_description: Description of the feature to analyze
            feature_name: Optional name of the feature
            industry: Industry context (default: "fintech")
            **kwargs: Additional parameters

        Returns:
            Complete war game analysis:
            {
                "feature_name": str,
                "feature_description": str,
                "cost_estimate": {...},    # From Engineer Agent
                "competitive_analysis": {...},  # From Competitor Agent
                "recommendation": {...},   # Synthesized recommendation
                "summary": str            # Executive summary
            }
        """
        feature = feature_name or "Proposed Feature"
        logger.info(f"=== ORCHESTRATOR: Starting analysis for '{feature}' ===")

        try:
            # Step 1: Engineer Agent - Cost estimation
            logger.info("Step 1: Running Engineer Agent...")
            cost_estimate = self.engineer.analyze(
                feature_description=feature_description,
                feature_name=feature_name
            )

            # Step 2: Competitor Agent - Market analysis
            logger.info("Step 2: Running Competitor Agent...")
            competitive_analysis = self.competitor.analyze(
                feature_description=feature_description,
                feature_name=feature_name,
                industry=industry
            )

            # Step 3: Synthesize results
            logger.info("Step 3: Synthesizing recommendations...")
            recommendation = self._synthesize_recommendation(
                feature_name=feature,
                cost_estimate=cost_estimate,
                competitive_analysis=competitive_analysis
            )

            # Step 4: Generate executive summary
            executive_summary = self._generate_summary(
                feature_name=feature,
                cost_estimate=cost_estimate,
                competitive_analysis=competitive_analysis,
                recommendation=recommendation
            )

            result = {
                "feature_name": feature,
                "feature_description": feature_description,
                "cost_estimate": cost_estimate,
                "competitive_analysis": competitive_analysis,
                "recommendation": recommendation,
                "summary": executive_summary
            }

            logger.info("=== ORCHESTRATOR: Analysis complete ===")
            return result

        except Exception as e:
            logger.error(f"Orchestrator analysis failed: {str(e)}")
            return {
                "feature_name": feature,
                "feature_description": feature_description,
                "cost_estimate": {"error": str(e)},
                "competitive_analysis": {"error": str(e)},
                "recommendation": {"decision": "defer", "rationale": f"Analysis failed: {str(e)}"},
                "summary": f"Unable to complete analysis due to error: {str(e)}",
                "error": str(e)
            }

    def _synthesize_recommendation(
        self,
        feature_name: str,
        cost_estimate: Dict[str, Any],
        competitive_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Synthesize cost and competitive data into strategic recommendation.

        Args:
            feature_name: Name of the feature
            cost_estimate: Output from Engineer Agent
            competitive_analysis: Output from Competitor Agent

        Returns:
            Strategic recommendation dictionary
        """
        # Extract key metrics
        cost = cost_estimate.get("cost", 0)
        hours = cost_estimate.get("hours", 0)
        complexity = cost_estimate.get("complexity", "unknown")
        confidence = cost_estimate.get("confidence", 0.5)

        risk_score = competitive_analysis.get("risk_score", 5)
        market_maturity = competitive_analysis.get("market_maturity", "unknown")
        strategic_rec = competitive_analysis.get("strategic_recommendation", "unknown")
        market_opportunity = competitive_analysis.get("market_opportunity", {})

        # Decision logic
        decision = "proceed"  # Default
        priority = "medium"
        rationale_points = []

        # High cost + low market opportunity = defer
        if cost > 200000 and market_opportunity.get("size") == "small":
            decision = "defer"
            priority = "low"
            rationale_points.append("High development cost relative to market opportunity")

        # High competitive risk + not a first-mover opportunity = fast-follower
        elif risk_score >= 7 and strategic_rec != "first_mover":
            decision = "fast_follower"
            priority = "low"
            rationale_points.append("Market already saturated with strong competitors")

        # Low risk + good opportunity = proceed
        elif risk_score <= 4 and market_opportunity.get("urgency") in ["high", "critical"]:
            decision = "proceed"
            priority = "high"
            rationale_points.append("Low competitive risk with high market urgency")

        # First mover advantage = proceed with priority
        elif strategic_rec == "first_mover":
            decision = "proceed"
            priority = "high"
            rationale_points.append("First-mover advantage in emerging market")

        # High complexity + low confidence = investigate further
        elif complexity == "high" and confidence < 0.6:
            decision = "investigate"
            priority = "medium"
            rationale_points.append("High technical complexity with uncertain estimates")

        # Mature market + differentiation opportunity = proceed
        elif market_maturity == "mature" and strategic_rec == "differentiate":
            decision = "proceed"
            priority = "medium"
            rationale_points.append("Opportunity to differentiate in mature market")

        # Add cost-based rationale
        if cost > 300000:
            rationale_points.append(f"Significant investment required (${cost:,})")
        elif cost < 100000:
            rationale_points.append(f"Relatively low development cost (${cost:,})")

        # Add risk-based rationale
        if risk_score >= 8:
            rationale_points.append(f"Very high competitive risk (score: {risk_score}/10)")
        elif risk_score <= 3:
            rationale_points.append(f"Low competitive risk (score: {risk_score}/10)")

        return {
            "decision": decision,  # proceed, defer, fast_follower, investigate
            "priority": priority,  # high, medium, low
            "rationale": " | ".join(rationale_points) if rationale_points else "Balanced risk/reward profile",
            "estimated_roi_months": self._estimate_roi(cost, market_opportunity),
            "key_risks": self._identify_key_risks(cost_estimate, competitive_analysis),
            "success_factors": self._identify_success_factors(cost_estimate, competitive_analysis)
        }

    def _estimate_roi(self, cost: int, market_opportunity: Dict[str, Any]) -> str:
        """Estimate time to ROI based on cost and market size."""
        market_size = market_opportunity.get("size", "medium")
        growth_rate = market_opportunity.get("growth_rate", "stable")

        if market_size == "large" and growth_rate in ["growing", "rapid"]:
            if cost < 100000:
                return "3-6 months"
            elif cost < 250000:
                return "6-12 months"
            else:
                return "12-18 months"
        elif market_size == "medium":
            if cost < 100000:
                return "6-12 months"
            else:
                return "12-24 months"
        else:  # small market
            return "24+ months"

    def _identify_key_risks(
        self,
        cost_estimate: Dict[str, Any],
        competitive_analysis: Dict[str, Any]
    ) -> list:
        """Identify top 3 key risks."""
        risks = []

        # Technical risks
        tech_risks = cost_estimate.get("risks", [])
        if tech_risks:
            risks.extend(tech_risks[:2])  # Top 2 technical risks

        # Competitive risks
        comp_risks = competitive_analysis.get("risk_factors", [])
        if comp_risks:
            risks.extend(comp_risks[:2])  # Top 2 competitive risks

        # Return top 3 overall
        return risks[:3] if risks else ["No major risks identified"]

    def _identify_success_factors(
        self,
        cost_estimate: Dict[str, Any],
        competitive_analysis: Dict[str, Any]
    ) -> list:
        """Identify key success factors."""
        factors = []

        # Team capability
        team_size = cost_estimate.get("team_size", 0)
        if team_size <= 5:
            factors.append("Lean team can execute efficiently")

        # Technical barriers
        barriers = competitive_analysis.get("barriers_to_entry", {})
        if barriers.get("technical_complexity") == "high":
            factors.append("High technical barriers protect against competition")

        # Market timing
        market_opp = competitive_analysis.get("market_opportunity", {})
        if market_opp.get("urgency") in ["high", "critical"]:
            factors.append("Market timing is favorable")

        # Strategic fit
        if competitive_analysis.get("strategic_recommendation") == "first_mover":
            factors.append("First-mover advantage opportunity")

        return factors if factors else ["Standard execution required"]

    def _generate_summary(
        self,
        feature_name: str,
        cost_estimate: Dict[str, Any],
        competitive_analysis: Dict[str, Any],
        recommendation: Dict[str, Any]
    ) -> str:
        """Generate executive summary."""
        cost = cost_estimate.get("cost", 0)
        hours = cost_estimate.get("hours", 0)
        weeks = cost_estimate.get("duration_weeks", 0)
        team = cost_estimate.get("team_size", 0)

        risk_score = competitive_analysis.get("risk_score", 5)
        num_competitors = len(competitive_analysis.get("competitors", []))

        decision = recommendation.get("decision", "unknown")
        priority = recommendation.get("priority", "medium")

        return f"""EXECUTIVE SUMMARY: {feature_name}

COST: ${cost:,} | {hours} hours | {weeks} weeks | {team}-person team

COMPETITIVE RISK: {risk_score}/10 | {num_competitors} major competitors identified

RECOMMENDATION: {decision.upper()} (Priority: {priority.upper()})

RATIONALE: {recommendation.get('rationale', 'See detailed analysis')}

ESTIMATED ROI: {recommendation.get('estimated_roi_months', 'TBD')}"""
