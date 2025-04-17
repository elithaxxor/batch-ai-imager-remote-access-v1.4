import os
import sqlalchemy as sa
import json
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import datetime

# Get database URL from environment variables
DATABASE_URL = os.environ.get("DATABASE_URL")

# Modify URL for connection pooling
if DATABASE_URL:
    pool_url = DATABASE_URL.replace('.us-east-2', '-pooler.us-east-2')
    # Create SQLAlchemy engine with connection pool
    engine = create_engine(
        pool_url,
        pool_size=5,
        max_overflow=10,
        pool_timeout=30,
        pool_recycle=1800,
        pool_pre_ping=True
    )
else:
    raise Exception("DATABASE_URL environment variable not set")

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
    
    # Metadata fields
    metadata_json = Column(Text, nullable=True)  # Stores all metadata as JSON
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    camera_make = Column(String(255), nullable=True)
    camera_model = Column(String(255), nullable=True)
    date_taken = Column(DateTime, nullable=True)
    focal_length = Column(Float, nullable=True)
    exposure_time = Column(String(50), nullable=True)
    aperture = Column(Float, nullable=True)
    iso_speed = Column(Integer, nullable=True)
    gps_latitude = Column(Float, nullable=True)
    gps_longitude = Column(Float, nullable=True)
    file_size = Column(Integer, nullable=True)
    file_type = Column(String(50), nullable=True)
    
    # Relationship with folder
    folder = relationship("Folder", back_populates="images")
    # Relationship with favorites
    favorites = relationship("FavoriteImage", back_populates="image", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Image(file_name='{self.file_name}', object_name='{self.object_name}')>"

class FavoriteImage(Base):
    """
    Represents a favorite/pinned image for the dashboard
    """
    __tablename__ = 'favorite_images'
    
    id = Column(Integer, primary_key=True)
    image_id = Column(Integer, ForeignKey('images.id'), nullable=False)
    display_order = Column(Integer, default=0)  # For customizing display order
    note = Column(Text, nullable=True)  # User's note about why this is favorited
    custom_label = Column(String(255), nullable=True)  # Custom label for the image
    added_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationship with image
    image = relationship("Image", back_populates="favorites")
    
    def __repr__(self):
        return f"<FavoriteImage(image_id='{self.image_id}', custom_label='{self.custom_label}')>"

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

def add_image_result(folder_id, file_name, file_path, object_name, description, confidence, metadata=None):
    """
    Add an image analysis result to the database
    
    Args:
        folder_id: ID of the folder containing the image
        file_name: Name of the image file
        file_path: Full path to the image file
        object_name: Name of the object identified in the image
        description: Description of the image
        confidence: Confidence score of the analysis
        metadata: Dictionary containing image metadata
    """
    db = get_db()
    
    # Process metadata
    metadata_json = None
    width = None
    height = None
    camera_make = None
    camera_model = None
    date_taken = None
    focal_length = None
    exposure_time = None
    aperture = None
    iso_speed = None
    gps_latitude = None
    gps_longitude = None
    file_size = None
    file_type = None
    
    if metadata:
        metadata_json = json.dumps(metadata)
        width = metadata.get('width')
        height = metadata.get('height')
        camera_make = metadata.get('camera_make')
        camera_model = metadata.get('camera_model')
        date_taken = metadata.get('date_taken')
        focal_length = metadata.get('focal_length')
        exposure_time = metadata.get('exposure_time')
        aperture = metadata.get('aperture')
        iso_speed = metadata.get('iso_speed')
        gps_latitude = metadata.get('gps_latitude')
        gps_longitude = metadata.get('gps_longitude')
        file_size = metadata.get('file_size')
        file_type = metadata.get('file_type')
    
    # Check if image already exists
    existing_image = db.query(Image).filter(Image.file_path == file_path).first()
    if existing_image:
        # Update existing image
        existing_image.object_name = object_name
        existing_image.description = description
        existing_image.confidence = confidence
        existing_image.processed_at = datetime.datetime.utcnow()
        
        # Update metadata if provided
        if metadata:
            existing_image.metadata_json = metadata_json
            existing_image.width = width
            existing_image.height = height
            existing_image.camera_make = camera_make
            existing_image.camera_model = camera_model
            existing_image.date_taken = date_taken
            existing_image.focal_length = focal_length
            existing_image.exposure_time = exposure_time
            existing_image.aperture = aperture
            existing_image.iso_speed = iso_speed
            existing_image.gps_latitude = gps_latitude
            existing_image.gps_longitude = gps_longitude
            existing_image.file_size = file_size
            existing_image.file_type = file_type
            
        db.commit()
        return existing_image
    
    # Create new image
    image = Image(
        folder_id=folder_id,
        file_name=file_name,
        file_path=file_path,
        object_name=object_name,
        description=description,
        confidence=confidence,
        metadata_json=metadata_json,
        width=width,
        height=height,
        camera_make=camera_make,
        camera_model=camera_model,
        date_taken=date_taken,
        focal_length=focal_length,
        exposure_time=exposure_time,
        aperture=aperture,
        iso_speed=iso_speed,
        gps_latitude=gps_latitude,
        gps_longitude=gps_longitude,
        file_size=file_size,
        file_type=file_type
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
    Search for images by object name, description, or metadata fields
    """
    db = get_db()
    return db.query(Image).filter(
        (Image.object_name.ilike(f"%{query}%")) | 
        (Image.description.ilike(f"%{query}%")) |
        (Image.camera_make.ilike(f"%{query}%")) |
        (Image.camera_model.ilike(f"%{query}%")) |
        (Image.file_type.ilike(f"%{query}%")) |
        (Image.metadata_json.ilike(f"%{query}%"))
    ).all()

# Favorites operations
def add_to_favorites(image_id, custom_label=None, note=None, display_order=0):
    """
    Add an image to favorites
    
    Args:
        image_id: ID of the image to add to favorites
        custom_label: Optional custom label for the image
        note: Optional note about the image
        display_order: Optional display order (default 0)
        
    Returns:
        The created FavoriteImage object
    """
    db = get_db()
    
    # Check if image exists
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise ValueError(f"Image with ID {image_id} not found")
    
    # Check if already favorited
    existing = db.query(FavoriteImage).filter(FavoriteImage.image_id == image_id).first()
    if existing:
        # Update existing favorite
        if custom_label is not None:
            existing.custom_label = custom_label
        if note is not None:
            existing.note = note
        if display_order is not None:
            existing.display_order = display_order
        db.commit()
        return existing
    
    # Create new favorite
    favorite = FavoriteImage(
        image_id=image_id,
        custom_label=custom_label,
        note=note,
        display_order=display_order
    )
    db.add(favorite)
    db.commit()
    db.refresh(favorite)
    return favorite

def remove_from_favorites(favorite_id):
    """
    Remove an image from favorites
    
    Args:
        favorite_id: ID of the favorite to remove
        
    Returns:
        Boolean indicating success
    """
    db = get_db()
    favorite = db.query(FavoriteImage).filter(FavoriteImage.id == favorite_id).first()
    if not favorite:
        return False
    
    db.delete(favorite)
    db.commit()
    return True

def get_all_favorites():
    """
    Get all favorite images ordered by display_order
    
    Returns:
        List of FavoriteImage objects with their related Image objects
    """
    db = get_db()
    return db.query(FavoriteImage).order_by(FavoriteImage.display_order.asc()).all()

def get_favorite_by_id(favorite_id):
    """
    Get a specific favorite by ID
    
    Args:
        favorite_id: ID of the favorite to retrieve
        
    Returns:
        FavoriteImage object or None
    """
    db = get_db()
    return db.query(FavoriteImage).filter(FavoriteImage.id == favorite_id).first()

def update_favorite_order(favorite_id, new_order):
    """
    Update the display order of a favorite image
    
    Args:
        favorite_id: ID of the favorite to update
        new_order: New display order
        
    Returns:
        The updated FavoriteImage object
    """
    db = get_db()
    favorite = db.query(FavoriteImage).filter(FavoriteImage.id == favorite_id).first()
    if not favorite:
        return None
    
    favorite.display_order = new_order
    db.commit()
    db.refresh(favorite)
    return favorite

def update_favorite_details(favorite_id, custom_label=None, note=None):
    """
    Update the details of a favorite image
    
    Args:
        favorite_id: ID of the favorite to update
        custom_label: New custom label (or None to keep existing)
        note: New note (or None to keep existing)
        
    Returns:
        The updated FavoriteImage object
    """
    db = get_db()
    favorite = db.query(FavoriteImage).filter(FavoriteImage.id == favorite_id).first()
    if not favorite:
        return None
    
    if custom_label is not None:
        favorite.custom_label = custom_label
    if note is not None:
        favorite.note = note
    
    db.commit()
    db.refresh(favorite)
    return favorite