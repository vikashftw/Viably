"""
Similar Feature Analyzer Agent - RAG explainability & transparency.

Provides full transparency on how cost estimates are derived:
- Returns 3 most similar PNC projects
- Explains WHY each project is similar
- Shows HOW the cost estimate was calculated
- Provides confidence score with detailed reasoning

All calculations are verifiable by judges.
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
import openai
from dotenv import load_dotenv

load_dotenv()

# Import existing RAG system
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from utils.rag import RAGSystem

logger = logging.getLogger(__name__)


class SimilarFeatureAgent:
    """
    Similar Feature Analyzer using RAG with full explainability.

    Provides transparent cost estimation based on historical PNC projects.
    """

    def __init__(self, use_vector_embeddings: bool = False):
        """
        Initialize Similar Feature Agent.

        Args:
            use_vector_embeddings: If True, use semantic search; else keyword matching
        """
        self.rag = RAGSystem(use_embeddings=use_vector_embeddings)
        self.use_vector_embeddings = use_vector_embeddings

        self.data_dir = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "data",
            "analysis_history"
        )

        # Ensure data directory exists
        os.makedirs(self.data_dir, exist_ok=True)

        # Initialize NVIDIA API client for LLM synthesis
        self.client = openai.OpenAI(
            base_url=os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1"),
            api_key=os.getenv("NVIDIA_API_KEY")
        )
        self.model = os.getenv("NEMOTRON_MODEL", "nvidia/llama-3.1-nemotron-nano-8b-v1")

        logger.info(f"Similar Feature Agent initialized (embeddings: {use_vector_embeddings})")

    def analyze(
        self,
        feature_name: str,
        feature_description: str,
        estimated_sprints: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Analyze similar features with full transparency.

        Args:
            feature_name: Name of the feature
            feature_description: Detailed description
            estimated_sprints: Pre-calculated sprint estimate (optional)

        Returns:
            Dictionary with similar projects, cost breakdown, and confidence
        """
        logger.info(f"Analyzing similar features for: {feature_name}")

        # Find 3 most similar PNC projects
        similar_projects = self.rag.find_similar_projects(feature_description, top_k=3)

        if not similar_projects:
            logger.warning("No similar projects found!")
            return self._create_fallback_response(feature_name, feature_description)

        # Add explainability to each project
        explained_projects = []
        for i, project in enumerate(similar_projects):
            similarity_score, matched_keywords = self._calculate_similarity_score(
                feature_description,
                project
            )

            explained_project = {
                "name": project.get("feature_name", "Unknown"),
                "project_id": project.get("project_id", f"proj_{i}"),
                "similarity_score": round(similarity_score, 3),
                "cost": project.get("cost_usd", project.get("budget_usd", 0)),  # FIX: Try cost_usd first
                "duration_weeks": project.get("duration_weeks", project.get("timeline_weeks", 0)),  # FIX: Try both
                "sprints": project.get("duration_weeks", project.get("timeline_weeks", 0)) // 2,
                "adoption_rate": project.get("adoption_rate", 0.0),
                "skills_required": project.get("skills_required", []),
                "complexity": project.get("complexity", "medium"),
                "why_similar": self._explain_similarity(feature_description, project, matched_keywords),
                "matching_keywords": matched_keywords
            }

            explained_projects.append(explained_project)

        # Calculate cost estimate with full breakdown
        cost_breakdown = self._calculate_cost_breakdown(explained_projects, estimated_sprints)

        # Calculate confidence score with reasoning
        confidence = self._calculate_confidence(explained_projects, feature_description)

        # Generate AI synthesis of similar features
        logger.info("Generating AI synthesis of similar features...")
        ai_synthesis = self._generate_ai_synthesis(
            feature_name=feature_name,
            feature_description=feature_description,
            similar_projects=explained_projects
        )

        # Build final result
        result = {
            "feature_name": feature_name,
            "feature_description": feature_description,
            "timestamp": datetime.now().isoformat(),
            "search_method": "vector_embeddings" if self.use_vector_embeddings else "keyword_matching",
            "similar_projects": explained_projects,
            "cost_estimate_basis": cost_breakdown,
            "confidence": confidence,
            "ai_synthesis": ai_synthesis
        }

        # Save to JSON
        self._save_results(result)

        logger.info(f"Similar feature analysis complete. Found {len(explained_projects)} similar projects")

        return result

    def _calculate_similarity_score(
        self,
        query: str,
        project: Dict[str, Any]
    ) -> Tuple[float, List[str]]:
        """
        Calculate similarity score and extract matching keywords.

        Args:
            query: Feature description
            project: Project dictionary

        Returns:
            Tuple of (similarity_score, list of matching keywords)
        """
        query_lower = query.lower()
        query_words = set(query_lower.split())

        # Get project text
        project_text = f"{project.get('feature_name', '')} {project.get('description', '')}"
        project_lower = project_text.lower()
        project_words = set(project_lower.split())

        # Find matching keywords (excluding common words)
        common_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'be', 'been', 'being'}
        matching = list((query_words & project_words) - common_words)
        matching = [w for w in matching if len(w) > 3]  # Filter out short words

        # Calculate Jaccard similarity
        intersection = len(query_words & project_words)
        union = len(query_words | project_words)
        jaccard_score = intersection / union if union > 0 else 0.0

        # If using embeddings, boost score (embeddings are more accurate)
        if self.use_vector_embeddings:
            similarity_score = min(0.95, jaccard_score * 1.5)
        else:
            similarity_score = jaccard_score

        return similarity_score, matching[:10]  # Return top 10 matching keywords

    def _explain_similarity(
        self,
        query: str,
        project: Dict[str, Any],
        matching_keywords: List[str]
    ) -> str:
        """
        Generate human-readable explanation of why projects are similar.

        Args:
            query: Feature description
            project: Project dictionary
            matching_keywords: List of matching keywords

        Returns:
            Explanation string
        """
        explanations = []

        # Domain/industry match
        domain = project.get("domain", "")
        if domain:
            explanations.append(f"both in {domain}")

        # Technology/platform match
        skills = project.get("skills_required", [])
        query_lower = query.lower()

        tech_matches = []
        for skill in skills:
            if skill.lower() in query_lower:
                tech_matches.append(skill)

        if tech_matches:
            explanations.append(f"shared tech: {', '.join(tech_matches[:3])}")

        # User type match
        if "customer" in query_lower and "customer" in project.get("description", "").lower():
            explanations.append("customer-facing features")

        if "branch" in query_lower and "branch" in project.get("description", "").lower():
            explanations.append("branch integration")

        if "mobile" in query_lower and "mobile" in str(skills).lower():
            explanations.append("mobile-first approach")

        if "hybrid" in query_lower or "digital" in query_lower:
            if "digital" in project.get("description", "").lower():
                explanations.append("digital transformation")

        # Complexity match
        complexity = project.get("complexity", "medium")
        explanations.append(f"{complexity} complexity")

        # Join explanations
        if explanations:
            return "; ".join(explanations).capitalize()
        else:
            return f"Shared keywords: {', '.join(matching_keywords[:5])}"

    def _calculate_cost_breakdown(
        self,
        explained_projects: List[Dict[str, Any]],
        estimated_sprints: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Calculate cost estimate with step-by-step breakdown.

        Args:
            explained_projects: List of explained project dictionaries
            estimated_sprints: Pre-calculated sprint estimate (optional)

        Returns:
            Cost breakdown dictionary
        """
        if not explained_projects:
            return {"error": "No similar projects found"}

        # Extract costs and sprints
        costs = [p["cost"] for p in explained_projects if p["cost"] > 0]
        sprints_list = [p["sprints"] for p in explained_projects if p["sprints"] > 0]

        if not costs:
            return {"error": "No cost data available from similar projects"}

        # Base calculation: Average of similar projects
        avg_cost = sum(costs) / len(costs)
        avg_sprints = sum(sprints_list) / len(sprints_list) if sprints_list else 12

        # Similarity-weighted average (higher weight for more similar projects)
        weighted_cost = 0
        total_weight = 0
        for project in explained_projects:
            if project["cost"] > 0:
                weight = project["similarity_score"]
                weighted_cost += project["cost"] * weight
                total_weight += weight

        if total_weight > 0:
            weighted_avg_cost = weighted_cost / total_weight
        else:
            weighted_avg_cost = avg_cost

        # Adjustments based on complexity
        adjustments = []
        final_cost = weighted_avg_cost

        # Complexity adjustment
        avg_complexity = self._get_avg_complexity(explained_projects)
        if avg_complexity == "high":
            final_cost *= 1.20
            adjustments.append("+20% for high complexity")
        elif avg_complexity == "low":
            final_cost *= 0.85
            adjustments.append("-15% for low complexity")

        return {
            "similar_projects_used": [
                {
                    "name": p["name"],
                    "cost": p["cost"],
                    "similarity": p["similarity_score"]
                }
                for p in explained_projects
            ],
            "calculation_method": "similarity-weighted average",
            "base_average": int(avg_cost),
            "weighted_average": int(weighted_avg_cost),
            "adjustments": adjustments if adjustments else ["No adjustments applied"],
            "final_estimate": int(final_cost),
            "confidence": "HIGH" if len(costs) >= 3 else "MEDIUM",
            "formula": f"({' + '.join([f'${p['cost']:,} × {p['similarity_score']:.2f}' for p in explained_projects if p['cost'] > 0])}) / {total_weight:.2f} = ${int(weighted_avg_cost):,}"
        }

    def _get_avg_complexity(self, projects: List[Dict[str, Any]]) -> str:
        """Calculate average complexity from projects."""
        complexity_map = {"low": 1, "medium": 2, "high": 3}
        complexities = [complexity_map.get(p.get("complexity", "medium"), 2) for p in projects]
        avg = sum(complexities) / len(complexities)

        if avg < 1.5:
            return "low"
        elif avg > 2.5:
            return "high"
        else:
            return "medium"

    def _calculate_confidence(
        self,
        explained_projects: List[Dict[str, Any]],
        feature_description: str
    ) -> Dict[str, Any]:
        """
        Calculate confidence score with detailed reasoning.

        Args:
            explained_projects: List of explained projects
            feature_description: Feature description

        Returns:
            Confidence dictionary
        """
        num_projects = len(explained_projects)
        similarity_scores = [p["similarity_score"] for p in explained_projects]
        avg_similarity = sum(similarity_scores) / len(similarity_scores) if similarity_scores else 0.0

        costs = [p["cost"] for p in explained_projects if p["cost"] > 0]
        cost_consistency = 1.0
        if len(costs) > 1:
            avg_cost = sum(costs) / len(costs)
            std_dev = (sum((c - avg_cost) ** 2 for c in costs) / len(costs)) ** 0.5
            coefficient_of_variation = std_dev / avg_cost if avg_cost > 0 else 1.0
            cost_consistency = max(0.0, 1.0 - coefficient_of_variation)

        # Data quality: check if projects have complete information
        data_quality = 0.0
        for p in explained_projects:
            completeness = 0
            if p.get("cost", 0) > 0:
                completeness += 0.3
            if p.get("sprints", 0) > 0:
                completeness += 0.3
            if p.get("skills_required"):
                completeness += 0.2
            if p.get("adoption_rate", 0) > 0:
                completeness += 0.2
            data_quality += completeness
        data_quality /= num_projects if num_projects > 0 else 1

        # Calculate overall confidence (0.0 - 1.0)
        confidence_score = (
            (num_projects / 3) * 0.25 +  # More projects = higher confidence
            avg_similarity * 0.35 +       # Higher similarity = higher confidence
            cost_consistency * 0.25 +     # Lower variation = higher confidence
            data_quality * 0.15           # Complete data = higher confidence
        )
        confidence_score = min(0.95, max(0.50, confidence_score))

        # Determine confidence level
        if confidence_score >= 0.80:
            level = "HIGH"
        elif confidence_score >= 0.65:
            level = "MEDIUM"
        else:
            level = "LOW"

        # Generate reasoning
        factors = []
        if avg_similarity >= 0.75:
            factors.append(f"similarity_strength: HIGH (avg {avg_similarity:.2f})")
        elif avg_similarity >= 0.55:
            factors.append(f"similarity_strength: MEDIUM (avg {avg_similarity:.2f})")
        else:
            factors.append(f"similarity_strength: LOW (avg {avg_similarity:.2f})")

        if data_quality >= 0.75:
            factors.append("data_quality: GOOD (complete project info)")
        elif data_quality >= 0.50:
            factors.append("data_quality: FAIR (some missing info)")
        else:
            factors.append("data_quality: POOR (limited project info)")

        if cost_consistency >= 0.75:
            factors.append("cost_variation: LOW (consistent estimates)")
        elif cost_consistency >= 0.50:
            factors.append("cost_variation: MEDIUM")
        else:
            factors.append("cost_variation: HIGH (inconsistent estimates)")

        reasoning = f"{num_projects} similar projects found, {avg_similarity:.0%} avg similarity"

        return {
            "score": round(confidence_score, 3),
            "level": level,
            "reasoning": reasoning,
            "factors": factors,
            "breakdown": {
                "num_projects": num_projects,
                "avg_similarity": round(avg_similarity, 3),
                "cost_consistency": round(cost_consistency, 3),
                "data_quality": round(data_quality, 3)
            }
        }

    def _create_fallback_response(
        self,
        feature_name: str,
        feature_description: str
    ) -> Dict[str, Any]:
        """Create fallback response when no similar projects found."""
        return {
            "feature_name": feature_name,
            "feature_description": feature_description,
            "timestamp": datetime.now().isoformat(),
            "search_method": "vector_embeddings" if self.use_vector_embeddings else "keyword_matching",
            "similar_projects": [],
            "cost_estimate_basis": {
                "error": "No similar projects found",
                "recommendation": "Use industry benchmarks or manual estimation"
            },
            "confidence": {
                "score": 0.0,
                "level": "NONE",
                "reasoning": "No historical data available",
                "factors": []
            }
        }

    def _save_results(self, results: Dict[str, Any]) -> None:
        """
        Save analysis results to JSON file.

        Args:
            results: Similar feature analysis results
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"similar_features_{timestamp}.json"
        filepath = os.path.join(self.data_dir, filename)

        try:
            with open(filepath, 'w') as f:
                json.dump(results, f, indent=2)

            logger.info(f"Similar feature results saved to: {filepath}")

        except Exception as e:
            logger.error(f"Failed to save results: {str(e)}")

    def _generate_ai_synthesis(
        self,
        feature_name: str,
        feature_description: str,
        similar_projects: List[Dict[str, Any]]
    ) -> str:
        """
        Use NVIDIA LLM to synthesize insights from similar features.

        Args:
            feature_name: Name of new feature
            feature_description: Description of new feature
            similar_projects: List of similar project dicts

        Returns:
            AI-generated synthesis
        """
        try:
            projects_summary = "\n".join([
                f"{i+1}. {p['name']} - ${p['cost']:,}, {p['sprints']} sprints, {p['similarity_score']:.0%} similar"
                for i, p in enumerate(similar_projects)
            ])

            prompt = f"""Analyze these {len(similar_projects)} similar PNC projects for "{feature_name}":

{projects_summary}

Provide a 2-3 sentence synthesis explaining:
1) What patterns do you see across these projects?
2) How confident should we be in cost/time estimates based on this historical data?"""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a technical analyst providing concise project insights."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=150
            )

            return response.choices[0].message.content.strip()

        except Exception as e:
            logger.error(f"AI synthesis generation failed: {str(e)}")
            return f"Found {len(similar_projects)} similar projects with average similarity of {sum(p['similarity_score'] for p in similar_projects) / len(similar_projects):.0%}."


# Standalone test functionality
if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    print("=" * 70)
    print("SIMILAR FEATURE ANALYZER - STANDALONE TEST")
    print("=" * 70)
    print()

    # Test with keyword matching (fast, no API calls)
    print("TEST: Keyword Matching (Fast Mode)")
    print("-" * 70)
    agent = SimilarFeatureAgent(use_vector_embeddings=False)
    result = agent.analyze(
        feature_name="Smart Branch Connect",
        feature_description="Hybrid banking experience connecting digital and in-branch services with mobile integration",
        estimated_sprints=12
    )

    print(f"Search Method: {result['search_method']}")
    print(f"Similar Projects Found: {len(result['similar_projects'])}")

    for p in result['similar_projects']:
        print(f"\n  {p['name']}")
        print(f"    Similarity: {p['similarity_score']:.3f}")
        print(f"    Cost: ${p['cost']:,}")
        print(f"    Sprints: {p['sprints']}")
        print(f"    Why Similar: {p['why_similar']}")

    print(f"\n💰 Cost Breakdown:")
    print(f"  Formula: {result['cost_estimate_basis'].get('formula', 'N/A')}")
    print(f"  Final Estimate: ${result['cost_estimate_basis'].get('final_estimate', 0):,}")

    print(f"\n📊 Confidence: {result['confidence']['score']:.3f} ({result['confidence']['level']})")

    print("\n" + "=" * 70)
    print("TEST COMPLETE!")
    print("=" * 70)
