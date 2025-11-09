"""
Prompt templates for the Implementation Planner Agent.

These prompts are designed to extract actionable implementation context
from multi-agent analysis results for Postman integration.
"""


def get_implementation_planner_system_prompt() -> str:
    """
    Get the system prompt for the Implementation Planner Agent.

    Returns:
        System prompt string
    """
    return """You are a Technical Architect and Implementation Specialist with deep expertise in:
- Full-stack development (React/Next.js, Python/FastAPI, mobile)
- Software project planning and task breakdown
- Code organization and file structure best practices
- Technology stack analysis

Your role is to analyze feature requirements and provide actionable implementation guidance including:
1. Search patterns for finding relevant code in existing codebases
2. File types and directory structures to explore
3. Granular task breakdown with estimates
4. Technology-specific implementation context

You understand how to:
- Extract technology keywords from feature descriptions
- Map similar projects to file structure recommendations
- Break down sprints into concrete developer tasks
- Estimate effort at the task level (hours, not just sprints)

You MUST respond with valid JSON only, no additional text."""


def get_implementation_planner_user_prompt(
    feature_name: str,
    feature_description: str,
    engineer_analysis: dict,
    similar_features: list = None,
    market_intelligence: dict = None,
    competitor_analysis: dict = None,
    roi_scenarios: dict = None
) -> str:
    """
    Get the user prompt for implementation planning.

    Args:
        feature_name: Name of the feature
        feature_description: Detailed description
        engineer_analysis: Analysis from Engineer Agent (cost, sprints, skills)
        similar_features: List of similar features (from Similar Feature Agent)
        market_intelligence: Market data (optional)
        competitor_analysis: Competitive insights (optional)
        roi_scenarios: ROI projections (optional)

    Returns:
        User prompt string
    """
    # Extract similar project context
    similar_context = ""
    if similar_features and len(similar_features) > 0:
        similar_context = "\n\nSimilar Past Projects (for context):\n"
        for i, proj in enumerate(similar_features[:3], 1):
            similar_context += f"""\n{i}. {proj.get('name', 'Unknown')}
   - Technologies: {', '.join(proj.get('skills_required', []))}
   - Domain: {proj.get('domain', 'N/A')}
   - Complexity: {proj.get('complexity', 'unknown')}"""

    # Extract engineer analysis context
    sprints = engineer_analysis.get('estimated_sprints', 0) or engineer_analysis.get('duration_weeks', 0) // 2
    engineers = engineer_analysis.get('estimated_engineers', 0) or engineer_analysis.get('team_size', 0)
    cost = engineer_analysis.get('estimated_cost_usd', 0) or engineer_analysis.get('cost', 0)
    skills = engineer_analysis.get('skills_required', [])

    # Market intelligence context (if available)
    market_context = ""
    if market_intelligence and market_intelligence.get('industry_trends'):
        trends = market_intelligence['industry_trends'][:2]  # Top 2 trends
        market_context = f"\n\nMarket Trends:\n" + "\n".join([f"- {t.get('trend', '')}" for t in trends])

    competitor_context = ""
    if competitor_analysis:
        risk = competitor_analysis.get('competitive_risk_level') or competitor_analysis.get('risk_level')
        response = competitor_analysis.get('expected_response_time_sprints') or competitor_analysis.get('time_to_replicate_months')
        differentiators = competitor_analysis.get('differentiation_factors', []) or competitor_analysis.get('differentiators', [])
        competitor_context = "\n\nCompetitive Landscape:\n"
        if risk:
            competitor_context += f"- Risk Level: {risk}\n"
        if response:
            suffix = "sprints" if isinstance(response, int) else ""
            competitor_context += f"- Expected Copy Time: {response} {suffix}\n"
        if differentiators:
            competitor_context += f"- Differentiation Focus: {', '.join(differentiators[:3])}\n"

    roi_context = ""
    if roi_scenarios:
        base = roi_scenarios.get('base_case', {})
        best = roi_scenarios.get('best_case', {})
        worst = roi_scenarios.get('worst_case', {})
        roi_context = "\n\nROI Targets:"
        if base:
            roi_context += f"\n- Base Case ROI: {base.get('roi_percent', 'N/A')}% (payback {base.get('payback_period_months', 'N/A')} mo)"
        if best:
            roi_context += f"\n- Upside ROI: {best.get('roi_percent', 'N/A')}%"
        if worst:
            roi_context += f"\n- Downside ROI: {worst.get('roi_percent', 'N/A')}%"

    return f"""Feature to Plan: {feature_name}

Description:
{feature_description}

Engineer Analysis:
- Estimated Sprints: {sprints}
- Team Size: {engineers} engineers
- Total Cost: ${cost:,}
- Required Skills: {', '.join(skills) if skills else 'Not specified'}
{similar_context}{market_context}{competitor_context}{roi_context}

Generate an implementation plan in the following JSON format:

{{
    "search_patterns": [<10-15 keywords to search in codebase (strings like "BranchLocator", "mobile", "CustomerProfile")>],
    "file_types": [<file extensions to examine (e.g., "tsx", "py", "js", "ts")>],
    "suggested_directories": [<directory paths where code likely exists (e.g., "src/features/smart-branch", "backend/api/branch")>],
    "tasks": [
        {{
            "title": "<concise task title>",
            "description": "<2-3 sentence task description>",
            "skills_required": [<array of skills needed>],
            "estimated_hours": <integer hours>,
            "priority": "<high|medium|low>"
        }}
    ],
    "suggested_file_structure": {{
        "directories": [<array of directory paths to create>],
        "files": [
            {{
                "path": "<file path>",
                "type": "<file type/extension>",
                "purpose": "<what this file does>"
            }}
        ]
    }},
    "implementation_context": "<2-3 paragraph natural language summary of implementation approach, key technical decisions, and integration points>"
}}

Task Breakdown Rules:
- Create {sprints * 3} tasks (approximately 3 tasks per sprint)
- Each task should be 8-40 hours of work
- Total task hours should roughly match: {cost / 150} hours
- Distribute tasks across skills: {', '.join(skills) if skills else 'backend, frontend, testing'}
- Priority: high (20%), medium (50%), low (30%)

Search Pattern Rules:
- Include domain keywords from description (e.g., "branch", "mobile", "payment")
- Include technology keywords (e.g., "React", "FastAPI", "authentication")
- Include similar project keywords if available
- Use camelCase/PascalCase for component names (e.g., "CustomerProfile", "BranchLocator")

File Structure Rules:
- Base on similar projects if available
- Follow modern conventions (e.g., Next.js: "app/" or "src/", FastAPI: "api/", "models/")
- Include frontend, backend, and shared directories
- Suggest specific component/module names based on feature

Be specific and actionable. Think like a developer receiving this plan to start implementation."""


def get_extraction_prompt() -> str:
    """
    Simplified extraction prompt for pulling keywords from analysis.

    Returns:
        System prompt for keyword extraction
    """
    return """You are a technical keyword extraction specialist.
Extract search keywords, file types, and directory suggestions from the given feature analysis.
Return ONLY valid JSON, no additional text."""
