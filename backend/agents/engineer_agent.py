"""
Engineer Agent: Cost estimation and resource planning.

Uses RAG over past projects to provide realistic estimates for:
- Engineering hours
- Total cost
- Team size and skills required
- Timeline
- Technical risks
"""

import logging
from typing import Dict, Any

from .base_agent import BaseAgent
from utils.rag import RAGSystem
from prompts.engineer_prompts import (
    get_engineer_system_prompt,
    get_engineer_user_prompt,
)

logger = logging.getLogger(__name__)


class EngineerAgent(BaseAgent):
    """
    Engineer Agent for cost and resource estimation.

    Uses RAG to find similar past projects and LLM to generate
    realistic cost estimates.
    """

    def __init__(self, use_vector_embeddings: bool = False):
        """
        Initialize Engineer Agent.

        Args:
            use_vector_embeddings: If True, use vector embeddings; else keyword matching
        """
        super().__init__()
        self.rag = RAGSystem(use_embeddings=use_vector_embeddings)
        logger.info(
            f"Engineer Agent initialized (embeddings: {use_vector_embeddings})"
        )

    # ------------------------------------------------------------------
    # Existing API (used by tests / legacy orchestrator)
    # ------------------------------------------------------------------

    def analyze(
        self,
        feature_description: str,
        feature_name: str = None,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """
        Analyze a feature and estimate cost/resources.

        Args:
            feature_description: Description of the feature to estimate
            feature_name: Optional name of the feature
            **kwargs: Additional parameters

        Returns:
            Dictionary with legacy cost estimate:
            {
                "cost": int,
                "hours": int,
                "duration_weeks": int,
                "team_size": int,
                "skills_required": [str],
                "confidence": float,
                "risks": [str],
                "complexity": str,
                "similar_projects_found": int,
                "rag_mode": str
            }
        """
        try:
            # Step 1: Find similar projects using RAG
            similar_projects = self.rag.find_similar_projects(
                feature_description, top_k=3
            )
            logger.info(
                f"Found {len(similar_projects)} similar projects for engineer analysis"
            )

            # Step 2: Generate prompts
            system_prompt = get_engineer_system_prompt(len(similar_projects))
            user_prompt = get_engineer_user_prompt(
                feature_name or "Feature",
                feature_description,
                similar_projects,
            )

            # Step 3: Call LLM
            logger.info("Calling NVIDIA Nemotron for cost estimation...")
            response = self._call_llm(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.2,
                max_tokens=1024,
            )

            # Step 4: Parse response
            llm_result = self._parse_json_response(response)

            # Step 5: Transform to standardized legacy-ish format
            sprints = llm_result.get("estimated_sprints", 0)
            engineers = llm_result.get("estimated_engineers", 0)
            estimated_cost_usd = llm_result.get("estimated_cost_usd", 0)

            transformed_result = {
                "cost": estimated_cost_usd,
                "hours": sprints * 2 * 40 * engineers if sprints and engineers else 0,
                "duration_weeks": sprints * 2 if sprints else 0,
                "team_size": engineers,
                "skills_required": llm_result.get(
                    "skills_required", []
                ),  # optional from prompt
                "confidence": llm_result.get("confidence", 0.0),
                "risks": llm_result.get("key_risks", []),
                "complexity": llm_result.get("implementation_complexity", "unknown"),
                "similar_projects_found": len(similar_projects),
                "rag_mode": "vector_embeddings"
                if self.rag.use_embeddings
                else "keyword_matching",
            }

            logger.info(
                f"Engineer Agent analysis complete: "
                f"{sprints} sprints, ${transformed_result['cost']:,}"
            )
            return transformed_result

        except Exception as e:
            logger.error(f"Engineer Agent analysis failed: {str(e)}")
            # Return fallback estimate in the standardized format
            return {
                "cost": 0,
                "hours": 0,
                "duration_weeks": 0,
                "team_size": 0,
                "skills_required": [],
                "confidence": 0.0,
                "risks": [f"Analysis failed: {str(e)}"],
                "complexity": "unknown",
                "similar_projects_found": 0,
                "rag_mode": "error",
                "error": str(e),
            }

    # ------------------------------------------------------------------
    # New API for OrchestratorV2 (Phase-1)
    # ------------------------------------------------------------------

    def analyze_with_context(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enriched entrypoint for OrchestratorV2.

        Uses:
        - PM input (feature_name, feature_description, goal, etc.)
        - tech_context (repo, stack, LOC)
        - org_profile (constraints, risk appetite)
        - assumptions (cost model)

        Returns:
            Dict in the normalized Phase-1 schema:

            {
              "agent": "engineer_v1",
              "feature_name": str,
              "estimated_sprints": int,
              "estimated_engineers": int,
              "estimated_cost_usd": int,
              "team_profile": [str],
              "implementation_complexity": "LOW|MEDIUM|HIGH",
              "integration_points": [str],
              "key_risks": [str],
              "assumptions": {...},
              "confidence": float
            }
        """
        feature_name = context.get("feature_name") or "Feature"
        feature_description = context.get("feature_description", "")
        tech = context.get("tech_context", {}) or {}
        org = context.get("org_profile", {}) or {}
        assumptions = context.get("assumptions", {}) or {}

        # 1) Call existing analyze() to leverage RAG + Nemotron
        base = self.analyze(
            feature_description=feature_description,
            feature_name=feature_name,
        )

        # 2) Derive sprints/engineers if not explicitly present
        duration_weeks = base.get("duration_weeks", 0)
        team_size = base.get("team_size") or 0
        cost = base.get("cost", 0)

        sprint_len = assumptions.get("sprint_length_weeks", 2)

        if duration_weeks and sprint_len:
            estimated_sprints = max(1, duration_weeks // sprint_len)
        else:
            # Fallback heuristic if LLM didn't provide duration
            estimated_sprints = 6

        estimated_engineers = team_size or 6
        estimated_cost_usd = cost

        # 3) Complexity & integration points from tech + constraints
        frameworks = tech.get("frameworks", [])
        approx_loc = tech.get("approx_loc", 0)
        constraints = org.get("constraints", [])

        complexity_score = 0
        if "React Native" in frameworks or "FastAPI" in frameworks:
            complexity_score += 1
        if approx_loc and approx_loc > 15000:
            complexity_score += 1
        if "regulated_financial_institution" in constraints:
            complexity_score += 1

        if complexity_score <= 1:
            implementation_complexity = "MEDIUM"
        elif complexity_score == 2:
            implementation_complexity = "HIGH"
        else:
            implementation_complexity = "HIGH"

        integration_points = [
            "Core banking APIs",
            "Customer identity & SSO",
            "Branch visit / appointment & lobby queueing",
            "Notifications / messaging",
            "Audit logging & observability",
        ]

        # 4) Risks: merge LLM risks + environment-aware risks
        key_risks = list(base.get("risks", []))

        if "regulated_financial_institution" in constraints:
            key_risks.append(
                "Regulatory, audit, and model risk reviews add extra design and testing overhead."
            )
        if approx_loc and approx_loc > 15000:
            key_risks.append(
                "Existing codebase size increases integration and refactor complexity."
            )

        # 5) Confidence: use LLM's if available, else a safe default
        confidence = base.get("confidence", 0.7)

        # 6) Build normalized output
        normalized = {
            "agent": "engineer_v1",
            "feature_name": feature_name,
            "estimated_sprints": int(estimated_sprints),
            "estimated_engineers": int(estimated_engineers),
            "estimated_cost_usd": int(estimated_cost_usd),
            "team_profile": base.get(
                "skills_required",
                [
                    "React/React Native engineers",
                    "Python/FastAPI backend engineers",
                    "DevOps/SRE",
                    "Security/Compliance",
                ],
            ),
            "implementation_complexity": implementation_complexity,
            "integration_points": integration_points,
            "key_risks": key_risks,
            "assumptions": assumptions,
            "confidence": float(confidence),
        }

        logger.info(
            f"EngineerAgent.analyze_with_context -> "
            f"{normalized['estimated_sprints']} sprints, "
            f"{normalized['estimated_engineers']} engineers, "
            f"${normalized['estimated_cost_usd']:,}"
        )

        return normalized
