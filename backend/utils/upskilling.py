"""
Upskilling insights tracker.

Tracks which skills are recommended frequently across analyses
to identify bottlenecks and suggest training.
"""

from collections import Counter
from typing import List, Dict, Any


class UpskillingTracker:
    """
    Tracks skill recommendations across multiple feature analyses.

    In a real system, this would persist to a database.
    For hackathon demo, we use in-memory storage with mock history.
    """

    def __init__(self):
        """Initialize with mock historical data for demo."""
        # Simulate previous analyses - PNC-specific skills
        self.skill_history = Counter({
            'mobile': 12,  # High demand - bottleneck
            'backend': 10,
            'security': 8,  # High demand - bottleneck
            'payments': 7,
            'ml': 6,  # Growing demand - bottleneck
            'frontend': 5,
            'data-science': 4,
            'compliance': 4,
            'api': 3,
            'cloud': 3
        })

        # Threshold for identifying bottlenecks
        self.bottleneck_threshold = 6

    def track_skills(self, skills: List[str]):
        """
        Track skills from a new analysis.

        Args:
            skills: List of skill names from analysis
        """
        for skill in skills:
            self.skill_history[skill] += 1

    def get_insights(self) -> Dict[str, Any]:
        """
        Generate upskilling insights based on tracked data.

        Returns:
            Dictionary with bottleneck skills and training suggestions
        """
        # Identify bottleneck skills (appear frequently)
        bottlenecks = [
            skill for skill, count in self.skill_history.items()
            if count >= self.bottleneck_threshold
        ]

        # Sort by frequency
        bottlenecks.sort(key=lambda s: self.skill_history[s], reverse=True)

        # Generate training suggestions based on bottleneck skills
        training_map = {
            'mobile': 'React Native Advanced Development',
            'backend': 'Microservices Architecture & Scalability',
            'security': 'Security+ Certification & OWASP Training',
            'payments': 'Payment Systems & PCI-DSS Compliance',
            'ml': 'Machine Learning Engineering (TensorFlow/PyTorch)',
            'data-science': 'Advanced Analytics & Data Modeling',
            'compliance': 'Financial Regulations & Compliance Framework',
            'api': 'RESTful API Design & GraphQL',
            'cloud': 'AWS/Azure Cloud Architecture Certification',
            'frontend': 'Modern Frontend Frameworks (React/Vue)',
            'third-party-integration': 'Enterprise Integration Patterns',
            'devops': 'DevOps & CI/CD Pipeline Optimization'
        }

        # Get training for bottleneck skills
        suggested_training = []
        for skill in bottlenecks[:5]:  # Top 5 bottlenecks
            if skill in training_map:
                suggested_training.append(training_map[skill])
            else:
                suggested_training.append(f"{skill.title()} Advanced Training")

        return {
            "bottleneck_skills": bottlenecks[:5],  # Top 5
            "suggested_training": suggested_training
        }

    def get_skill_frequency(self, skill: str) -> int:
        """Get how many times a skill has been recommended."""
        return self.skill_history.get(skill, 0)


# Global instance for demo
_global_tracker = UpskillingTracker()


def get_tracker() -> UpskillingTracker:
    """Get the global upskilling tracker instance."""
    return _global_tracker
