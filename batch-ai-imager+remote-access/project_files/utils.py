import os
from PIL import Image
import logging

logger = logging.getLogger(__name__)

def is_valid_image(file_path):
    """
    Check if a file is a valid image supported by the application
    """
    # Supported image extensions
    supported_extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp']
    
    # Check file extension
    file_ext = os.path.splitext(file_path)[1].lower()
    if file_ext not in supported_extensions:
        logger.info(f"Unsupported image extension: {file_path}")
        return False
    
    # Try to open the image to validate it
    try:
        with Image.open(file_path) as img:
            # Verify it's an image by accessing its properties
            img.size
            return True
    except Exception as e:
        logger.warning(f"Image validation failed for {file_path}: {e}")
        return False

def get_all_image_files(folder_path, recursive=False):
    """
    Get a list of all valid image files in a folder (optionally recursive)
    """
    if not os.path.exists(folder_path) or not os.path.isdir(folder_path):
        return []
    
    image_files = []
    
    # Go through all files in the folder
    for root, dirs, files in os.walk(folder_path):
        for filename in files:
            if filename.startswith('.'):
                continue  # Skip hidden files
            file_path = os.path.join(root, filename)
            
            # Check if it's a file and a valid image
            if os.path.isfile(file_path) and is_valid_image(file_path):
                image_files.append(file_path)
        if not recursive:
            break
    
    return image_files

def get_image_dimensions(file_path):
    """
    Get the dimensions of an image
    """
    try:
        with Image.open(file_path) as img:
            return img.size
    except Exception as e:
        logger.warning(f"Failed to get dimensions for {file_path}: {e}")
        return None

def get_file_size(file_path):
    """
    Get the file size in bytes
    """
    try:
        return os.path.getsize(file_path)
    except Exception as e:
        logger.warning(f"Failed to get file size for {file_path}: {e}")
        return None
