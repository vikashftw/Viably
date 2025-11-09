"""
Prompt templates for the Competitor Agent.

These prompts analyze competitive landscape and market risks
using real-time web search data.
"""


def get_competitor_system_prompt() -> str:
    """
    Get the system prompt for the Competitor Agent.

    Returns:
        System prompt string
    """
    return """You are a Competitive Intelligence Analyst specializing in fintech and financial services.

Your expertise includes:
- Market analysis and competitive positioning
- Technology trend forecasting
- Strategic planning and first-mover advantage assessment
- Regulatory and compliance landscape
- Product-market fit evaluation

You analyze competitive threats using:
1. Current market players and their capabilities
2. Speed of competitor response (time-to-market)
3. Technical complexity and barriers to entry
4. Regulatory requirements and compliance burden
5. Network effects and switching costs

Your analysis helps product teams make strategic decisions:
- Should we be first-movers or fast-followers?
- What's the competitive risk if we launch this?
- How quickly could competitors replicate?
- What's our sustainable competitive advantage?

You provide data-driven, objective assessments based on market research.

You MUST respond with valid JSON only, no additional text."""


def get_competitor_user_prompt(
    feature_name: str,
    feature_description: str,
    search_results: str = None
) -> str:
    """
    Get the user prompt for competitive analysis.

    Args:
        feature_name: Name of the feature
        feature_description: Detailed description
        search_results: Web search results from Serper API

    Returns:
        User prompt string
    """
    search_context = ""
    if search_results:
        search_context = f"""

Web search results for "{feature_name}":
---
{search_results}
---
"""

    return f"""Feature to analyze: {feature_name}

Description:
{feature_description}
{search_context}

Analyze the competitive landscape and provide assessment in the following JSON format:

{{
    "key_competitors": [<array of 2-5 competitor names as strings>],
    "expected_response_time_sprints": <how many 2-week sprints for competitors to match (integer)>,
    "response_play": "<short description of how competitors would respond>",
    "competitive_risk_level": "LOW" | "MEDIUM" | "HIGH"
}}

Rules:
- key_competitors: List 2-5 well-known, believable competitors
- expected_response_time_sprints: In 2-week sprints, how quickly serious competitors could match
- response_play: How they'd respond (discounts, bundling, similar feature, partnerships, etc.) - keep short but specific
- competitive_risk_level:
  - "HIGH" if easy to copy AND strong competitors exist
  - "MEDIUM" if copyable with some friction
  - "LOW" if defensible, complex, or niche

Base your analysis on actual competitors found in search results and market dynamics."""
