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
from prompts.engineer_prompts import get_engineer_system_prompt, get_engineer_user_prompt

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
        logger.info(f"Engineer Agent initialized (embeddings: {use_vector_embeddings})")

    def analyze(self, feature_description: str, feature_name: str = None, **kwargs) -> Dict[str, Any]:
        """
        Analyze a feature and estimate cost/resources.

        Args:
            feature_description: Description of the feature to estimate
            feature_name: Optional name of the feature
            **kwargs: Additional parameters

        Returns:
            Dictionary with cost estimate:
            {
                "estimated_sprints": int,
                "estimated_engineers": int,
                "estimated_cost_usd": int,
                "key_risks": [str],
                "confidence": float
            }
        """
        try:
            # Step 1: Find similar projects using RAG
            similar_projects = self.rag.find_similar_projects(feature_description, top_k=3)
            logger.info(f"Found {len(similar_projects)} similar projects")

            # Step 2: Generate prompts
            system_prompt = get_engineer_system_prompt(len(similar_projects))
            user_prompt = get_engineer_user_prompt(
                feature_name or "Feature",
                feature_description,
                similar_projects
            )

            # Step 3: Call LLM
            logger.info("Calling NVIDIA Nemotron for cost estimation...")
            response = self._call_llm(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.2,
                max_tokens=1024
            )

            # Step 4: Parse response
            result = self._parse_json_response(response)

            # Step 5: Validate and add metadata
            result["similar_projects_found"] = len(similar_projects)
            result["rag_mode"] = "vector_embeddings" if self.rag.use_embeddings else "keyword_matching"

            logger.info(f"Engineer Agent analysis complete: {result.get('estimated_sprints', 'N/A')} sprints, ${result.get('estimated_cost_usd', 'N/A'):,}")
            return result

        except Exception as e:
            logger.error(f"Engineer Agent analysis failed: {str(e)}")
            # Return fallback estimate
            return {
                "estimated_sprints": 0,
                "estimated_engineers": 0,
                "estimated_cost_usd": 0,
                "key_risks": [f"Analysis failed: {str(e)}"],
                "confidence": 0.0,
                "similar_projects_found": 0,
                "rag_mode": "error",
                "error": str(e)
            }
