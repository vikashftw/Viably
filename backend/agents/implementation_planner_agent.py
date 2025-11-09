"""
Implementation Planner Agent: Converts analysis into actionable implementation guidance.

Takes the full Viably analysis (all agents) and generates:
- Search patterns for finding relevant code
- File types and directory structure recommendations
- Detailed task breakdown with hour estimates
- Implementation context for Postman integration
"""

import logging
import json
import os
from datetime import datetime
from typing import Dict, Any, List
from .base_agent import BaseAgent
from prompts.implementation_planner_prompts import (
    get_implementation_planner_system_prompt,
    get_implementation_planner_user_prompt
)

logger = logging.getLogger(__name__)


class ImplementationPlannerAgent(BaseAgent):
    """
    Implementation Planner Agent for generating actionable implementation guidance.

    Analyzes multi-agent output and provides concrete implementation context
    including search patterns, task breakdown, and file structure recommendations.
    """

    def __init__(self):
        """Initialize Implementation Planner Agent."""
        super().__init__()
        logger.info("Implementation Planner Agent initialized")

    def analyze(
        self,
        feature_name: str,
        feature_description: str,
        engineer_analysis: Dict[str, Any],
        similar_features: List[Dict[str, Any]] = None,
        market_intelligence: Dict[str, Any] = None,
        competitor_analysis: Dict[str, Any] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate implementation plan from multi-agent analysis.

        Args:
            feature_name: Name of the feature
            feature_description: Feature description
            engineer_analysis: Output from Engineer Agent
            similar_features: Output from Similar Feature Agent (optional)
            market_intelligence: Output from Market Intelligence Agent (optional)
            competitor_analysis: Output from Competitor Agent (optional)
            **kwargs: Additional parameters

        Returns:
            Dictionary with implementation plan:
            {
                "search_patterns": [str],
                "file_types": [str],
                "suggested_directories": [str],
                "tasks": [
                    {
                        "title": str,
                        "description": str,
                        "skills_required": [str],
                        "estimated_hours": int,
                        "priority": "high|medium|low"
                    }
                ],
                "suggested_file_structure": {
                    "directories": [str],
                    "files": [{"path": str, "type": str, "purpose": str}]
                },
                "implementation_context": str
            }
        """
        try:
            # Step 1: Extract search patterns from feature description and similar projects
            search_patterns = self._extract_search_patterns(
                feature_description,
                similar_features
            )

            # Step 2: Determine file types based on skills required
            file_types = self._determine_file_types(engineer_analysis, similar_features)

            # Step 3: Suggest directory structure
            suggested_directories = self._suggest_directories(
                feature_name,
                engineer_analysis,
                similar_features
            )

            # Step 4: Generate task breakdown using LLM
            logger.info("Generating detailed task breakdown with LLM...")
            system_prompt = get_implementation_planner_system_prompt()
            user_prompt = get_implementation_planner_user_prompt(
                feature_name=feature_name,
                feature_description=feature_description,
                engineer_analysis=engineer_analysis,
                similar_features=similar_features,
                market_intelligence=market_intelligence
            )

            response = self._call_llm(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.3,
                max_tokens=2000
            )

            # Step 5: Parse LLM response
            llm_result = self._parse_json_response(response)

            # Step 6: Merge LLM results with our extracted patterns
            result = {
                "search_patterns": llm_result.get("search_patterns", search_patterns),
                "file_types": llm_result.get("file_types", file_types),
                "suggested_directories": llm_result.get("suggested_directories", suggested_directories),
                "tasks": llm_result.get("tasks", []),
                "suggested_file_structure": llm_result.get("suggested_file_structure", {
                    "directories": [],
                    "files": []
                }),
                "implementation_context": llm_result.get("implementation_context", ""),
                "total_estimated_hours": sum(task.get("estimated_hours", 0) for task in llm_result.get("tasks", [])),
                "high_priority_tasks": sum(1 for task in llm_result.get("tasks", []) if task.get("priority") == "high"),
                "agent_metadata": {
                    "feature_name": feature_name,
                    "estimated_sprints": engineer_analysis.get("estimated_sprints") or engineer_analysis.get("duration_weeks", 0) // 2,
                    "team_size": engineer_analysis.get("estimated_engineers") or engineer_analysis.get("team_size", 0),
                    "analysis_timestamp": datetime.now().isoformat()
                }
            }

            # Step 7: Validate and save result
            self._validate_result(result)
            self._save_result(result, feature_name)

            logger.info(f"Implementation plan generated: {len(result['tasks'])} tasks, {result['total_estimated_hours']} hours")
            return result

        except Exception as e:
            logger.error(f"Implementation Planner Agent failed: {str(e)}")
            # Return fallback plan
            return {
                "search_patterns": [],
                "file_types": ["tsx", "py", "ts", "js"],
                "suggested_directories": [],
                "tasks": [],
                "suggested_file_structure": {"directories": [], "files": []},
                "implementation_context": f"Implementation planning failed: {str(e)}",
                "total_estimated_hours": 0,
                "high_priority_tasks": 0,
                "error": str(e)
            }

    def _extract_search_patterns(
        self,
        feature_description: str,
        similar_features: List[Dict[str, Any]] = None
    ) -> List[str]:
        """
        Extract search keywords from feature description and similar projects.

        Args:
            feature_description: Feature description text
            similar_features: Similar projects from RAG

        Returns:
            List of search pattern strings
        """
        patterns = []

        # Extract keywords from description (simple approach)
        keywords = feature_description.lower().split()

        # Common tech/domain terms to look for
        important_terms = [
            "mobile", "branch", "payment", "customer", "account", "transaction",
            "api", "dashboard", "analytics", "integration", "authentication",
            "security", "compliance", "profile", "wallet", "loan", "savings"
        ]

        # Add matching important terms
        for term in important_terms:
            if term in feature_description.lower():
                patterns.append(term)
                # Add capitalized versions for component names
                patterns.append(term.capitalize())
                patterns.append(term.title() + "Component")

        # Add patterns from similar features
        if similar_features:
            for feature in similar_features[:2]:  # Top 2 similar
                skills = feature.get('skills_required', [])
                patterns.extend(skills)

        # Deduplicate while preserving order
        seen = set()
        unique_patterns = []
        for p in patterns:
            if p not in seen:
                seen.add(p)
                unique_patterns.append(p)

        return unique_patterns[:15]  # Limit to 15 patterns

    def _determine_file_types(
        self,
        engineer_analysis: Dict[str, Any],
        similar_features: List[Dict[str, Any]] = None
    ) -> List[str]:
        """
        Determine file types to search based on required skills.

        Args:
            engineer_analysis: Engineer agent output
            similar_features: Similar projects

        Returns:
            List of file extensions
        """
        file_types = set()
        skills = engineer_analysis.get('skills_required', [])

        # Collect skills from similar features too
        if similar_features:
            for feature in similar_features:
                skills.extend(feature.get('skills_required', []))

        # Map skills to file types
        skill_to_filetype = {
            'mobile': ['tsx', 'ts', 'swift', 'kt'],
            'frontend': ['tsx', 'jsx', 'ts', 'js', 'css', 'scss'],
            'backend': ['py', 'js', 'ts'],
            'react': ['tsx', 'jsx'],
            'python': ['py'],
            'javascript': ['js', 'ts'],
            'typescript': ['ts', 'tsx'],
            'api': ['py', 'ts', 'js'],
            'ml': ['py', 'ipynb'],
            'data': ['py', 'sql']
        }

        for skill in skills:
            skill_lower = skill.lower()
            for key, types in skill_to_filetype.items():
                if key in skill_lower:
                    file_types.update(types)

        # Default fallback
        if not file_types:
            file_types = {'tsx', 'py', 'ts', 'js'}

        return sorted(list(file_types))

    def _suggest_directories(
        self,
        feature_name: str,
        engineer_analysis: Dict[str, Any],
        similar_features: List[Dict[str, Any]] = None
    ) -> List[str]:
        """
        Suggest directory paths where implementation code might exist.

        Args:
            feature_name: Name of the feature
            engineer_analysis: Engineer analysis
            similar_features: Similar features

        Returns:
            List of suggested directory paths
        """
        directories = []

        # Convert feature name to directory-friendly format
        feature_slug = feature_name.lower().replace(' ', '-')

        # Frontend directories
        directories.append(f"frontend/app/{feature_slug}")
        directories.append(f"frontend/components/{feature_slug}")
        directories.append(f"src/features/{feature_slug}")

        # Backend directories
        directories.append(f"backend/api/{feature_slug}")
        directories.append(f"backend/services/{feature_slug}")
        directories.append(f"api/routes/{feature_slug}")

        # Shared/common
        directories.append(f"shared/types/{feature_slug}")
        directories.append(f"lib/{feature_slug}")

        # Add domain-specific directories from similar features
        if similar_features:
            for feature in similar_features[:1]:  # Just use top similar
                domain = feature.get('domain', '')
                if domain:
                    directories.append(f"backend/domain/{domain}")
                    directories.append(f"frontend/features/{domain}")

        return directories[:8]  # Limit to 8 suggestions

    def _validate_result(self, result: Dict[str, Any]) -> None:
        """
        Validate the implementation plan result.

        Args:
            result: Result dictionary to validate

        Raises:
            ValueError: If result is invalid
        """
        required_fields = [
            "search_patterns",
            "file_types",
            "suggested_directories",
            "tasks",
            "suggested_file_structure",
            "implementation_context"
        ]

        for field in required_fields:
            if field not in result:
                raise ValueError(f"Missing required field: {field}")

        # Validate tasks structure
        for task in result.get("tasks", []):
            if not isinstance(task, dict):
                raise ValueError("Each task must be a dictionary")
            if "title" not in task or "estimated_hours" not in task:
                raise ValueError("Each task must have 'title' and 'estimated_hours'")

    def _save_result(self, result: Dict[str, Any], feature_name: str) -> None:
        """
        Save implementation plan to JSON file.

        Args:
            result: Result dictionary to save
            feature_name: Name of feature (for filename)
        """
        try:
            # Create analysis_history directory if it doesn't exist
            output_dir = os.path.join(
                os.path.dirname(__file__),
                "..",
                "data",
                "analysis_history"
            )
            os.makedirs(output_dir, exist_ok=True)

            # Generate filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"implementation_plan_{timestamp}.json"
            filepath = os.path.join(output_dir, filename)

            # Save to file
            with open(filepath, 'w') as f:
                json.dump({
                    "feature_name": feature_name,
                    "timestamp": timestamp,
                    "plan": result
                }, f, indent=2)

            logger.info(f"Implementation plan saved to {filepath}")

        except Exception as e:
            logger.warning(f"Failed to save implementation plan: {str(e)}")
            # Don't raise - saving is optional
