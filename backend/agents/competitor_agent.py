"""
Competitor Agent: Market analysis and competitive intelligence.

Uses real-time web search (Serper API) to find competitors and
analyze competitive risks.
"""

import logging
from typing import Dict, Any

from .base_agent import BaseAgent
from utils.search import SerperSearch
from prompts.competitor_prompts import (
    get_competitor_system_prompt,
    get_competitor_user_prompt,
)

logger = logging.getLogger(__name__)


class CompetitorAgent(BaseAgent):
    """
    Competitor Agent for market analysis and competitive intelligence.

    Uses Serper API for real-time web search to find competitors
    and assess market risks.
    """

    def __init__(self):
        """Initialize Competitor Agent."""
        super().__init__()
        self.search = SerperSearch()
        logger.info("Competitor Agent initialized")

    # ------------------------------------------------------------------
    # Existing API (kept for compatibility)
    # ------------------------------------------------------------------

    def analyze(
        self,
        feature_description: str,
        feature_name: str = None,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """
        Analyze competitive landscape for a feature.

        Args:
            feature_description: Description of the feature
            feature_name: Optional name of the feature
            **kwargs: Additional parameters (e.g., industry)

        Returns:
            Dictionary with competitive analysis (LLM-defined schema).
        """
        try:
            # Step 1: Perform web search
            industry = kwargs.get("industry", "fintech")
            search_query = feature_name or feature_description

            logger.info(f"Searching for competitors: {search_query}")
            search_results = self.search.search_competitors(search_query, industry)

            # Step 2: Generate prompts
            system_prompt = get_competitor_system_prompt()
            user_prompt = get_competitor_user_prompt(
                feature_name or "Feature",
                feature_description,
                search_results,
            )

            # Step 3: Call LLM
            logger.info("Calling NVIDIA Nemotron for competitive analysis...")
            response = self._call_llm(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.3,  # Slightly higher for more creative analysis
                max_tokens=1200,
            )

            # Step 4: Parse response
            result = self._parse_json_response(response)

            # Step 5: Add metadata
            result["search_performed"] = True
            # crude count; fine for demo
            if isinstance(search_results, str):
                result["search_results_count"] = len(
                    [line for line in search_results.split("\n") if line.strip()]
                )
            else:
                result["search_results_count"] = 0

            # Step 6: Ensure minimum competitor count with fallback
            key_competitors = result.get("key_competitors", [])
            if len(key_competitors) < 3:
                logger.info(f"Only {len(key_competitors)} competitors found. Adding fallbacks.")

                # Industry-specific fallback competitors
                fallback_competitors = {
                    "banking": ["JPMorgan Chase", "Bank of America", "Wells Fargo", "Capital One", "Citibank"],
                    "fintech": ["Square", "Stripe", "PayPal", "Adyen", "Plaid"],
                    "payments": ["Visa", "Mastercard", "PayPal", "Square", "Stripe"],
                    "lending": ["SoFi", "LendingClub", "Prosper", "Upstart", "Affirm"],
                    "wealth": ["Betterment", "Wealthfront", "Robinhood", "E*TRADE", "Charles Schwab"],
                }

                # Get fallbacks for this industry (default to banking)
                industry_fallbacks = fallback_competitors.get(industry, fallback_competitors["banking"])

                # Add fallbacks until we have 3-5 competitors
                for competitor in industry_fallbacks:
                    if competitor not in key_competitors and len(key_competitors) < 5:
                        key_competitors.append(competitor)

                result["key_competitors"] = key_competitors
                result["fallback_competitors_added"] = True
                logger.info(f"Final competitor list: {key_competitors}")

            logger.info(
                f"Competitor Agent analysis complete: "
                f"risk_score={result.get('risk_score', 'N/A')}, "
                f"competitors={len(key_competitors)}"
            )
            return result

        except Exception as e:
            logger.error(f"Competitor Agent analysis failed: {str(e)}")
            # Return fallback analysis
            return {
                "competitors": [],
                "market_maturity": "unknown",
                "strategic_recommendation": "avoid",
                "risk_score": 5,
                "time_to_replicate_months": 6,
                "risk_factors": [f"Analysis failed: {str(e)}"],
                "market_opportunity": {},
                "search_performed": False,
                "error": str(e),
            }

    # ------------------------------------------------------------------
    # New API for OrchestratorV2 (Phase-1 normalized output)
    # ------------------------------------------------------------------

    def analyze_with_context(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enriched entrypoint for OrchestratorV2.

        Uses:
        - PM input (feature name/description)
        - industry from context
        - seed competitor facts

        Normalizes to the agreed Phase-1 schema:

        {
          "agent": "competitor_v1",
          "feature_name": str,
          "key_competitors": [str],
          "expected_response_time_sprints": int,
          "competitive_risk_level": "LOW"|"MEDIUM"|"HIGH",
          "likely_response_strategies": [str],
          "differentiation_factors": [str],
          "pricing_pressure_risk": str | None,
          "substitution_risk": str | None,
          "evidence_snippets": [str]
        }
        """
        feature_name = context.get("feature_name") or "Feature"
        feature_description = context.get("feature_description", "")
        industry = context.get("industry", "banking")
        seed_facts = context.get("seed_competitor_facts", []) or []

        # 1) Call existing analyze() to leverage real search + LLM
        base = self.analyze(
            feature_description=feature_description,
            feature_name=feature_name,
            industry=industry,
        )

        # 2) Extract/normalize competitor list
        key_competitors = (
            base.get("key_competitors")
            or base.get("competitors")
            or []
        )

        # 3) Derive response time in sprints
        sprints = base.get("expected_response_time_sprints")
        if not sprints:
            # fallback from months if present
            months = base.get("time_to_replicate_months")
            if months:
                # 1 sprint ~= 2 weeks ~= 0.5 months
                sprints = int(max(1, round(months / 0.5)))
            else:
                sprints = 4  # safe default

        # 4) Map numeric risk_score -> LOW / MEDIUM / HIGH
        risk_score = base.get("risk_score")
        if isinstance(risk_score, (int, float)):
            if risk_score <= 3:
                competitive_risk_level = "LOW"
            elif risk_score >= 8:
                competitive_risk_level = "HIGH"
            else:
                competitive_risk_level = "MEDIUM"
        else:
            competitive_risk_level = base.get(
                "competitive_risk_level", "MEDIUM"
            ).upper()

        # 5) Likely strategies & differentiation
        likely_response_strategies = base.get(
            "likely_response_strategies",
            [
                base.get("strategic_recommendation", "")
            ]
            if base.get("strategic_recommendation")
            else [],
        )

        differentiation_factors = base.get("differentiation_factors", [])
        if not differentiation_factors:
            differentiation_factors = [
                "Depth of integration with PNC core systems and analytics.",
                "Ability to orchestrate true omnichannel branch experiences.",
            ]

        # 6) Simple placeholders for pricing/substitution risk (could be refined)
        pricing_pressure_risk = base.get("pricing_pressure_risk")
        substitution_risk = base.get("substitution_risk")

        # 7) Evidence snippets from seed facts + any model commentary
        evidence_snippets = base.get("evidence_snippets", [])
        if seed_facts:
            evidence_snippets = seed_facts + evidence_snippets

        normalized = {
            "agent": "competitor_v1",
            "feature_name": feature_name,
            "key_competitors": key_competitors,
            "expected_response_time_sprints": int(sprints),
            "competitive_risk_level": competitive_risk_level,
            "likely_response_strategies": likely_response_strategies,
            "differentiation_factors": differentiation_factors,
            "pricing_pressure_risk": pricing_pressure_risk,
            "substitution_risk": substitution_risk,
            "evidence_snippets": evidence_snippets,
        }

        logger.info(
            "CompetitorAgent.analyze_with_context -> "
            f"{len(normalized['key_competitors'])} competitors, "
            f"{normalized['competitive_risk_level']} risk, "
            f"{normalized['expected_response_time_sprints']} sprints to replicate"
        )

        return normalized
