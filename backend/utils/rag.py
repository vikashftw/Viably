"""
Retrieval-Augmented Generation (RAG) system for finding similar past projects.

Phase 1: Simple keyword matching
Phase 2: Vector embeddings with NVIDIA API (to be implemented)
"""

import json
import logging
from typing import List, Dict, Any, Optional
from pathlib import Path
import os
import openai
import numpy as np
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class RAGSystem:
    """
    RAG system for retrieving similar past projects.

    Supports two modes:
    1. Keyword matching (fast, simple)
    2. Vector embeddings (slow, more accurate)
    """

    def __init__(self, data_path: str = None, use_embeddings: bool = False):
        """
        Initialize RAG system.

        Args:
            data_path: Path to past_projects.json file
            use_embeddings: If True, use vector embeddings; else keyword matching
        """
        if data_path is None:
            # Default to data folder in backend
            backend_dir = Path(__file__).parent.parent
            data_path = backend_dir / "data" / "past_projects.json"

        self.data_path = Path(data_path)
        self.use_embeddings = use_embeddings
        self.projects = []
        self.embeddings = {}

        # Load projects
        self._load_projects()

        # Initialize embeddings client if needed
        if self.use_embeddings:
            self.client = openai.OpenAI(
                base_url=os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1"),
                api_key=os.getenv("NVIDIA_API_KEY")
            )
            self.embeddings_model = os.getenv("EMBEDDINGS_MODEL", "nvidia/nv-embedqa-e5-v5")
            self._generate_embeddings()

    def _load_projects(self):
        """Load past projects from JSON file."""
        try:
            if self.data_path.exists():
                with open(self.data_path, 'r') as f:
                    self.projects = json.load(f)
                logger.info(f"Loaded {len(self.projects)} past projects from {self.data_path}")
            else:
                logger.warning(f"Past projects file not found: {self.data_path}")
                self.projects = []
        except Exception as e:
            logger.error(f"Failed to load past projects: {str(e)}")
            self.projects = []

    def _generate_embeddings(self):
        """Generate embeddings for all projects using NVIDIA API."""
        if not self.projects:
            return

        logger.info("Generating embeddings for all projects...")
        for project in self.projects:
            project_id = project.get('project_id', 'unknown')
            try:
                # Create text representation of project
                text = self._project_to_text(project)

                # Generate embedding
                response = self.client.embeddings.create(
                    input=text,
                    model=self.embeddings_model,
                    encoding_format="float"
                )
                self.embeddings[project_id] = np.array(response.data[0].embedding)

            except Exception as e:
                logger.error(f"Failed to generate embedding for {project_id}: {str(e)}")

        logger.info(f"Generated {len(self.embeddings)} embeddings")

    def _project_to_text(self, project: Dict[str, Any]) -> str:
        """
        Convert project dictionary to text for embedding.

        Args:
            project: Project dictionary

        Returns:
            Text representation
        """
        return f"""{project.get('feature_name', '')}
{project.get('description', '')}
Domain: {project.get('domain', '')}
Skills: {', '.join(project.get('skills_required', []))}
Complexity: {project.get('complexity', '')}"""

    def _cosine_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """Calculate cosine similarity between two vectors."""
        dot_product = np.dot(vec1, vec2)
        norm_product = np.linalg.norm(vec1) * np.linalg.norm(vec2)
        return dot_product / norm_product if norm_product > 0 else 0.0

    def _keyword_search(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Simple keyword-based search.

        Args:
            query: Search query (feature description)
            top_k: Number of results to return

        Returns:
            List of similar projects
        """
        if not self.projects:
            return []

        query_lower = query.lower()
        query_words = set(query_lower.split())

        # Score each project based on keyword overlap
        scored_projects = []
        for project in self.projects:
            project_text = self._project_to_text(project).lower()
            project_words = set(project_text.split())

            # Calculate Jaccard similarity
            intersection = len(query_words & project_words)
            union = len(query_words | project_words)
            score = intersection / union if union > 0 else 0.0

            # Boost score if domain/skill keywords match
            if any(keyword in project_text for keyword in ['payment', 'crypto', 'fraud', 'loan', 'credit']):
                if any(keyword in query_lower for keyword in ['payment', 'crypto', 'fraud', 'loan', 'credit']):
                    score *= 1.5

            scored_projects.append((score, project))

        # Sort by score descending
        scored_projects.sort(key=lambda x: x[0], reverse=True)

        # Return top_k results
        return [project for score, project in scored_projects[:top_k] if score > 0]

    def _vector_search(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Vector embedding-based semantic search.

        Args:
            query: Search query (feature description)
            top_k: Number of results to return

        Returns:
            List of similar projects
        """
        if not self.embeddings:
            logger.warning("No embeddings available, falling back to keyword search")
            return self._keyword_search(query, top_k)

        try:
            # Generate embedding for query
            response = self.client.embeddings.create(
                input=query,
                model=self.embeddings_model,
                encoding_format="float"
            )
            query_embedding = np.array(response.data[0].embedding)

            # Calculate similarity scores
            scored_projects = []
            for project in self.projects:
                project_id = project.get('project_id', 'unknown')
                if project_id in self.embeddings:
                    similarity = self._cosine_similarity(
                        query_embedding,
                        self.embeddings[project_id]
                    )
                    scored_projects.append((similarity, project))

            # Sort by similarity descending
            scored_projects.sort(key=lambda x: x[0], reverse=True)

            # Return top_k results
            return [project for score, project in scored_projects[:top_k]]

        except Exception as e:
            logger.error(f"Vector search failed: {str(e)}, falling back to keyword search")
            return self._keyword_search(query, top_k)

    def find_similar_projects(self, feature_description: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Find similar past projects using RAG.

        Args:
            feature_description: Description of the feature to search for
            top_k: Number of similar projects to return

        Returns:
            List of similar project dictionaries
        """
        if self.use_embeddings:
            return self._vector_search(feature_description, top_k)
        else:
            return self._keyword_search(feature_description, top_k)
