"""
Market Intelligence Agent - Real-time market research using Google search.

Provides modular market intelligence with verifiable sources:
- Market size + CAGR
- Industry trends
- Competitor moves/announcements
- Regulatory/compliance news

All data points include source URLs for judge verification.
"""

import os
import json
import logging
import re
from datetime import datetime
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv

# Import existing Serper search utility
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from utils.search import SerperSearch

load_dotenv()

logger = logging.getLogger(__name__)


class MarketIntelligenceAgent:
    """
    Market Intelligence Agent using real-time Google search.

    Modular design allows enabling/disabling specific search types
    to optimize token usage.
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Market Intelligence Agent.

        Args:
            api_key: Serper API key (defaults to SERPER_API_KEY env var)
        """
        self.searcher = SerperSearch(api_key)
        self.data_dir = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "data",
            "analysis_history"
        )

        # Ensure data directory exists
        os.makedirs(self.data_dir, exist_ok=True)

        logger.info("Market Intelligence Agent initialized")

    # ------------------------------------------------------------------
    # Existing API
    # ------------------------------------------------------------------

    def analyze(
        self,
        feature_name: str,
        industry: str = "banking",
        config: Optional[Dict[str, bool]] = None
    ) -> Dict[str, Any]:
        """
        Perform market intelligence analysis.

        Args:
            feature_name: Name of the feature to research
            industry: Industry context (default: "banking")
            config: Dictionary controlling which modules to run:
                - search_market_size: bool (default: True)
                - search_trends: bool (default: False)
                - search_competitors: bool (default: False)
                - search_regulatory: bool (default: False)

        Returns:
            Dictionary with market intelligence data and sources
        """
        # Default config: only market size to save tokens
        if config is None:
            config = {
                "search_market_size": True,
                "search_trends": False,
                "search_competitors": False,
                "search_regulatory": False
            }

        logger.info(f"Analyzing market for: {feature_name} in {industry}")
        logger.info(f"Config: {config}")

        results = {
            "feature_name": feature_name,
            "industry": industry,
            "timestamp": datetime.now().isoformat(),
            "modules_run": []
        }

        # Module 1: Market Size + CAGR (most important)
        if config.get("search_market_size", True):
            logger.info("Running market size search...")
            results["market_data"] = self._search_market_size(feature_name, industry)
            results["modules_run"].append("market_size")

        # Module 2: Industry Trends
        if config.get("search_trends", False):
            logger.info("Running trends search...")
            results["industry_trends"] = self._search_trends(feature_name, industry)
            results["modules_run"].append("trends")

        # Module 3: Competitor Moves
        if config.get("search_competitors", False):
            logger.info("Running competitor news search...")
            results["competitor_news"] = self._search_competitor_moves(industry)
            results["modules_run"].append("competitor_moves")

        # Module 4: Regulatory News
        if config.get("search_regulatory", False):
            logger.info("Running regulatory search...")
            results["regulatory"] = self._search_regulatory(industry)
            results["modules_run"].append("regulatory")

        # Save results to JSON
        self._save_results(results)

        logger.info(
            f"Market intelligence analysis complete. Modules run: {results['modules_run']}"
        )

        return results

    # ------------------------------------------------------------------
    # NEW: Normalized API for OrchestratorV2 (Phase-1)
    # ------------------------------------------------------------------

    def analyze_with_context(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enriched entrypoint for OrchestratorV2.

        Uses:
        - PM input (feature name / description)
        - industry from context
        - seed market facts

        Produces normalized Phase-1 schema:

        {
          "agent": "market_intel_v1",
          "feature_name": str,
          "focus_region": "US",
          "primary_customer_segments": [str],
          "estimated_market_size_usd": int,
          "growth_rate_percent": int,
          "adoption_readiness": "LOW"|"MEDIUM"|"HIGH",
          "regulatory_impact": "LOW"|"MEDIUM"|"HIGH",
          "operational_impact": "LOW"|"MEDIUM"|"HIGH",
          "adoption_drivers": [str],
          "adoption_barriers": [str],
          "evidence_snippets": [str]
        }
        """
        feature_name = context.get("feature_name") or "Feature"
        industry = context.get("industry", "banking")
        seed_facts = context.get("seed_market_facts", []) or []
        target_user = (context.get("target_user") or "").lower()

        # 1) Call existing analyze() for real/heuristic data (market size only by default)
        base = self.analyze(
            feature_name=feature_name,
            industry=industry,
            config={"search_market_size": True}
        )

        market_data = base.get("market_data", {}) or {}
        raw_size = market_data.get("market_size_usd", 0)
        raw_cagr = market_data.get("growth_rate_cagr", 0.0)

        estimated_market_size_usd = int(raw_size) if raw_size else 0
        growth_rate_percent = int(round(raw_cagr * 100)) if raw_cagr else 0

        # 2) Derive focus region and segments (PNC-style)
        if industry.lower() in ["banking", "fintech"]:
            focus_region = "US"
            primary_segments: List[str] = []
            # Rough mapping based on feature / target hints
            if "branch" in feature_name.lower():
                primary_segments.append("Retail branch users")
                primary_segments.append("Small business customers using in-branch services")
            else:
                primary_segments.append("Retail banking customers")
                primary_segments.append("Small business banking customers")
        else:
            focus_region = "Global"
            primary_segments = ["Target customers in relevant vertical"]

        # 3) Adoption readiness heuristic
        # High if we have non-zero market + decent growth, else medium/low
        if estimated_market_size_usd > 0 and growth_rate_percent >= 5:
            adoption_readiness = "HIGH"
        elif estimated_market_size_usd > 0:
            adoption_readiness = "MEDIUM"
        else:
            adoption_readiness = "LOW"

        # 4) Regulatory / operational impact heuristics
        if industry.lower() in ["banking", "fintech"]:
            regulatory_impact = "HIGH"
            operational_impact = "HIGH"
        else:
            regulatory_impact = "MEDIUM"
            operational_impact = "MEDIUM"

        # 5) Adoption drivers / barriers tuned for PNC-style smart branch / digital work
        adoption_drivers = [
            "Customers expect seamless digital-to-branch experiences.",
            "Need to justify branch and channel investments with measurable outcomes.",
        ]

        adoption_barriers = [
            "Operational change management for branch and frontline staff.",
            "Data privacy, model risk, and compliance reviews.",
        ]

        # 6) Evidence snippets: combine seed facts + any search source
        evidence_snippets: List[str] = list(seed_facts)

        source_url = market_data.get("source_url")
        source_title = market_data.get("source_title")
        if source_url or source_title:
            snippet = f"Market sizing reference: {source_title or ''} ({source_url or ''})"
            evidence_snippets.append(snippet.strip())

        normalized = {
            "agent": "market_intel_v1",
            "feature_name": feature_name,
            "focus_region": focus_region,
            "primary_customer_segments": primary_segments,
            "estimated_market_size_usd": estimated_market_size_usd,
            "growth_rate_percent": growth_rate_percent,
            "adoption_readiness": adoption_readiness,
            "regulatory_impact": regulatory_impact,
            "operational_impact": operational_impact,
            "adoption_drivers": adoption_drivers,
            "adoption_barriers": adoption_barriers,
            "evidence_snippets": evidence_snippets,
        }

        logger.info(
            "MarketIntelligenceAgent.analyze_with_context -> "
            f"${normalized['estimated_market_size_usd']:,}, "
            f"{normalized['growth_rate_percent']}% growth, "
            f"{normalized['adoption_readiness']} readiness"
        )

        return normalized

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _search_market_size(
        self,
        feature_name: str,
        industry: str
    ) -> Dict[str, Any]:
        """
        Search for market size and growth rate.

        Args:
            feature_name: Feature name
            industry: Industry context

        Returns:
            Dict with market_size_usd, growth_rate_cagr, source_url
        """
        query = f"{feature_name} {industry} market size 2025 forecast CAGR"

        try:
            search_results = self.searcher.search(query, num_results=5)
            organic = search_results.get("organic", [])

            if not organic:
                return self._market_size_fallback()

            # Extract market data from search results
            market_data = self._extract_market_data(organic)

            return market_data

        except Exception as e:
            logger.error(f"Market size search failed: {str(e)}")
            return self._market_size_fallback()

    def _extract_market_data(self, organic_results: List[Dict]) -> Dict[str, Any]:
        """
        Extract market size and CAGR from search results.

        Uses regex to find dollar amounts and percentage growth rates.

        Args:
            organic_results: List of search results

        Returns:
            Dict with extracted market data
        """
        market_size_usd = None
        growth_rate_cagr = None
        source_url = None
        source_title = None

        size_pattern = r'\$?\s*(\d+\.?\d*)\s*(billion|B|trillion|T|million|M)'

        # Enhanced CAGR patterns - try multiple variations
        cagr_patterns = [
            r'(\d+\.?\d*)\s*%\s*(?:CAGR|cagr)',  # "12% CAGR" or "12% cagr"
            r'(\d+\.?\d*)\s*(?:percent|%)\s*(?:annual|yearly|per year)',  # "12 percent annual" or "12% per year"
            r'compound.*?(?:growth|rate).*?(\d+\.?\d*)\s*%',  # "compound growth rate of 12%"
            r'CAGR.*?(\d+\.?\d*)\s*(?:percent|%)',  # "CAGR of 12 percent"
            r'grow.*?(?:at|by).*?(\d+\.?\d*)\s*(?:percent|%)',  # "grow at 12 percent" or "grow by 12%"
            r'(\d+\.?\d*)\s*%\s*(?:growth|annually)',  # "12% growth" or "12% annually"
        ]

        for result in organic_results[:3]:
            snippet = result.get("snippet", "")
            title = result.get("title", "")
            link = result.get("link", "")

            # Market size
            if market_size_usd is None:
                size_match = re.search(size_pattern, snippet, re.IGNORECASE)
                if size_match:
                    value = float(size_match.group(1))
                    unit = size_match.group(2).lower()
                    if unit in ['billion', 'b']:
                        market_size_usd = int(value * 1_000_000_000)
                    elif unit in ['trillion', 't']:
                        market_size_usd = int(value * 1_000_000_000_000)
                    elif unit in ['million', 'm']:
                        market_size_usd = int(value * 1_000_000)
                    source_url = link
                    source_title = title

            # CAGR - try multiple patterns
            if growth_rate_cagr is None:
                for cagr_pattern in cagr_patterns:
                    cagr_match = re.search(cagr_pattern, snippet, re.IGNORECASE)
                    if cagr_match:
                        try:
                            rate_value = float(cagr_match.group(1))
                            growth_rate_cagr = rate_value / 100.0
                            logger.info(f"Extracted CAGR: {rate_value}% using pattern: {cagr_pattern}")
                            if source_url is None:
                                source_url = link
                                source_title = title
                            break  # Found CAGR, stop trying patterns
                        except (ValueError, IndexError) as e:
                            logger.debug(f"CAGR extraction failed for pattern {cagr_pattern}: {e}")
                            continue

        if market_size_usd is None:
            market_size_usd = 0
            note = "Market size not found in search results"
        else:
            note = "Extracted from search results"

        if growth_rate_cagr is None:
            growth_rate_cagr = 0.0

        return {
            "market_size_usd": market_size_usd,
            "growth_rate_cagr": growth_rate_cagr,
            "source_url": source_url or (organic_results[0].get("link", "") if organic_results else ""),
            "source_title": source_title or (organic_results[0].get("title", "") if organic_results else ""),
            "note": note,
            "confidence": "HIGH" if market_size_usd > 0 and growth_rate_cagr > 0 else "MEDIUM"
        }

    def _search_trends(
        self,
        feature_name: str,
        industry: str
    ) -> List[Dict[str, str]]:
        """
        Search for industry trends.
        """
        query = f"{industry} trends 2025 {feature_name}"

        try:
            search_results = self.searcher.search(query, num_results=5)
            organic = search_results.get("organic", [])

            trends = []
            for result in organic[:5]:
                snippet = result.get("snippet", "")
                title = result.get("title", "")
                link = result.get("link", "")
                if any(word in snippet.lower() for word in ['trend', 'growth', 'increase', 'decrease', 'shift']):
                    trends.append({
                        "trend": snippet[:200],
                        "source": title,
                        "source_url": link
                    })

            return trends[:3]

        except Exception as e:
            logger.error(f"Trends search failed: {str(e)}")
            return []

    def _search_competitor_moves(self, industry: str) -> List[Dict[str, str]]:
        """
        Search for recent competitor announcements and moves.
        """
        if industry.lower() in ['banking', 'fintech']:
            competitors = ['Chase', 'Bank of America', 'Wells Fargo', 'Citibank']
            query = f"{' OR '.join(competitors)} new branches digital transformation 2025"
        else:
            query = f"{industry} competitors news announcements 2025"

        try:
            search_results = self.searcher.search(query, num_results=5)
            organic = search_results.get("organic", [])

            news_items = []
            for result in organic[:3]:
                news_items.append({
                    "news": result.get("snippet", ""),
                    "source": result.get("title", ""),
                    "source_url": result.get("link", ""),
                    "date": "2025"
                })

            return news_items

        except Exception as e:
            logger.error(f"Competitor news search failed: {str(e)}")
            return []

    def _search_regulatory(self, industry: str) -> List[Dict[str, str]]:
        """
        Search for regulatory and compliance news.
        """
        query = f"{industry} regulations compliance requirements 2025 new rules"

        try:
            search_results = self.searcher.search(query, num_results=5)
            organic = search_results.get("organic", [])

            regulatory_items = []
            for result in organic[:3]:
                regulatory_items.append({
                    "regulation": result.get("snippet", ""),
                    "source": result.get("title", ""),
                    "source_url": result.get("link", "")
                })

            return regulatory_items

        except Exception as e:
            logger.error(f"Regulatory search failed: {str(e)}")
            return []

    def _market_size_fallback(self) -> Dict[str, Any]:
        """
        Fallback market data when search fails.
        """
        return {
            "market_size_usd": 0,
            "growth_rate_cagr": 0.0,
            "source_url": "",
            "source_title": "Search failed - no data available",
            "note": "Market data unavailable",
            "confidence": "LOW"
        }

    def _save_results(self, results: Dict[str, Any]) -> None:
        """
        Save analysis results to JSON file.
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"market_intel_{timestamp}.json"
        filepath = os.path.join(self.data_dir, filename)

        try:
            with open(filepath, 'w') as f:
                json.dump(results, f, indent=2)

            logger.info(f"Market intelligence results saved to: {filepath}")

        except Exception as e:
            logger.error(f"Failed to save results: {str(e)}")


# Standalone test functionality
if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    print("=" * 60)
    print("MARKET INTELLIGENCE AGENT - STANDALONE TEST")
    print("=" * 60)
    print()

    agent = MarketIntelligenceAgent()

    print("TEST: Market Size + Competitor News (Demo Config)")
    print("-" * 60)
    results = agent.analyze(
        feature_name="Smart Branch Connect",
        industry="banking",
        config={
            "search_market_size": True,
            "search_competitors": True
        }
    )
    print(json.dumps(results, indent=2))
    print()
    print("=" * 60)
    print("TEST COMPLETE!")
    print("Results saved to: backend/data/analysis_history/")
    print("=" * 60)
