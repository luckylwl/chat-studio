"""
User model
Represents application users with authentication and profile data
"""

from sqlalchemy import Column, String, DateTime, Boolean, Integer, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from ..database.session import Base


class User(Base):
    """
    User model for authentication and profile management

    Attributes:
        id: Unique user identifier (UUID)
        email: User's email address (unique)
        username: Display name
        hashed_password: SHA256 hashed password
        is_active: Account status
        is_verified: Email verification status
        is_superuser: Admin privileges
        created_at: Account creation timestamp
        updated_at: Last profile update timestamp
        last_login: Last login timestamp
        settings: User preferences (JSON)
        api_keys: Encrypted API keys for AI providers
        usage_stats: Usage statistics
    """

    __tablename__ = "users"

    # Primary key
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Authentication
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)

    # Account status
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_login = Column(DateTime, nullable=True)

    # User preferences and settings
    settings = Column(JSON, default=dict, nullable=False)

    # API keys storage (encrypted)
    api_keys = Column(JSON, default=dict, nullable=False)

    # Usage statistics
    usage_stats = Column(JSON, default=lambda: {
        "total_conversations": 0,
        "total_messages": 0,
        "total_tokens": 0,
        "last_active": None
    }, nullable=False)

    # Subscription info
    subscription_tier = Column(String(50), default="free", nullable=False)
    subscription_expires = Column(DateTime, nullable=True)

    # Quota management
    daily_message_limit = Column(Integer, default=100, nullable=False)
    daily_message_count = Column(Integer, default=0, nullable=False)
    quota_reset_date = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, username={self.username})>"

    def to_dict(self, include_sensitive=False):
        """
        Convert user to dictionary

        Args:
            include_sensitive: Include sensitive data like hashed_password

        Returns:
            dict: User data
        """
        data = {
            "id": self.id,
            "email": self.email,
            "username": self.username,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "is_superuser": self.is_superuser,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "settings": self.settings,
            "usage_stats": self.usage_stats,
            "subscription_tier": self.subscription_tier,
            "subscription_expires": self.subscription_expires.isoformat() if self.subscription_expires else None,
            "daily_message_limit": self.daily_message_limit,
            "daily_message_count": self.daily_message_count,
        }

        if include_sensitive:
            data["hashed_password"] = self.hashed_password
            data["api_keys"] = self.api_keys

        return data

    def update_usage_stats(self, messages=0, tokens=0):
        """Update user usage statistics"""
        self.usage_stats["total_messages"] += messages
        self.usage_stats["total_tokens"] += tokens
        self.usage_stats["last_active"] = datetime.utcnow().isoformat()
        self.daily_message_count += messages

    def reset_daily_quota(self):
        """Reset daily message quota"""
        self.daily_message_count = 0
        self.quota_reset_date = datetime.utcnow()

    def can_send_message(self) -> bool:
        """Check if user can send more messages today"""
        # Check if quota needs reset
        if (datetime.utcnow() - self.quota_reset_date).days >= 1:
            self.reset_daily_quota()

        return self.daily_message_count < self.daily_message_limit

    def update_last_login(self):
        """Update last login timestamp"""
        self.last_login = datetime.utcnow()
