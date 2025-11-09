"""
Multi-agent system for Product Sandbox War Game.

This package contains:
- BaseAgent: Abstract class for all agents
- EngineerAgent: Cost estimation with RAG
- CompetitorAgent: Market analysis with web search
- Orchestrator: Multi-agent coordinator
"""

from .base_agent import BaseAgent
from .engineer_agent import EngineerAgent
from .competitor_agent import CompetitorAgent
from .orchestrator import Orchestrator

__all__ = [
    "BaseAgent",
    "EngineerAgent",
    "CompetitorAgent",
    "Orchestrator",
]
