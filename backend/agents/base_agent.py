"""
Base Agent class for all AI agents in the system.

Provides common functionality:
- NVIDIA API integration
- Error handling and retries
- Logging
- Response validation
"""

import os
import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
import openai
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """Abstract base class for all agents."""

    def __init__(self):
        """Initialize the agent with NVIDIA API client."""
        self.client = openai.OpenAI(
            base_url=os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1"),
            api_key=os.getenv("NVIDIA_API_KEY")
        )
        self.model = os.getenv("NEMOTRON_MODEL", "nvidia/llama-3.1-nemotron-nano-8b-v1")

    @abstractmethod
    def analyze(self, feature_description: str, **kwargs) -> Dict[str, Any]:
        """
        Analyze a feature and return structured output.

        Args:
            feature_description: Description of the feature to analyze
            **kwargs: Additional parameters for specific agents

        Returns:
            Dictionary with analysis results
        """
        pass

    def _call_llm(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
        max_tokens: int = 1024,
        max_retries: int = 3
    ) -> str:
        """
        Call NVIDIA Nemotron API with retry logic.

        Args:
            system_prompt: System message for the LLM
            user_prompt: User message/query
            temperature: Sampling temperature (0-1)
            max_tokens: Maximum tokens in response
            max_retries: Number of retry attempts

        Returns:
            LLM response text

        Raises:
            Exception: If all retries fail
        """
        for attempt in range(max_retries):
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                return response.choices[0].message.content
            except Exception as e:
                logger.warning(f"LLM call attempt {attempt + 1} failed: {str(e)}")
                if attempt == max_retries - 1:
                    logger.error(f"All {max_retries} attempts failed")
                    raise

        raise Exception("Unexpected error in LLM call")

    def _parse_json_response(self, response: str) -> Dict[str, Any]:
        """
        Parse JSON from LLM response, handling markdown code blocks.

        Args:
            response: Raw LLM response text

        Returns:
            Parsed JSON dictionary
        """
        import json
        import re

        # Try to extract JSON from markdown code blocks
        json_match = re.search(r'```json\s*(.*?)\s*```', response, re.DOTALL)
        if json_match:
            response = json_match.group(1)
        else:
            # Try to extract any JSON object
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                response = json_match.group(0)

        try:
            return json.loads(response)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON: {str(e)}\nResponse: {response}")
            raise ValueError(f"Invalid JSON response from LLM: {str(e)}")
