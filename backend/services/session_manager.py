"""
Session Manager for Analysis Tracking
Prevents duplicate analyses and tracks active sessions
"""

import uuid
import time
import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)


class SessionManager:
    """Manages analysis sessions to prevent duplicates and track state"""

    def __init__(self):
        self.active_sessions: Dict[str, dict] = {}
        self._lock = None  # Will use asyncio.Lock when needed

    def create_session(self, feature_name: str, description: str) -> str:
        """Create a new analysis session"""
        session_id = str(uuid.uuid4())[:8]  # Short ID for logging

        self.active_sessions[session_id] = {
            "feature": feature_name,
            "description": description,
            "status": "running",
            "start_time": time.time(),
            "subscribers": 1
        }

        logger.info(f"Created session {session_id} for feature: {feature_name}")
        return session_id

    def get_active_session(self, feature_name: str) -> Optional[str]:
        """Find existing active session for the same feature"""
        for session_id, data in self.active_sessions.items():
            if data["feature"] == feature_name and data["status"] == "running":
                # Increment subscriber count
                data["subscribers"] += 1
                logger.info(f"Session {session_id} already running for {feature_name}. Subscribers: {data['subscribers']}")
                return session_id
        return None

    def complete_session(self, session_id: str):
        """Mark session as complete"""
        if session_id in self.active_sessions:
            self.active_sessions[session_id]["status"] = "complete"
            self.active_sessions[session_id]["end_time"] = time.time()
            duration = self.active_sessions[session_id]["end_time"] - self.active_sessions[session_id]["start_time"]
            logger.info(f"Session {session_id} completed in {duration:.2f}s")

    def cleanup_old_sessions(self, max_age_seconds: int = 3600):
        """Remove sessions older than max_age_seconds"""
        current_time = time.time()
        to_remove = []

        for session_id, data in self.active_sessions.items():
            age = current_time - data["start_time"]
            if age > max_age_seconds:
                to_remove.append(session_id)

        for session_id in to_remove:
            del self.active_sessions[session_id]
            logger.info(f"Cleaned up old session {session_id}")

    def get_session_info(self, session_id: str) -> Optional[dict]:
        """Get session metadata"""
        return self.active_sessions.get(session_id)


# Global singleton instance
session_manager = SessionManager()
