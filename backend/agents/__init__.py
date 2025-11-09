"""
Multi-agent system for Product Sandbox War Game.

This package contains:
- BaseAgent: Abstract class for all agents
- EngineerAgent: Cost estimation with RAG
- CompetitorAgent: Market analysis with web search
- Orchestrator: Multi-agent coordinator (legacy)
- OrchestratorV2: Multi-agent coordinator with Person 4's schema
"""

from .base_agent import BaseAgent
from .engineer_agent import EngineerAgent
from .competitor_agent import CompetitorAgent
from .orchestrator import Orchestrator
from .orchestrator_v2 import OrchestratorV2

__all__ = [
    "BaseAgent",
    "EngineerAgent",
    "CompetitorAgent",
    "Orchestrator",
    "OrchestratorV2",
]
