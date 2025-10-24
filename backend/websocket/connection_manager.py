"""
WebSocket Connection Manager with Authentication
Manages WebSocket connections with JWT authentication and encryption
"""

from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List, Optional, Any
import logging
import json
import asyncio
from datetime import datetime

from .auth import ws_auth, WebSocketAuthError

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manages WebSocket connections with authentication

    Features:
    - JWT-based authentication
    - User-based connection management
    - Broadcast messaging
    - Private messaging
    - Connection limiting
    - Heartbeat/ping-pong
    """

    def __init__(self, max_connections_per_user: int = 5):
        """
        Initialize connection manager

        Args:
            max_connections_per_user: Maximum concurrent connections per user
        """
        self.connections: Dict[str, WebSocket] = {}  # session_id -> websocket
        self.user_sessions: Dict[str, List[str]] = {}  # user_id -> [session_ids]
        self.session_user_map: Dict[str, str] = {}  # session_id -> user_id
        self.max_connections_per_user = max_connections_per_user

    async def connect(
        self,
        websocket: WebSocket,
        token: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Accept and authenticate WebSocket connection

        Args:
            websocket: WebSocket instance
            token: JWT authentication token

        Returns:
            Connection info dictionary

        Raises:
            WebSocketDisconnect: If authentication fails
        """
        try:
            # Accept connection
            await websocket.accept()

            # Authenticate
            auth_data = await ws_auth.authenticate_connection(websocket, token)

            user_id = auth_data["user_id"]
            session_id = auth_data["session_id"]

            # Check connection limit
            if not self._check_connection_limit(user_id):
                await websocket.close(
                    code=1008,
                    reason="Connection limit exceeded"
                )
                raise WebSocketDisconnect(
                    code=1008,
                    reason="Connection limit exceeded"
                )

            # Store connection
            self.connections[session_id] = websocket
            self.session_user_map[session_id] = user_id

            if user_id not in self.user_sessions:
                self.user_sessions[user_id] = []
            self.user_sessions[user_id].append(session_id)

            # Send authentication success message
            await self.send_to_session(session_id, {
                "type": "auth_success",
                "data": {
                    "session_id": session_id,
                    "user_id": user_id,
                    "authenticated": True,
                    "timestamp": datetime.utcnow().isoformat()
                }
            })

            logger.info(
                f"WebSocket connected: user={user_id}, session={session_id}, "
                f"connections={len(self.user_sessions[user_id])}"
            )

            return {
                "session_id": session_id,
                "user_id": user_id,
                "connection_count": len(self.user_sessions[user_id])
            }

        except Exception as e:
            logger.error(f"Connection failed: {str(e)}")
            await websocket.close(code=1011, reason="Connection error")
            raise

    def _check_connection_limit(self, user_id: str) -> bool:
        """
        Check if user can open another connection

        Args:
            user_id: User ID

        Returns:
            True if allowed, False otherwise
        """
        current_count = len(self.user_sessions.get(user_id, []))
        return current_count < self.max_connections_per_user

    async def disconnect(self, session_id: str):
        """
        Disconnect WebSocket session

        Args:
            session_id: Session ID
        """
        if session_id not in self.connections:
            return

        # Get user ID
        user_id = self.session_user_map.get(session_id)

        # Remove connection
        del self.connections[session_id]
        del self.session_user_map[session_id]

        # Remove from user sessions
        if user_id and user_id in self.user_sessions:
            self.user_sessions[user_id].remove(session_id)
            if not self.user_sessions[user_id]:
                del self.user_sessions[user_id]

        # Close auth session
        ws_auth.close_session(session_id)

        logger.info(f"WebSocket disconnected: session={session_id}")

    async def send_to_session(
        self,
        session_id: str,
        message: Dict[str, Any]
    ):
        """
        Send message to specific session

        Args:
            session_id: Session ID
            message: Message dictionary
        """
        websocket = self.connections.get(session_id)
        if websocket:
            try:
                # Update session activity
                ws_auth.update_session_activity(session_id)

                # Send message
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Failed to send message to {session_id}: {e}")
                await self.disconnect(session_id)

    async def send_to_user(
        self,
        user_id: str,
        message: Dict[str, Any]
    ):
        """
        Send message to all sessions of a user

        Args:
            user_id: User ID
            message: Message dictionary
        """
        session_ids = self.user_sessions.get(user_id, [])
        for session_id in session_ids:
            await self.send_to_session(session_id, message)

    async def broadcast(
        self,
        message: Dict[str, Any],
        exclude_sessions: Optional[List[str]] = None
    ):
        """
        Broadcast message to all connections

        Args:
            message: Message dictionary
            exclude_sessions: Optional list of session IDs to exclude
        """
        exclude_sessions = exclude_sessions or []

        tasks = []
        for session_id in self.connections:
            if session_id not in exclude_sessions:
                tasks.append(self.send_to_session(session_id, message))

        await asyncio.gather(*tasks, return_exceptions=True)

    async def broadcast_to_users(
        self,
        user_ids: List[str],
        message: Dict[str, Any]
    ):
        """
        Broadcast message to specific users

        Args:
            user_ids: List of user IDs
            message: Message dictionary
        """
        tasks = []
        for user_id in user_ids:
            tasks.append(self.send_to_user(user_id, message))

        await asyncio.gather(*tasks, return_exceptions=True)

    async def send_typing_indicator(
        self,
        conversation_id: str,
        user_id: str,
        is_typing: bool
    ):
        """
        Send typing indicator to conversation participants

        Args:
            conversation_id: Conversation ID
            user_id: User ID who is typing
            is_typing: Whether user is typing
        """
        # In a real implementation, you would:
        # 1. Get all participants in the conversation
        # 2. Send typing indicator to them (except sender)

        message = {
            "type": "typing_indicator",
            "data": {
                "conversation_id": conversation_id,
                "user_id": user_id,
                "is_typing": is_typing,
                "timestamp": datetime.utcnow().isoformat()
            }
        }

        # For now, broadcast to all except sender
        sender_sessions = self.user_sessions.get(user_id, [])
        await self.broadcast(message, exclude_sessions=sender_sessions)

    async def handle_heartbeat(self, session_id: str):
        """
        Handle heartbeat/ping message

        Args:
            session_id: Session ID
        """
        await self.send_to_session(session_id, {
            "type": "pong",
            "timestamp": datetime.utcnow().isoformat()
        })

        # Update session activity
        ws_auth.update_session_activity(session_id)

    def get_user_connection_count(self, user_id: str) -> int:
        """Get number of active connections for user"""
        return len(self.user_sessions.get(user_id, []))

    def get_active_users(self) -> List[str]:
        """Get list of active user IDs"""
        return list(self.user_sessions.keys())

    def get_session_info(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get session information

        Args:
            session_id: Session ID

        Returns:
            Session info dictionary or None
        """
        if session_id not in self.connections:
            return None

        user_id = self.session_user_map.get(session_id)
        auth_session = ws_auth.get_session(session_id)

        return {
            "session_id": session_id,
            "user_id": user_id,
            "connected_at": auth_session["connected_at"] if auth_session else None,
            "last_activity": auth_session["last_activity"] if auth_session else None,
        }

    def get_statistics(self) -> Dict[str, Any]:
        """
        Get connection statistics

        Returns:
            Statistics dictionary
        """
        return {
            "total_connections": len(self.connections),
            "unique_users": len(self.user_sessions),
            "max_connections_per_user": self.max_connections_per_user,
            "connections_by_user": {
                user_id: len(sessions)
                for user_id, sessions in self.user_sessions.items()
            },
            "auth_stats": ws_auth.get_statistics()
        }

    async def cleanup(self):
        """Clean up all connections"""
        session_ids = list(self.connections.keys())
        for session_id in session_ids:
            await self.disconnect(session_id)

        logger.info("Connection manager cleaned up")


# Global connection manager instance
connection_manager = ConnectionManager()
