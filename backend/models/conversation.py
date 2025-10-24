"""
Conversation model
Represents chat conversations with metadata and settings
"""

from sqlalchemy import Column, String, DateTime, Boolean, Integer, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from ..database.session import Base


class Conversation(Base):
    """
    Conversation model for organizing chat sessions

    Attributes:
        id: Unique conversation identifier (UUID)
        user_id: Owner user ID (foreign key)
        title: Conversation title
        description: Optional description
        model: AI model used
        provider: AI provider (openai, anthropic, google)
        system_prompt: Custom system prompt
        created_at: Creation timestamp
        updated_at: Last update timestamp
        is_archived: Archive status
        is_pinned: Pin status
        is_favorite: Favorite status
        folder_id: Optional folder organization
        tags: List of tags
        settings: Conversation-specific settings
        metadata: Additional metadata
        message_count: Total number of messages
        token_count: Total tokens used
    """

    __tablename__ = "conversations"

    # Primary key
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Foreign key to user
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Basic info
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # AI configuration
    model = Column(String(100), nullable=False, default="gpt-4")
    provider = Column(String(50), nullable=False, default="openai")
    system_prompt = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Organization
    is_archived = Column(Boolean, default=False, nullable=False)
    is_pinned = Column(Boolean, default=False, nullable=False)
    is_favorite = Column(Boolean, default=False, nullable=False)
    folder_id = Column(String(36), nullable=True, index=True)

    # Tags and metadata
    tags = Column(JSON, default=list, nullable=False)
    settings = Column(JSON, default=dict, nullable=False)
    metadata = Column(JSON, default=dict, nullable=False)

    # Statistics
    message_count = Column(Integer, default=0, nullable=False)
    token_count = Column(Integer, default=0, nullable=False)

    # Relationships
    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Conversation(id={self.id}, title={self.title}, user_id={self.user_id})>"

    def to_dict(self, include_messages=False):
        """
        Convert conversation to dictionary

        Args:
            include_messages: Include related messages

        Returns:
            dict: Conversation data
        """
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "description": self.description,
            "model": self.model,
            "provider": self.provider,
            "system_prompt": self.system_prompt,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "is_archived": self.is_archived,
            "is_pinned": self.is_pinned,
            "is_favorite": self.is_favorite,
            "folder_id": self.folder_id,
            "tags": self.tags,
            "settings": self.settings,
            "metadata": self.metadata,
            "message_count": self.message_count,
            "token_count": self.token_count,
        }

        if include_messages:
            data["messages"] = [msg.to_dict() for msg in self.messages]

        return data

    def update_stats(self, message_tokens=0):
        """Update conversation statistics"""
        self.message_count += 1
        self.token_count += message_tokens
        self.updated_at = datetime.utcnow()

    def add_tag(self, tag: str):
        """Add a tag to the conversation"""
        if tag not in self.tags:
            self.tags.append(tag)

    def remove_tag(self, tag: str):
        """Remove a tag from the conversation"""
        if tag in self.tags:
            self.tags.remove(tag)

    def toggle_archive(self):
        """Toggle archive status"""
        self.is_archived = not self.is_archived

    def toggle_pin(self):
        """Toggle pin status"""
        self.is_pinned = not self.is_pinned

    def toggle_favorite(self):
        """Toggle favorite status"""
        self.is_favorite = not self.is_favorite


class Folder(Base):
    """
    Folder model for organizing conversations

    Attributes:
        id: Unique folder identifier (UUID)
        user_id: Owner user ID
        name: Folder name
        parent_id: Parent folder for nested folders
        created_at: Creation timestamp
        color: Folder color
        icon: Folder icon
    """

    __tablename__ = "folders"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    name = Column(String(255), nullable=False)
    parent_id = Column(String(36), ForeignKey("folders.id", ondelete="CASCADE"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    color = Column(String(20), default="#6366f1", nullable=False)
    icon = Column(String(50), default="folder", nullable=False)

    # Relationships
    children = relationship("Folder", backref="parent", remote_side=[id])

    def __repr__(self):
        return f"<Folder(id={self.id}, name={self.name})>"

    def to_dict(self):
        """Convert folder to dictionary"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "parent_id": self.parent_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "color": self.color,
            "icon": self.icon,
        }
