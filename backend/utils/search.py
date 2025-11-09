"""
Serper API integration for real-time web search.

Uses Serper API to get Google search results for competitive analysis.
"""

import os
import logging
import requests
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class SerperSearch:
    """
    Wrapper for Serper API (Google-powered web search).

    Provides methods to search for competitors and analyze market data.
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Serper API client.

        Args:
            api_key: Serper API key (defaults to SERPER_API_KEY env var)
        """
        self.api_key = api_key or os.getenv("SERPER_API_KEY")
        self.base_url = "https://google.serper.dev/search"

        if not self.api_key:
            logger.warning("SERPER_API_KEY not found in environment variables")

    def search(
        self,
        query: str,
        num_results: int = 10,
        search_type: str = "search"
    ) -> Dict[str, Any]:
        """
        Perform a web search using Serper API.

        Args:
            query: Search query string
            num_results: Number of results to return (max 100)
            search_type: Type of search ("search", "news", "images")

        Returns:
            Dictionary containing search results

        Raises:
            Exception: If API call fails
        """
        if not self.api_key:
            raise ValueError("Serper API key not configured")

        headers = {
            "X-API-KEY": self.api_key,
            "Content-Type": "application/json"
        }

        payload = {
            "q": query,
            "num": min(num_results, 100)  # API max is 100
        }

        try:
            response = requests.post(
                self.base_url,
                json=payload,
                headers=headers,
                timeout=10
            )
            response.raise_for_status()
            return response.json()

        except requests.exceptions.Timeout:
            logger.error(f"Serper API timeout for query: {query}")
            raise Exception("Search API timeout")

        except requests.exceptions.HTTPError as e:
            logger.error(f"Serper API HTTP error: {str(e)}")
            raise Exception(f"Search API error: {str(e)}")

        except Exception as e:
            logger.error(f"Serper API error: {str(e)}")
            raise

    def search_competitors(
        self,
        feature_name: str,
        industry: str = "fintech"
    ) -> str:
        """
        Search for competitors offering similar features.

        Args:
            feature_name: Name/description of the feature
            industry: Industry context (e.g., "fintech", "banking")

        Returns:
            Formatted string with search results for LLM consumption
        """
        # Construct search query
        query = f"{feature_name} {industry} competitors products"

        try:
            results = self.search(query, num_results=10)
            return self._format_search_results(results)

        except Exception as e:
            logger.error(f"Competitor search failed: {str(e)}")
            return f"Search failed: {str(e)}\n\nUsing fallback: No real-time data available."

    def _format_search_results(self, results: Dict[str, Any]) -> str:
        """
        Format search results for LLM consumption.

        Args:
            results: Raw Serper API response

        Returns:
            Formatted string with key information
        """
        formatted = []

        # Extract organic results
        organic = results.get("organic", [])
        for i, result in enumerate(organic[:10], 1):
            title = result.get("title", "No title")
            snippet = result.get("snippet", "No description")
            link = result.get("link", "")

            formatted.append(f"{i}. {title}")
            formatted.append(f"   {snippet}")
            formatted.append(f"   Source: {link}")
            formatted.append("")

        # Extract knowledge graph if available (often contains company info)
        knowledge_graph = results.get("knowledgeGraph", {})
        if knowledge_graph:
            formatted.insert(0, "=== KEY INFORMATION ===")
            formatted.insert(1, f"Title: {knowledge_graph.get('title', 'N/A')}")
            formatted.insert(2, f"Type: {knowledge_graph.get('type', 'N/A')}")
            formatted.insert(3, f"Description: {knowledge_graph.get('description', 'N/A')}")
            formatted.insert(4, "")
            formatted.insert(5, "=== SEARCH RESULTS ===")
            formatted.insert(6, "")

        # Extract related searches for additional context
        related = results.get("relatedSearches", [])
        if related:
            formatted.append("=== RELATED SEARCHES ===")
            for search in related[:5]:
                formatted.append(f"- {search.get('query', '')}")

        return "\n".join(formatted)

    def quick_search(self, query: str) -> List[Dict[str, str]]:
        """
        Quick search returning just titles and snippets.

        Args:
            query: Search query

        Returns:
            List of {title, snippet, link} dictionaries
        """
        try:
            results = self.search(query, num_results=5)
            organic = results.get("organic", [])

            return [
                {
                    "title": r.get("title", ""),
                    "snippet": r.get("snippet", ""),
                    "link": r.get("link", "")
                }
                for r in organic
            ]

        except Exception as e:
            logger.error(f"Quick search failed: {str(e)}")
            return []
