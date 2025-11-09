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
        {{
            "name": "<competitor name>",
            "market_position": "<leader/emerging/niche>",
            "has_feature": <true/false>,
            "feature_maturity": "<none/beta/production>",
            "key_differentiators": [<array of 1-2 strings>]
        }}
    ],
    "market_maturity": "<emerging/growing/mature/saturated>",
    "time_to_replicate": "<estimation like '2-4 weeks', '2-3 months', '6+ months'>",
    "barriers_to_entry": {{
        "technical_complexity": "<low/medium/high>",
        "regulatory_requirements": "<none/moderate/strict>",
        "capital_requirements": "<low/medium/high>",
        "network_effects": "<weak/moderate/strong>"
    }},
    "risk_score": <overall competitive risk 0-10, integer>,
    "risk_factors": [<array of 2-3 key risk factors as strings>],
    "strategic_recommendation": "<first_mover/fast_follower/differentiate/avoid>",
    "recommendation_rationale": "<1-2 sentence explanation>",
    "market_opportunity": {{
        "size": "<small/medium/large>",
        "growth_rate": "<declining/stable/growing/rapid>",
        "urgency": "<low/medium/high/critical>"
    }}
}}

Base your analysis on:
1. Actual competitors found in search results
2. Market dynamics and trends
3. Technical feasibility and barriers
4. Strategic timing considerations

Be objective and data-driven. Highlight both opportunities and risks."""
