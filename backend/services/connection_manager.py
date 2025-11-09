"""
Connection Manager for SSE Broadcasting
Manages multiple SSE client connections and broadcasts events to all subscribers
"""

import asyncio
import logging
from typing import Dict, Optional
import time

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages SSE connections and broadcasts events to all clients"""

    def __init__(self):
        self.active_connections: Dict[str, asyncio.Queue] = {}
        self._lock = asyncio.Lock()

    async def connect(self, client_id: str) -> asyncio.Queue:
        """Register a new client connection and return its event queue"""
        async with self._lock:
            queue = asyncio.Queue()
            self.active_connections[client_id] = queue
            logger.info(f"Client {client_id} connected. Total clients: {len(self.active_connections)}")
            return queue

    async def disconnect(self, client_id: str):
        """Remove a client connection"""
        async with self._lock:
            if client_id in self.active_connections:
                del self.active_connections[client_id]
                logger.info(f"Client {client_id} disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(self, event: dict):
        """Send event to all connected clients"""
        async with self._lock:
            client_count = len(self.active_connections)
            if client_count == 0:
                logger.debug(f"No clients connected. Skipping broadcast of event type: {event.get('type')}")
                return

            logger.debug(f"Broadcasting event type '{event.get('type')}' to {client_count} clients")

            # Add server timestamp
            event['server_timestamp'] = time.time()

            for client_id, queue in list(self.active_connections.items()):
                try:
                    await queue.put(event)
                except Exception as e:
                    logger.error(f"Failed to send event to client {client_id}: {e}")

    def get_client_count(self) -> int:
        """Return number of active connections"""
        return len(self.active_connections)


# Global singleton instance
connection_manager = ConnectionManager()
