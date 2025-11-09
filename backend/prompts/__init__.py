"""
Prompt templates for all agents.

Contains carefully engineered prompts for:
- Engineer Agent (cost estimation)
- Competitor Agent (market analysis)
"""

from .engineer_prompts import get_engineer_system_prompt, get_engineer_user_prompt
from .competitor_prompts import get_competitor_system_prompt, get_competitor_user_prompt

__all__ = [
    "get_engineer_system_prompt",
    "get_engineer_user_prompt",
    "get_competitor_system_prompt",
    "get_competitor_user_prompt",
]
