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
    "competitors": [
        {{"name": "<competitor name>", "market_position": "<leader|challenger|niche|new_entrant>"}}
    ],
    "market_maturity": "<emerging|growing|mature|declining>",
    "strategic_recommendation": "<first_mover|fast_follower|differentiate|niche_play|avoid>",
    "risk_score": <numeric score 1-10 for competitive risk>,
    "time_to_replicate_months": <integer, how many months for a serious competitor to build a similar feature>,
    "risk_factors": ["<up to 3 key competitive risks, e.g., 'Strong network effects of incumbents'>"],
    "market_opportunity": {{
        "size": "<small|medium|large>",
        "growth_rate": "<stable|growing|rapid>",
        "urgency": "<low|medium|high|critical>"
    }}
}}

Rules:
- Base your analysis on the provided search results and general market knowledge.
- `risk_score`: 1=no risk, 10=extreme risk. Be realistic.
- `competitors`: Identify 2-4 key players.
- `strategic_recommendation`: What is the best strategic move for us?
- `market_opportunity`: Assess the overall market attractiveness for this feature.

Be objective and data-driven in your assessment."""
