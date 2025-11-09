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

        logger.info(f"Market intelligence analysis complete. Modules run: {results['modules_run']}")

        return results

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
        # Construct specific market research query
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

        # Regex patterns for market data
        # Matches: $47.3B, $2.4 billion, USD 47.3 billion, etc.
        size_pattern = r'\$?\s*(\d+\.?\d*)\s*(billion|B|trillion|T|million|M)'
        # Matches: 12.4% CAGR, 12.4% growth, CAGR of 12.4%
        cagr_pattern = r'(\d+\.?\d*)\s*%\s*(?:CAGR|growth|annually)'

        for result in organic_results[:3]:  # Check first 3 results
            snippet = result.get("snippet", "")
            title = result.get("title", "")
            link = result.get("link", "")

            # Try to extract market size
            if market_size_usd is None:
                size_match = re.search(size_pattern, snippet, re.IGNORECASE)
                if size_match:
                    value = float(size_match.group(1))
                    unit = size_match.group(2).lower()

                    # Convert to USD
                    if unit in ['billion', 'b']:
                        market_size_usd = int(value * 1_000_000_000)
                    elif unit in ['trillion', 't']:
                        market_size_usd = int(value * 1_000_000_000_000)
                    elif unit in ['million', 'm']:
                        market_size_usd = int(value * 1_000_000)

                    source_url = link
                    source_title = title

            # Try to extract CAGR
            if growth_rate_cagr is None:
                cagr_match = re.search(cagr_pattern, snippet, re.IGNORECASE)
                if cagr_match:
                    growth_rate_cagr = float(cagr_match.group(1)) / 100  # Convert to decimal

                    if source_url is None:  # If we haven't set source yet
                        source_url = link
                        source_title = title

        # Fallback if no data found
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
            "source_url": source_url or organic_results[0].get("link", ""),
            "source_title": source_title or organic_results[0].get("title", ""),
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

        Args:
            feature_name: Feature name
            industry: Industry context

        Returns:
            List of trend dictionaries with trend text and source
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

                # Extract trend from snippet
                # Look for sentences with trend indicators
                if any(word in snippet.lower() for word in ['trend', 'growth', 'increase', 'decrease', 'shift']):
                    trends.append({
                        "trend": snippet[:200],  # First 200 chars
                        "source": f"{title}",
                        "source_url": link
                    })

            return trends[:3]  # Return top 3 trends

        except Exception as e:
            logger.error(f"Trends search failed: {str(e)}")
            return []

    def _search_competitor_moves(self, industry: str) -> List[Dict[str, str]]:
        """
        Search for recent competitor announcements and moves.

        Args:
            industry: Industry context

        Returns:
            List of competitor news items with source
        """
        # Focus on major banks for PNC demo
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
                    "date": "2025"  # Placeholder - Serper doesn't always provide dates
                })

            return news_items

        except Exception as e:
            logger.error(f"Competitor news search failed: {str(e)}")
            return []

    def _search_regulatory(self, industry: str) -> List[Dict[str, str]]:
        """
        Search for regulatory and compliance news.

        Args:
            industry: Industry context

        Returns:
            List of regulatory items with source
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

        Returns:
            Dict with placeholder market data
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

        Args:
            results: Market intelligence results dictionary
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
    # Configure logging for standalone test
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    print("=" * 60)
    print("MARKET INTELLIGENCE AGENT - STANDALONE TEST")
    print("=" * 60)
    print()

    # Initialize agent
    agent = MarketIntelligenceAgent()

    # Test: Market size + competitors (optimal for demo)
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
    print(f"Results saved to: backend/data/analysis_history/")
    print("=" * 60)
