"""
Message model
Represents individual messages in conversations
"""

from sqlalchemy import Column, String, DateTime, Integer, JSON, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from ..database.session import Base


class MessageRole(str, enum.Enum):
    """Message role enumeration"""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class Message(Base):
    """
    Message model for storing chat messages

    Attributes:
        id: Unique message identifier (UUID)
        conversation_id: Parent conversation ID
        role: Message role (user, assistant, system)
        content: Message content
        created_at: Creation timestamp
        edited_at: Last edit timestamp
        parent_id: Parent message for branching
        tokens: Token count for this message
        model: AI model used (for assistant messages)
        metadata: Additional metadata
        attachments: File attachments
        reactions: User reactions
        is_deleted: Soft delete flag
        version: Message version number
    """

    __tablename__ = "messages"

    # Primary key
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Foreign key to conversation
    conversation_id = Column(
        String(36),
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Message data
    role = Column(SQLEnum(MessageRole), nullable=False, index=True)
    content = Column(Text, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    edited_at = Column(DateTime, nullable=True)

    # Message branching (for version control)
    parent_id = Column(String(36), ForeignKey("messages.id", ondelete="SET NULL"), nullable=True)
    version = Column(Integer, default=1, nullable=False)

    # AI metadata
    tokens = Column(Integer, default=0, nullable=False)
    model = Column(String(100), nullable=True)

    # Additional data
    metadata = Column(JSON, default=dict, nullable=False)
    attachments = Column(JSON, default=list, nullable=False)
    reactions = Column(JSON, default=dict, nullable=False)

    # Soft delete
    is_deleted = Column(Boolean, default=False, nullable=False)

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    children = relationship("Message", backref="parent", remote_side=[id])

    def __repr__(self):
        return f"<Message(id={self.id}, role={self.role}, conversation_id={self.conversation_id})>"

    def to_dict(self, include_metadata=True):
        """
        Convert message to dictionary

        Args:
            include_metadata: Include metadata field

        Returns:
            dict: Message data
        """
        data = {
            "id": self.id,
            "conversation_id": self.conversation_id,
            "role": self.role.value,
            "content": self.content,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "edited_at": self.edited_at.isoformat() if self.edited_at else None,
            "parent_id": self.parent_id,
            "version": self.version,
            "tokens": self.tokens,
            "model": self.model,
            "attachments": self.attachments,
            "reactions": self.reactions,
            "is_deleted": self.is_deleted,
        }

        if include_metadata:
            data["metadata"] = self.metadata

        return data

    def edit_content(self, new_content: str):
        """Edit message content"""
        self.content = new_content
        self.edited_at = datetime.utcnow()

    def add_reaction(self, user_id: str, reaction: str):
        """Add a reaction to the message"""
        if reaction not in self.reactions:
            self.reactions[reaction] = []
        if user_id not in self.reactions[reaction]:
            self.reactions[reaction].append(user_id)

    def remove_reaction(self, user_id: str, reaction: str):
        """Remove a reaction from the message"""
        if reaction in self.reactions and user_id in self.reactions[reaction]:
            self.reactions[reaction].remove(user_id)
            if not self.reactions[reaction]:
                del self.reactions[reaction]

    def soft_delete(self):
        """Soft delete the message"""
        self.is_deleted = True

    def create_branch(self, new_content: str) -> "Message":
        """Create a new version/branch of this message"""
        new_message = Message(
            conversation_id=self.conversation_id,
            role=self.role,
            content=new_content,
            parent_id=self.id,
            version=self.version + 1,
            model=self.model
        )
        return new_message


# Additional model for message history/versions
class MessageHistory(Base):
    """
    Message history for tracking edits

    Attributes:
        id: History entry ID
        message_id: Original message ID
        content: Historical content
        edited_at: Edit timestamp
        edited_by: User who made the edit
    """

    __tablename__ = "message_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    message_id = Column(String(36), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, index=True)

    content = Column(Text, nullable=False)
    edited_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    edited_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    def __repr__(self):
        return f"<MessageHistory(id={self.id}, message_id={self.message_id})>"

    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": self.id,
            "message_id": self.message_id,
            "content": self.content,
            "edited_at": self.edited_at.isoformat() if self.edited_at else None,
            "edited_by": self.edited_by,
        }


# Import Boolean for is_deleted
from sqlalchemy import Boolean
