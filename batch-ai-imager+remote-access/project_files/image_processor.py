import os
import base64
import json
from PIL import Image
import io
from openai import OpenAI
from utils import is_valid_image
import logging
import time

logger = logging.getLogger(__name__)

# Initialize OpenAI client
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
if not OPENAI_API_KEY:
    logger.error("OPENAI_API_KEY environment variable not set. Please set it before running the application.")
    raise RuntimeError("OPENAI_API_KEY environment variable not set. Please set it before running the application.")
openai_client = OpenAI(api_key=OPENAI_API_KEY)

def encode_image_to_base64(image_path):
    """
    Encode an image file to base64 string
    """
    try:
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    except Exception as e:
        logger.error(f"Failed to encode image: {e}")
        raise Exception(f"Failed to encode image: {str(e)}")

def analyze_image_with_openai(base64_image, mime_type="image/jpeg", retries=3):
    """
    Use OpenAI's vision capabilities to analyze an image
    """
    for attempt in range(retries):
        try:
            response = openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert object identifier and historian. First identify the main object in the image, then provide its name and a detailed description including historical context if relevant. Return your response as JSON with 'object_name', 'description', and 'confidence' fields."
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Identify the main object in this image. Provide the object name and a detailed description that includes historical or contextual information if relevant. Format your response as JSON."
                            },
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:{mime_type};base64,{base64_image}"}
                            }
                        ]
                    }
                ],
                max_tokens=512,
                temperature=0.2
            )
            # Parse the response
            content = response.choices[0].message.content
            result = json.loads(content)
            return result
        except Exception as e:
            logger.error(f"OpenAI API error (attempt {attempt+1}): {e}")
            if attempt < retries - 1:
                time.sleep(2 ** attempt)  # Exponential backoff
            else:
                raise Exception(f"Failed to analyze image with OpenAI after {retries} attempts: {str(e)}")

def process_single_image(image_path):
    """
    Process a single image and return analysis results
    """
    if not is_valid_image(image_path):
        logger.warning(f"Invalid image file: {image_path}")
        return None
    # Detect mime type
    ext = os.path.splitext(image_path)[1].lower()
    mime_type = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".bmp": "image/bmp",
        ".gif": "image/gif",
        ".webp": "image/webp"
    }.get(ext, "image/jpeg")
    try:
        base64_image = encode_image_to_base64(image_path)
        result = analyze_image_with_openai(base64_image, mime_type=mime_type)
        return {
            "file_name": os.path.basename(image_path),
            "file_path": image_path,
            "object_name": result.get("object_name"),
            "description": result.get("description"),
            "confidence": result.get("confidence")
        }
    except Exception as e:
        logger.error(f"Failed to process image {image_path}: {e}")
        return None

def process_image_folder(folder_path):
    """
    Process all images in a folder and return analysis results
    """
    from utils import get_all_image_files
    image_files = get_all_image_files(folder_path)
    results = []
    for image_path in image_files:
        result = process_single_image(image_path)
        if result:
            results.append(result)
    return results
 