"""
Similar Feature Analyzer Agent - RAG explainability & transparency.
"""

import os
import json
import logging
import asyncio
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path

import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from utils.rag import RAGSystem

logger = logging.getLogger(__name__)


class SimilarFeatureAgent:
    """
    Similar Feature Analyzer using RAG with full explainability.
    """

    def __init__(self, use_vector_embeddings: bool = False):
        """
        Initialize Similar Feature Agent.
        """
        self.rag = RAGSystem(use_embeddings=use_vector_embeddings)
        self.use_vector_embeddings = use_vector_embeddings
        self.data_dir = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "data",
            "analysis_history"
        )
        os.makedirs(self.data_dir, exist_ok=True)
        logger.info(f"Similar Feature Agent initialized (embeddings: {use_vector_embeddings})")

    async def find(
        self,
        feature_name: str,
        feature_description: str,
        engineer_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Find similar features with full transparency, using engineer's analysis.
        """
        logger.info(f"Analyzing similar features for: {feature_name}")
        estimated_sprints = engineer_analysis.get("estimated_sprints")

        similar_projects = self.rag.find_similar_projects(feature_description, top_k=3)

        if not similar_projects:
            logger.warning("No similar projects found!")
            return self._create_fallback_response(feature_name, feature_description)

        explained_projects = []
        for i, project in enumerate(similar_projects):
            similarity_score, matched_keywords = self._calculate_similarity_score(feature_description, project)
            explained_project = {
                "name": project.get("feature_name", "Unknown"),
                "project_id": project.get("project_id", f"proj_{i}"),
                "similarity_score": round(similarity_score, 3),
                "cost": project.get("cost_usd", 0),
                "sprints": project.get("duration_weeks", 0) // 2,
                "adoption_rate": project.get("adoption_rate", 0.0),
                "skills_required": project.get("skills_required", []),
                "why_similar": self._explain_similarity(feature_description, project, matched_keywords),
            }
            alignment = self._summarize_engineer_alignment(explained_project, engineer_analysis)
            if alignment:
                explained_project["engineer_alignment"] = alignment
                if alignment.get("summary"):
                    explained_project["why_similar"] = f"{explained_project['why_similar']}; {alignment['summary']}"
            explained_projects.append(explained_project)

        cost_breakdown = self._calculate_cost_breakdown(explained_projects, estimated_sprints)
        confidence = self._calculate_confidence(explained_projects, feature_description)

        result = {
            "feature_name": feature_name,
            "timestamp": datetime.now().isoformat(),
            "search_method": "vector_embeddings" if self.use_vector_embeddings else "keyword_matching",
            "similar_projects": explained_projects,
            "cost_estimate_basis": cost_breakdown,
            "confidence": confidence
        }

        self._save_results(result)
        logger.info(f"Similar feature analysis complete. Found {len(explained_projects)} projects.")
        return result

    def _calculate_similarity_score(self, query: str, project: Dict[str, Any]) -> Tuple[float, List[str]]:
        query_lower = query.lower()
        query_words = set(query_lower.split())
        project_text = f"{project.get('feature_name', '')} {project.get('description', '')}"
        project_words = set(project_text.lower().split())
        
        common_words = {'the', 'a', 'an', 'and', 'in', 'on', 'for', 'of', 'with'}
        matching = list((query_words & project_words) - common_words)
        
        intersection = len(query_words & project_words)
        union = len(query_words | project_words)
        jaccard_score = intersection / union if union > 0 else 0.0
        
        similarity_score = min(0.95, jaccard_score * 1.5) if self.use_vector_embeddings else jaccard_score
        return similarity_score, matching[:10]

    def _explain_similarity(self, query: str, project: Dict[str, Any], matching_keywords: List[str]) -> str:
        explanations = []
        if project.get("domain"):
            explanations.append(f"both in {project.get('domain')}")
        
        skills = project.get("skills_required", [])
        tech_matches = [skill for skill in skills if skill.lower() in query.lower()]
        if tech_matches:
            explanations.append(f"shared tech: {', '.join(tech_matches[:3])}")
        
        if "customer" in query.lower() and "customer" in project.get("description", "").lower():
            explanations.append("customer-facing")

        if explanations:
            return "; ".join(explanations).capitalize()
        return f"Shared keywords: {', '.join(matching_keywords[:5])}"

    def _calculate_cost_breakdown(self, explained_projects: List[Dict[str, Any]], estimated_sprints: Optional[int]) -> Dict[str, Any]:
        if not explained_projects:
            return {"error": "No similar projects found"}

        costs = [p["cost"] for p in explained_projects if p["cost"] > 0]
        if not costs:
            return {"error": "No cost data available"}

        avg_cost = sum(costs) / len(costs)
        
        weighted_cost = 0
        total_weight = 0
        for p in explained_projects:
            if p["cost"] > 0:
                weight = p["similarity_score"]
                weighted_cost += p["cost"] * weight
                total_weight += weight
        
        weighted_avg_cost = weighted_cost / total_weight if total_weight > 0 else avg_cost

        return {
            "calculation_method": "similarity-weighted average",
            "weighted_average": int(weighted_avg_cost),
            "final_estimate": int(weighted_avg_cost), # Simplified for now
            "formula": f"Weighted average of {len(costs)} similar projects."
        }

    def _calculate_confidence(self, explained_projects: List[Dict[str, Any]], feature_description: str) -> Dict[str, Any]:
        num_projects = len(explained_projects)
        if num_projects == 0:
            return {"score": 0.0, "level": "NONE", "reasoning": "No historical data."}

        similarity_scores = [p["similarity_score"] for p in explained_projects]
        avg_similarity = sum(similarity_scores) / num_projects

        confidence_score = (num_projects / 3) * 0.4 + avg_similarity * 0.6
        confidence_score = min(0.95, max(0.50, confidence_score))

        if confidence_score >= 0.80: level = "HIGH"
        elif confidence_score >= 0.65: level = "MEDIUM"
        else: level = "LOW"

        return {
            "score": round(confidence_score, 3),
            "level": level,
            "reasoning": f"{num_projects} projects found, avg similarity {avg_similarity:.0%}"
        }

    def _summarize_engineer_alignment(
        self,
        project: Dict[str, Any],
        engineer_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Compare similar project metrics to engineer analysis for clearer context.
        """
        engineer_cost = engineer_analysis.get("estimated_cost_usd") or engineer_analysis.get("cost")
        project_cost = project.get("cost")
        engineer_sprints = engineer_analysis.get("estimated_sprints")
        project_sprints = project.get("sprints")
        engineer_team = engineer_analysis.get("team_profile") or engineer_analysis.get("skills_required", [])
        project_skills = project.get("skills_required", [])

        summary_parts = []
        cost_delta_percent = None
        sprint_delta = None

        if engineer_cost and project_cost:
            try:
                cost_delta_percent = round(((project_cost - engineer_cost) / engineer_cost) * 100, 1)
                summary_parts.append(f"cost {cost_delta_percent:+.0f}% vs engineer")
            except ZeroDivisionError:
                pass

        if engineer_sprints and project_sprints:
            sprint_delta = project_sprints - engineer_sprints
            summary_parts.append(f"sprints {'+' if sprint_delta >= 0 else ''}{sprint_delta}")

        overlap = []
        if engineer_team and project_skills:
            engineer_terms = {term.lower() for term in engineer_team if isinstance(term, str)}
            overlap = sorted({skill for skill in project_skills if skill.lower() in engineer_terms})
            if overlap:
                summary_parts.append(f"shared team focus: {', '.join(overlap[:3])}")

        if not summary_parts:
            return {}

        return {
            "summary": "; ".join(summary_parts),
            "cost_delta_percent": cost_delta_percent,
            "sprint_delta": sprint_delta,
            "shared_team_skills": overlap
        }

    def _create_fallback_response(self, feature_name: str, feature_description: str) -> Dict[str, Any]:
        return {
            "feature_name": feature_name,
            "similar_projects": [],
            "confidence": {"score": 0.0, "level": "NONE", "reasoning": "No historical data available"}
        }

    def _save_results(self, results: Dict[str, Any]) -> None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"similar_features_{timestamp}.json"
        filepath = os.path.join(self.data_dir, filename)
        try:
            with open(filepath, 'w') as f:
                json.dump(results, f, indent=2)
            logger.info(f"Similar feature results saved to: {filepath}")
        except Exception as e:
            logger.error(f"Failed to save results: {str(e)}")

async def main():
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    print("=" * 70)
    print("SIMILAR FEATURE ANALYZER - STANDALONE TEST")
    print("=" * 70)

    agent = SimilarFeatureAgent(use_vector_embeddings=False)
    
    mock_engineer_analysis = {
        "estimated_sprints": 12,
        "estimated_cost_usd": 864000
    }
    
    result = await agent.find(
        feature_name="Smart Branch Connect",
        feature_description="Hybrid banking experience connecting digital and in-branch services with mobile integration",
        engineer_analysis=mock_engineer_analysis
    )

    print(f"Search Method: {result['search_method']}")
    print(f"Similar Projects Found: {len(result['similar_projects'])}")

    for p in result['similar_projects']:
        print(f"\n  {p['name']}")
        print(f"    Similarity: {p['similarity_score']:.3f}")
        print(f"    Cost: ${p['cost']:,}")
        print(f"    Why Similar: {p['why_similar']}")

    print(f"\n📊 Confidence: {result['confidence']['score']:.3f} ({result['confidence']['level']})")
    print("\n" + "=" * 70)
    print("TEST COMPLETE!")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(main())
