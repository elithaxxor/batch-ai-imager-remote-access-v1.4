import os
import sqlalchemy as sa
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import datetime

# Get database URL from environment variables
DATABASE_URL = os.environ.get("DATABASE_URL")

# Create SQLAlchemy engine
engine = create_engine(DATABASE_URL)

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
    images = relationship("Image", back_populates="folder", cascade="all, delete-orphan")
    
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
    
    def __repr__(self):
        return f"<Image(file_name='{self.file_name}', object_name='{self.object_name}')>"

# Create all tables in the database
Base.metadata.create_all(engine)

# Create a session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """
    Get a database session
    """
    db = SessionLocal()
    try:
        return db
    finally:
        db.close()

# Database operations
def get_all_folders():
    """
    Get all folders from the database
    """
    db = get_db()
    return db.query(Folder).order_by(Folder.processed_at.desc()).all()

def get_folder_by_path(path):
    """
    Get a folder by its path
    """
    db = get_db()
    return db.query(Folder).filter(Folder.path == path).first()

def add_folder(name, path):
    """
    Add a new folder to the database
    """
    db = get_db()
    
    # Check if folder already exists
    existing_folder = db.query(Folder).filter(Folder.path == path).first()
    if existing_folder:
        return existing_folder
    
    # Create new folder
    folder = Folder(name=name, path=path)
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder

def add_image_result(folder_id, file_name, file_path, object_name, description, confidence):
    """
    Add an image analysis result to the database
    """
    db = get_db()
    
    # Check if image already exists
    existing_image = db.query(Image).filter(Image.file_path == file_path).first()
    if existing_image:
        # Update existing image
        existing_image.object_name = object_name
        existing_image.description = description
        existing_image.confidence = confidence
        existing_image.processed_at = datetime.datetime.utcnow()
        db.commit()
        return existing_image
    
    # Create new image
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

def get_images_by_folder_id(folder_id):
    """
    Get all images for a specific folder
    """
    db = get_db()
    return db.query(Image).filter(Image.folder_id == folder_id).all()

def get_image_by_path(file_path):
    """
    Get an image by its file path
    """
    db = get_db()
    return db.query(Image).filter(Image.file_path == file_path).first()

def search_images(query):
    """
    Search for images by object name or description
    """
    db = get_db()
    return db.query(Image).filter(
        (Image.object_name.ilike(f"%{query}%")) | 
        (Image.description.ilike(f"%{query}%"))
    ).all()