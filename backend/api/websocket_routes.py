"""
WebSocket API Routes
Provides WebSocket endpoints with authentication
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, HTTPException
from typing import Optional
import logging
import json

from backend.websocket.connection_manager import connection_manager
from backend.websocket.auth import ws_auth

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws/chat")
async def websocket_chat_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None, description="JWT authentication token")
):
    """
    WebSocket endpoint for chat

    Authentication:
    - Pass JWT token via query parameter: /ws/chat?token=YOUR_TOKEN
    - Or via Authorization header: Authorization: Bearer YOUR_TOKEN

    Messages format:
    {
        "type": "message|typing|ping",
        "data": {...}
    }

    Response format:
    {
        "type": "message|auth_success|pong|error",
        "data": {...}
    }
    """
    session_id = None

    try:
        # Connect and authenticate
        conn_info = await connection_manager.connect(websocket, token)
        session_id = conn_info["session_id"]
        user_id = conn_info["user_id"]

        logger.info(f"WebSocket chat connected: user={user_id}, session={session_id}")

        # Message handling loop
        while True:
            try:
                # Receive message
                data = await websocket.receive_text()
                message = json.loads(data)

                message_type = message.get("type")
                message_data = message.get("data", {})

                # Update session activity
                ws_auth.update_session_activity(session_id)

                # Handle different message types
                if message_type == "ping":
                    await connection_manager.handle_heartbeat(session_id)

                elif message_type == "message":
                    # Handle chat message
                    await handle_chat_message(
                        session_id,
                        user_id,
                        message_data
                    )

                elif message_type == "typing":
                    # Handle typing indicator
                    conversation_id = message_data.get("conversation_id")
                    is_typing = message_data.get("is_typing", False)

                    await connection_manager.send_typing_indicator(
                        conversation_id,
                        user_id,
                        is_typing
                    )

                elif message_type == "subscribe":
                    # Subscribe to conversation updates
                    conversation_id = message_data.get("conversation_id")
                    await handle_subscription(session_id, conversation_id)

                else:
                    await connection_manager.send_to_session(session_id, {
                        "type": "error",
                        "data": {
                            "message": f"Unknown message type: {message_type}"
                        }
                    })

            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected: session={session_id}")
                break

            except json.JSONDecodeError:
                await connection_manager.send_to_session(session_id, {
                    "type": "error",
                    "data": {"message": "Invalid JSON"}
                })

            except Exception as e:
                logger.error(f"Error handling message: {str(e)}")
                await connection_manager.send_to_session(session_id, {
                    "type": "error",
                    "data": {"message": "Internal error"}
                })

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected during connection")

    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")

    finally:
        if session_id:
            await connection_manager.disconnect(session_id)


async def handle_chat_message(
    session_id: str,
    user_id: str,
    message_data: dict
):
    """
    Handle chat message

    Args:
        session_id: Session ID
        user_id: User ID
        message_data: Message data
    """
    conversation_id = message_data.get("conversation_id")
    content = message_data.get("content")
    message_id = message_data.get("message_id")

    if not conversation_id or not content:
        await connection_manager.send_to_session(session_id, {
            "type": "error",
            "data": {"message": "Missing conversation_id or content"}
        })
        return

    # In a real implementation:
    # 1. Save message to database
    # 2. Process with AI
    # 3. Broadcast to conversation participants

    # Echo message back for now
    await connection_manager.send_to_session(session_id, {
        "type": "message_received",
        "data": {
            "message_id": message_id,
            "conversation_id": conversation_id,
            "status": "received"
        }
    })

    logger.info(f"Chat message: user={user_id}, conv={conversation_id}")


async def handle_subscription(session_id: str, conversation_id: str):
    """
    Handle conversation subscription

    Args:
        session_id: Session ID
        conversation_id: Conversation ID
    """
    # In a real implementation:
    # Track conversation subscriptions and send updates

    await connection_manager.send_to_session(session_id, {
        "type": "subscribed",
        "data": {
            "conversation_id": conversation_id,
            "status": "subscribed"
        }
    })

    logger.info(f"Subscribed to conversation: session={session_id}, conv={conversation_id}")


@router.get("/ws/stats")
async def websocket_stats():
    """
    Get WebSocket connection statistics

    Returns:
        Connection statistics
    """
    try:
        stats = connection_manager.get_statistics()
        return {
            "success": True,
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ws/sessions")
async def list_sessions():
    """
    List all active WebSocket sessions

    Returns:
        List of active sessions
    """
    try:
        sessions = []
        for session_id in connection_manager.connections:
            session_info = connection_manager.get_session_info(session_id)
            if session_info:
                sessions.append(session_info)

        return {
            "success": True,
            "sessions": sessions,
            "count": len(sessions)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ws/broadcast")
async def broadcast_message(message: dict):
    """
    Broadcast message to all connected clients

    Request body:
    {
        "type": "announcement",
        "data": {...}
    }
    """
    try:
        await connection_manager.broadcast(message)
        return {
            "success": True,
            "message": "Broadcast sent"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/ws/sessions/{session_id}")
async def disconnect_session(session_id: str):
    """
    Forcefully disconnect a WebSocket session

    Args:
        session_id: Session ID to disconnect
    """
    try:
        await connection_manager.disconnect(session_id)
        return {
            "success": True,
            "message": f"Session {session_id} disconnected"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
