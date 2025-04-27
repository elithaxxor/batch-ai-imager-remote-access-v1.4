import os
import sqlalchemy as sa
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, joinedload
import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get database URL from environment variables
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    logger.error("DATABASE_URL environment variable not set. Please set it before running the application.")
    raise RuntimeError("DATABASE_URL environment variable not set. Please set it before running the application.")

# Create SQLAlchemy engine
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# Create declarative base
Base = declarative_base()

# Define models
class Folder(Base):
    """
    Represents a folder containing images
    """
    __tablename__ = 'folders'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    path = Column(String(512), nullable=False, unique=True)
    processed_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationship with images
    images = relationship("Image", back_populates="folder", cascade="all, delete-orphan", lazy="joined")
    
    def __repr__(self):
        return f"<Folder(name='{self.name}', path='{self.path}')>"

class Image(Base):
    """
    Represents an image and its analysis results
    """
    __tablename__ = 'images'
    
    id = Column(Integer, primary_key=True)
    folder_id = Column(Integer, ForeignKey('folders.id'), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False, unique=True)
    object_name = Column(String(255))
    description = Column(Text)
    confidence = Column(Float)
    processed_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationship with folder
    folder = relationship("Folder", back_populates="images")

# Table creation moved to a function for maintainability

def create_tables():
    """
    Create all tables in the database. Should be called explicitly from main or setup script.
    """
    Base.metadata.create_all(engine)
    logger.info("All tables created successfully.")

# Create a session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """
    Get a database session (context manager)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Database operations

def get_all_folders():
    """
    Get all folders from the database, eager load images
    """
    try:
        with SessionLocal() as db:
            folders = db.query(Folder).options(joinedload(Folder.images)).order_by(Folder.processed_at.desc()).all()
            return folders
    except Exception as e:
        logger.error(f"Error fetching folders: {e}")
        return []

def get_folder_by_path(path):
    """
    Get a folder by its path
    """
    try:
        with SessionLocal() as db:
            return db.query(Folder).filter(Folder.path == path).first()
    except Exception as e:
        logger.error(f"Error fetching folder by path: {e}")
        return None

def add_folder(name, path):
    """
    Add a new folder to the database
    """
    try:
        with SessionLocal() as db:
            folder = Folder(name=name, path=path)
            db.add(folder)
            db.commit()
            db.refresh(folder)
            return folder
    except sa.exc.IntegrityError:
        logger.warning(f"Folder with path '{path}' already exists.")
        return None
    except Exception as e:
        logger.error(f"Error adding folder: {e}")
        return None

def add_image_result(folder_id, file_name, file_path, object_name, description, confidence):
    """
    Add an image analysis result to the database
    """
    try:
        with SessionLocal() as db:
            image = Image(
                folder_id=folder_id,
                file_name=file_name,
                file_path=file_path,
                object_name=object_name,
                description=description,
                confidence=confidence
            )
            db.add(image)
            db.commit()
            db.refresh(image)
            return image
    except sa.exc.IntegrityError:
        logger.warning(f"Image with path '{file_path}' already exists.")
        return None
    except Exception as e:
        logger.error(f"Error adding image result: {e}")
        return None

def get_images_by_folder_id(folder_id):
    """
    Get all images for a specific folder
    """
    try:
        with SessionLocal() as db:
            images = db.query(Image).filter(Image.folder_id == folder_id).order_by(Image.processed_at.desc()).all()
            return images
    except Exception as e:
        logger.error(f"Error fetching images by folder id: {e}")
        return []

def get_image_by_path(file_path):
    """
    Get an image by its file path
    """
    try:
        with SessionLocal() as db:
            return db.query(Image).filter(Image.file_path == file_path).first()
    except Exception as e:
        logger.error(f"Error fetching image by path: {e}")
        return None

def search_images(query):
    """
    Search for images by object name or description
    """
    try:
        with SessionLocal() as db:
            images = db.query(Image).filter(
                (Image.object_name.ilike(f"%{query}%")) |
                (Image.description.ilike(f"%{query}%"))
            ).order_by(Image.processed_at.desc()).all()
            return images
    except Exception as e:
        logger.error(f"Error searching images: {e}")
        return []