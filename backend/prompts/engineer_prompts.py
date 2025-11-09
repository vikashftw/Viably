"""
Prompt templates for the Engineer Agent.

These prompts are designed to produce realistic cost and resource estimates
for product features in fintech.
"""


def get_engineer_system_prompt(num_similar_projects: int = 0) -> str:
    """
    Get the system prompt for the Engineer Agent.

    Args:
        num_similar_projects: Number of similar projects found via RAG

    Returns:
        System prompt string
    """
    return f"""You are a Principal Engineer at a major fintech company with 15+ years of experience.
You provide REALISTIC cost and time estimates for product features based on historical data.

Your expertise includes:
- Full-stack development (backend, frontend, mobile)
- Payment systems and financial infrastructure
- Security and compliance (PCI-DSS, SOC2, regulations)
- Cloud architecture (AWS, Azure, GCP)
- Team coordination and project planning

You have access to data from {num_similar_projects} similar past projects for reference.

When estimating, you account for:
1. Architecture design and technical planning
2. Implementation (backend, frontend, database, APIs)
3. Security review and compliance
4. Testing (unit, integration, E2E, security)
5. Code review and refactoring
6. Bug fixes and edge cases
7. Documentation (technical, user-facing)
8. Deployment and monitoring setup

CRITICAL: Be realistic, not optimistic. Features always take longer than expected.
Account for complexity, technical debt, and integration challenges.

Your estimates use a blended rate of $150/hour across all engineering roles.

You MUST respond with valid JSON only, no additional text."""


def get_engineer_user_prompt(
    feature_name: str,
    feature_description: str,
    similar_projects: list = None
) -> str:
    """
    Get the user prompt for feature cost estimation.

    Args:
        feature_name: Name of the feature
        feature_description: Detailed description
        similar_projects: List of similar past projects (from RAG)

    Returns:
        User prompt string
    """
    similar_context = ""
    if similar_projects:
        similar_context = "\n\nSimilar past projects for reference:\n"
        for i, proj in enumerate(similar_projects[:3], 1):
            similar_context += f"""\n{i}. {proj.get('feature_name', 'Unknown')}
   - Hours: {proj.get('hours_spent', 'N/A')}
   - Cost: ${proj.get('cost_usd', 'N/A'):,}
   - Team Size: {proj.get('team_size', 'N/A')}
   - Duration: {proj.get('duration_weeks', 'N/A')} weeks
   - Skills: {', '.join(proj.get('skills_required', []))}
   - Outcome: {proj.get('outcome', 'unknown')}"""

    return f"""Feature to estimate: {feature_name}

Description:
{feature_description}
{similar_context}

Provide a cost estimate in the following JSON format:

{{
    "estimated_sprints": <number of 2-week sprints (integer)>,
    "estimated_engineers": <number of engineers needed (integer)>,
    "estimated_cost_usd": <total cost (sprints * engineers * 12000)>,
    "key_risks": [<array of 2-4 specific technical or delivery risks>],
    "confidence": <confidence between 0.6-0.95 (float)>
}}

Rules:
- Use realistic sprint counts (no 0 sprints, no miracles)
- Cost formula: estimated_sprints * estimated_engineers * 12000
- Higher confidence (0.85-0.95) for standard features
- Lower confidence (0.6-0.75) for complex/new/ambiguous features
- Tailor risks to the specific feature (security, infrastructure, integrations, etc.)

Be realistic. Account for complexity, edge cases, and integration challenges."""
