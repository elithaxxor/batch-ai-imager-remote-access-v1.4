import os
import json
import datetime
from PIL import Image
from pillow_heif import register_heif_opener
import exifread

# Register the HEIF opener to support HEIC format
register_heif_opener()

def is_valid_image(file_path):
    """
    Check if a file is a valid image supported by the application
    """
    # Supported image extensions
    supported_extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp', '.heic', '.heif']
    
    # Check file extension
    file_ext = os.path.splitext(file_path)[1].lower()
    if file_ext not in supported_extensions:
        return False
    
    # Try to open the image to validate it
    try:
        with Image.open(file_path) as img:
            # Verify it's an image by accessing its properties
            img.size
            return True
    except Exception:
        return False

def get_all_image_files(folder_path):
    """
    Get a list of all valid image files in a folder
    """
    if not os.path.exists(folder_path) or not os.path.isdir(folder_path):
        return []
    
    image_files = []
    
    # Go through all files in the folder
    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
        
        # Check if it's a file and a valid image
        if os.path.isfile(file_path) and is_valid_image(file_path):
            image_files.append(file_path)
    
    return image_files

def get_image_dimensions(file_path):
    """
    Get the dimensions of an image
    """
    try:
        with Image.open(file_path) as img:
            return img.size
    except Exception:
        return (0, 0)

def get_file_size(file_path):
    """
    Get the file size in bytes
    """
    try:
        return os.path.getsize(file_path)
    except Exception:
        return 0

def extract_image_metadata(file_path):
    """
    Extract metadata from an image file
    
    Args:
        file_path (str): Path to the image file
        
    Returns:
        dict: Dictionary containing metadata
    """
    metadata = {
        'width': 0,
        'height': 0,
        'file_size': 0,
        'file_type': '',
        'camera_make': '',
        'camera_model': '',
        'date_taken': None,
        'focal_length': None,
        'exposure_time': '',
        'aperture': None,
        'iso_speed': None,
        'gps_latitude': None,
        'gps_longitude': None,
    }
    
    try:
        # Basic file information
        metadata['file_size'] = get_file_size(file_path)
        _, ext = os.path.splitext(file_path)
        metadata['file_type'] = ext.lower().replace('.', '')
        
        # Get image dimensions
        width, height = get_image_dimensions(file_path)
        metadata['width'] = width
        metadata['height'] = height
        
        # Extract EXIF data
        with open(file_path, 'rb') as f:
            exif_tags = exifread.process_file(f, details=False)
            
            # Camera information
            if 'Image Make' in exif_tags:
                metadata['camera_make'] = str(exif_tags['Image Make'])
            
            if 'Image Model' in exif_tags:
                metadata['camera_model'] = str(exif_tags['Image Model'])
            
            # Date information
            if 'EXIF DateTimeOriginal' in exif_tags:
                date_str = str(exif_tags['EXIF DateTimeOriginal'])
                try:
                    # Convert date string to datetime object
                    metadata['date_taken'] = datetime.datetime.strptime(date_str, '%Y:%m:%d %H:%M:%S')
                except ValueError:
                    pass
            
            # Camera settings
            if 'EXIF FocalLength' in exif_tags:
                try:
                    focal_length_raw = str(exif_tags['EXIF FocalLength'])
                    if '/' in focal_length_raw:
                        num, denom = map(float, focal_length_raw.split('/'))
                        metadata['focal_length'] = num / denom if denom != 0 else None
                    else:
                        metadata['focal_length'] = float(focal_length_raw)
                except:
                    pass
            
            if 'EXIF ExposureTime' in exif_tags:
                metadata['exposure_time'] = str(exif_tags['EXIF ExposureTime'])
            
            if 'EXIF FNumber' in exif_tags:
                try:
                    aperture_raw = str(exif_tags['EXIF FNumber'])
                    if '/' in aperture_raw:
                        num, denom = map(float, aperture_raw.split('/'))
                        metadata['aperture'] = num / denom if denom != 0 else None
                    else:
                        metadata['aperture'] = float(aperture_raw)
                except:
                    pass
            
            if 'EXIF ISOSpeedRatings' in exif_tags:
                try:
                    metadata['iso_speed'] = int(str(exif_tags['EXIF ISOSpeedRatings']))
                except:
                    pass
            
            # GPS information
            gps_latitude = _get_gps_coord(exif_tags, 'GPS GPSLatitude', 'GPS GPSLatitudeRef')
            gps_longitude = _get_gps_coord(exif_tags, 'GPS GPSLongitude', 'GPS GPSLongitudeRef')
            
            if gps_latitude is not None:
                metadata['gps_latitude'] = gps_latitude
            
            if gps_longitude is not None:
                metadata['gps_longitude'] = gps_longitude
            
        # Generate a complete metadata JSON
        full_metadata = {**metadata}
        for key, value in metadata.items():
            if isinstance(value, datetime.datetime):
                full_metadata[key] = value.isoformat()
        
        metadata['metadata_json'] = json.dumps(full_metadata)
        
    except Exception as e:
        print(f"Error extracting metadata from {file_path}: {str(e)}")
    
    return metadata

def _get_gps_coord(exif_tags, coord_tag, ref_tag):
    """
    Convert GPS coordinates from EXIF format to decimal degrees
    """
    try:
        if coord_tag in exif_tags and ref_tag in exif_tags:
            coord = exif_tags[coord_tag].values
            ref = str(exif_tags[ref_tag])
            
            # Convert degrees, minutes, seconds to decimal degrees
            degrees = float(coord[0].num) / float(coord[0].den)
            minutes = float(coord[1].num) / float(coord[1].den) / 60.0
            seconds = float(coord[2].num) / float(coord[2].den) / 3600.0
            
            decimal_degrees = degrees + minutes + seconds
            
            # Apply sign based on reference (N/E positive, S/W negative)
            if ref in ['S', 'W']:
                decimal_degrees = -decimal_degrees
            
            return decimal_degrees
    except:
        pass
    
    return None

def format_metadata_for_display(metadata):
    """
    Format metadata for display in the UI
    
    Args:
        metadata (dict): Dictionary containing metadata
        
    Returns:
        str: Formatted metadata string
    """
    formatted = []
    
    # Camera information
    if metadata.get('camera_make') or metadata.get('camera_model'):
        camera = f"{metadata.get('camera_make', '')} {metadata.get('camera_model', '')}"
        formatted.append(f"**Camera:** {camera.strip()}")
    
    # Image dimensions
    if metadata.get('width') and metadata.get('height'):
        formatted.append(f"**Dimensions:** {metadata.get('width')}x{metadata.get('height')} px")
    
    # File information
    if metadata.get('file_size'):
        size_kb = metadata.get('file_size') / 1024
        size_mb = size_kb / 1024
        if size_mb >= 1:
            formatted.append(f"**File Size:** {size_mb:.2f} MB")
        else:
            formatted.append(f"**File Size:** {size_kb:.2f} KB")
    
    if metadata.get('file_type'):
        formatted.append(f"**File Type:** {metadata.get('file_type').upper()}")
    
    # Date information
    if metadata.get('date_taken'):
        if isinstance(metadata.get('date_taken'), str):
            formatted.append(f"**Date Taken:** {metadata.get('date_taken')}")
        else:
            formatted.append(f"**Date Taken:** {metadata.get('date_taken').strftime('%B %d, %Y %H:%M:%S')}")
    
    # Camera settings
    settings = []
    if metadata.get('focal_length') is not None:
        settings.append(f"{metadata.get('focal_length'):.1f}mm")
    
    if metadata.get('aperture') is not None:
        settings.append(f"f/{metadata.get('aperture'):.1f}")
    
    if metadata.get('exposure_time'):
        settings.append(f"{metadata.get('exposure_time')}s")
    
    if metadata.get('iso_speed') is not None:
        settings.append(f"ISO {metadata.get('iso_speed')}")
    
    if settings:
        formatted.append(f"**Camera Settings:** {', '.join(settings)}")
    
    # GPS information
    if metadata.get('gps_latitude') is not None and metadata.get('gps_longitude') is not None:
        formatted.append(f"**GPS Coordinates:** {metadata.get('gps_latitude'):.6f}, {metadata.get('gps_longitude'):.6f}")
    
    return "\n".join(formatted)
