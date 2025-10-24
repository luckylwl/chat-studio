"""
WebSocket Authentication System
JWT-based authentication for WebSocket connections
"""

import jwt
import time
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from fastapi import WebSocket, WebSocketException, status
import logging
import os

logger = logging.getLogger(__name__)

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))
REFRESH_TOKEN_DAYS = int(os.getenv("REFRESH_TOKEN_DAYS", "7"))


class WebSocketAuthError(Exception):
    """WebSocket authentication error"""
    pass


class WebSocketAuth:
    """
    WebSocket authentication manager

    Features:
    - JWT token validation
    - Session management
    - Token refresh
    - Connection authorization
    - Message encryption support
    """

    def __init__(self):
        self.active_sessions: Dict[str, Dict[str, Any]] = {}
        self.connection_count: Dict[str, int] = {}

    def generate_access_token(
        self,
        user_id: str,
        additional_claims: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate JWT access token

        Args:
            user_id: User ID
            additional_claims: Additional JWT claims

        Returns:
            JWT token string
        """
        now = datetime.utcnow()
        payload = {
            "user_id": user_id,
            "type": "access",
            "iat": now,
            "exp": now + timedelta(hours=JWT_EXPIRATION_HOURS),
            "nbf": now,
        }

        if additional_claims:
            payload.update(additional_claims)

        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        return token

    def generate_refresh_token(
        self,
        user_id: str
    ) -> str:
        """
        Generate JWT refresh token

        Args:
            user_id: User ID

        Returns:
            JWT refresh token
        """
        now = datetime.utcnow()
        payload = {
            "user_id": user_id,
            "type": "refresh",
            "iat": now,
            "exp": now + timedelta(days=REFRESH_TOKEN_DAYS),
        }

        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        return token

    def verify_token(self, token: str) -> Dict[str, Any]:
        """
        Verify and decode JWT token

        Args:
            token: JWT token string

        Returns:
            Decoded token payload

        Raises:
            WebSocketAuthError: If token is invalid
        """
        try:
            payload = jwt.decode(
                token,
                JWT_SECRET,
                algorithms=[JWT_ALGORITHM]
            )

            # Check expiration
            exp = payload.get("exp")
            if exp and datetime.utcnow().timestamp() > exp:
                raise WebSocketAuthError("Token expired")

            return payload

        except jwt.ExpiredSignatureError:
            raise WebSocketAuthError("Token expired")
        except jwt.InvalidTokenError as e:
            raise WebSocketAuthError(f"Invalid token: {str(e)}")

    def refresh_access_token(self, refresh_token: str) -> str:
        """
        Refresh access token using refresh token

        Args:
            refresh_token: Refresh token

        Returns:
            New access token

        Raises:
            WebSocketAuthError: If refresh token is invalid
        """
        try:
            payload = self.verify_token(refresh_token)

            if payload.get("type") != "refresh":
                raise WebSocketAuthError("Invalid token type")

            user_id = payload.get("user_id")
            if not user_id:
                raise WebSocketAuthError("Missing user_id in token")

            # Generate new access token
            return self.generate_access_token(user_id)

        except Exception as e:
            raise WebSocketAuthError(f"Failed to refresh token: {str(e)}")

    async def authenticate_connection(
        self,
        websocket: WebSocket,
        token: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Authenticate WebSocket connection

        Args:
            websocket: WebSocket instance
            token: JWT token (from query params or headers)

        Returns:
            Authenticated user data

        Raises:
            WebSocketException: If authentication fails
        """
        try:
            # Get token from query params if not provided
            if not token:
                token = websocket.query_params.get("token")

            if not token:
                # Try to get from headers
                token = websocket.headers.get("Authorization")
                if token and token.startswith("Bearer "):
                    token = token[7:]

            if not token:
                raise WebSocketAuthError("No authentication token provided")

            # Verify token
            payload = self.verify_token(token)

            # Extract user info
            user_id = payload.get("user_id")
            if not user_id:
                raise WebSocketAuthError("Invalid token payload")

            # Create session
            session_id = self._create_session(user_id, websocket)

            # Track connection count
            self._increment_connection_count(user_id)

            logger.info(f"WebSocket authenticated: user={user_id}, session={session_id}")

            return {
                "user_id": user_id,
                "session_id": session_id,
                "authenticated": True,
                "token_payload": payload
            }

        except WebSocketAuthError as e:
            logger.warning(f"WebSocket authentication failed: {str(e)}")
            raise WebSocketException(
                code=status.WS_1008_POLICY_VIOLATION,
                reason=str(e)
            )
        except Exception as e:
            logger.error(f"WebSocket authentication error: {str(e)}")
            raise WebSocketException(
                code=status.WS_1011_INTERNAL_ERROR,
                reason="Authentication error"
            )

    def _create_session(
        self,
        user_id: str,
        websocket: WebSocket
    ) -> str:
        """
        Create WebSocket session

        Args:
            user_id: User ID
            websocket: WebSocket instance

        Returns:
            Session ID
        """
        import uuid
        session_id = str(uuid.uuid4())

        self.active_sessions[session_id] = {
            "user_id": user_id,
            "websocket": websocket,
            "connected_at": datetime.utcnow(),
            "last_activity": datetime.utcnow()
        }

        return session_id

    def _increment_connection_count(self, user_id: str):
        """Increment connection count for user"""
        if user_id not in self.connection_count:
            self.connection_count[user_id] = 0
        self.connection_count[user_id] += 1

    def _decrement_connection_count(self, user_id: str):
        """Decrement connection count for user"""
        if user_id in self.connection_count:
            self.connection_count[user_id] = max(
                0,
                self.connection_count[user_id] - 1
            )

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session data"""
        return self.active_sessions.get(session_id)

    def update_session_activity(self, session_id: str):
        """Update last activity timestamp for session"""
        if session_id in self.active_sessions:
            self.active_sessions[session_id]["last_activity"] = datetime.utcnow()

    def close_session(self, session_id: str):
        """
        Close WebSocket session

        Args:
            session_id: Session ID
        """
        session = self.active_sessions.get(session_id)
        if session:
            user_id = session["user_id"]
            self._decrement_connection_count(user_id)
            del self.active_sessions[session_id]
            logger.info(f"WebSocket session closed: {session_id}")

    def get_user_sessions(self, user_id: str) -> list:
        """Get all active sessions for user"""
        return [
            session_id
            for session_id, session in self.active_sessions.items()
            if session["user_id"] == user_id
        ]

    def get_user_connection_count(self, user_id: str) -> int:
        """Get number of active connections for user"""
        return self.connection_count.get(user_id, 0)

    def cleanup_stale_sessions(self, timeout_minutes: int = 30):
        """
        Clean up stale sessions

        Args:
            timeout_minutes: Session timeout in minutes
        """
        now = datetime.utcnow()
        timeout_delta = timedelta(minutes=timeout_minutes)

        stale_sessions = [
            session_id
            for session_id, session in self.active_sessions.items()
            if now - session["last_activity"] > timeout_delta
        ]

        for session_id in stale_sessions:
            self.close_session(session_id)

        if stale_sessions:
            logger.info(f"Cleaned up {len(stale_sessions)} stale sessions")

    def validate_message_signature(
        self,
        message: Dict[str, Any],
        signature: str,
        secret: Optional[str] = None
    ) -> bool:
        """
        Validate message signature for encrypted messages

        Args:
            message: Message data
            signature: HMAC signature
            secret: Optional secret key (defaults to JWT_SECRET)

        Returns:
            True if signature is valid
        """
        import hmac
        import hashlib
        import json

        secret_key = secret or JWT_SECRET

        # Create expected signature
        message_str = json.dumps(message, sort_keys=True)
        expected_signature = hmac.new(
            secret_key.encode(),
            message_str.encode(),
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(signature, expected_signature)

    def create_message_signature(
        self,
        message: Dict[str, Any],
        secret: Optional[str] = None
    ) -> str:
        """
        Create HMAC signature for message

        Args:
            message: Message data
            secret: Optional secret key

        Returns:
            HMAC signature
        """
        import hmac
        import hashlib
        import json

        secret_key = secret or JWT_SECRET
        message_str = json.dumps(message, sort_keys=True)

        signature = hmac.new(
            secret_key.encode(),
            message_str.encode(),
            hashlib.sha256
        ).hexdigest()

        return signature

    def get_statistics(self) -> Dict[str, Any]:
        """
        Get authentication statistics

        Returns:
            Statistics dictionary
        """
        return {
            "active_sessions": len(self.active_sessions),
            "unique_users": len(self.connection_count),
            "total_connections": sum(self.connection_count.values()),
            "sessions_by_user": dict(self.connection_count)
        }


# Global WebSocket auth instance
ws_auth = WebSocketAuth()
