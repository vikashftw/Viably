"""
Competitor Agent: Market analysis and competitive intelligence.

Uses real-time web search (Serper API) to find competitors and
analyze competitive risks.
"""

import logging
from typing import Dict, Any
from .base_agent import BaseAgent
from utils.search import SerperSearch
from prompts.competitor_prompts import get_competitor_system_prompt, get_competitor_user_prompt

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

    def analyze(self, feature_description: str, feature_name: str = None, **kwargs) -> Dict[str, Any]:
        """
        Analyze competitive landscape for a feature.

        Args:
            feature_description: Description of the feature
            feature_name: Optional name of the feature
            **kwargs: Additional parameters (e.g., industry)

        Returns:
            Dictionary with competitive analysis:
            {
                "competitors": [...],
                "market_maturity": str,
                "time_to_replicate": str,
                "barriers_to_entry": {...},
                "risk_score": int,
                "risk_factors": [str],
                "strategic_recommendation": str,
                "recommendation_rationale": str,
                "market_opportunity": {...}
            }
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
                search_results
            )

            # Step 3: Call LLM
            logger.info("Calling NVIDIA Nemotron for competitive analysis...")
            response = self._call_llm(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.3,  # Slightly higher for more creative analysis
                max_tokens=1200
            )

            # Step 4: Parse response
            result = self._parse_json_response(response)

            # Step 5: Add metadata
            result["search_performed"] = True
            result["search_results_count"] = len(search_results.split('\n'))

            logger.info(f"Competitor Agent analysis complete: Risk score {result.get('risk_score', 'N/A')}/10")
            return result

        except Exception as e:
            logger.error(f"Competitor Agent analysis failed: {str(e)}")
            # Return fallback analysis
            return {
                "competitors": [],
                "market_maturity": "unknown",
                "time_to_replicate": "unknown",
                "barriers_to_entry": {
                    "technical_complexity": "unknown",
                    "regulatory_requirements": "unknown",
                    "capital_requirements": "unknown",
                    "network_effects": "unknown"
                },
                "risk_score": 5,
                "risk_factors": [f"Analysis failed: {str(e)}"],
                "strategic_recommendation": "unknown",
                "recommendation_rationale": "Unable to complete analysis due to error",
                "market_opportunity": {
                    "size": "unknown",
                    "growth_rate": "unknown",
                    "urgency": "unknown"
                },
                "search_performed": False,
                "error": str(e)
            }
