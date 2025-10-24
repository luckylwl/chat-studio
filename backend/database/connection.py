"""
Database Connection Module
Handles PostgreSQL database connections using SQLAlchemy
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
import os
from dotenv import load_dotenv

load_dotenv()

# Database configuration
DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    raise ValueError("DATABASE_URL must be set in environment variables")

# Create engine
engine = create_engine(
    DATABASE_URL,
    poolclass=NullPool if os.getenv('ENV') == 'test' else None,
    echo=os.getenv('SQL_ECHO', 'false').lower() == 'true',
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()

def get_db():
    """
    Dependency function for FastAPI to get database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """
    Initialize database - create all tables
    """
    Base.metadata.create_all(bind=engine)

def drop_db():
    """
    Drop all tables - use with caution!
    """
    Base.metadata.drop_all(bind=engine)
