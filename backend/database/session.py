"""
Database session management
Handles PostgreSQL connections using SQLAlchemy
"""

from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
import os
from typing import Generator
import logging

logger = logging.getLogger(__name__)

# Database URL configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/chat_studio"
)

# Create SQLAlchemy engine with connection pooling
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,  # Number of connections to keep open
    max_overflow=20,  # Max additional connections
    pool_pre_ping=True,  # Verify connections before using
    pool_recycle=3600,  # Recycle connections after 1 hour
    echo=os.getenv("SQL_ECHO", "false").lower() == "true",  # Log SQL queries
)

# Create SessionLocal class
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base class for models
Base = declarative_base()


# Connection event listeners
@event.listens_for(engine, "connect")
def receive_connect(dbapi_connection, connection_record):
    """Execute when a new connection is established"""
    logger.info("Database connection established")


@event.listens_for(engine, "close")
def receive_close(dbapi_connection, connection_record):
    """Execute when a connection is closed"""
    logger.info("Database connection closed")


# Dependency for FastAPI
def get_db() -> Generator[Session, None, None]:
    """
    Database dependency for FastAPI endpoints

    Usage:
        @app.get("/items")
        def read_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Database initialization
def init_db():
    """
    Initialize database tables
    Creates all tables defined in models
    """
    try:
        logger.info("Initializing database...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise


# Database health check
def check_db_health() -> bool:
    """
    Check if database is healthy and accessible

    Returns:
        bool: True if database is accessible, False otherwise
    """
    try:
        db = SessionLocal()
        # Simple query to test connection
        db.execute("SELECT 1")
        db.close()
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False


# Database cleanup
def close_db():
    """
    Close all database connections
    Should be called on application shutdown
    """
    try:
        engine.dispose()
        logger.info("Database connections closed")
    except Exception as e:
        logger.error(f"Failed to close database connections: {e}")


# Transaction context manager
class DatabaseTransaction:
    """
    Context manager for database transactions

    Usage:
        with DatabaseTransaction() as db:
            user = User(email="test@example.com")
            db.add(user)
            db.commit()
    """

    def __enter__(self) -> Session:
        self.db = SessionLocal()
        return self.db

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.db.rollback()
            logger.error(f"Transaction rolled back: {exc_val}")
        self.db.close()
        return False


# Utility functions
def get_db_stats() -> dict:
    """
    Get database connection pool statistics

    Returns:
        dict: Pool statistics
    """
    pool = engine.pool
    return {
        "pool_size": pool.size(),
        "checked_in": pool.checkedin(),
        "checked_out": pool.checkedout(),
        "overflow": pool.overflow(),
        "total_connections": pool.size() + pool.overflow()
    }
