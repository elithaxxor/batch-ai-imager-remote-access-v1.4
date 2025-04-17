import os
import base64
import json
from PIL import Image
import io
from openai import OpenAI
from utils import is_valid_image, extract_image_metadata

# Initialize OpenAI client
# The newest OpenAI model is "gpt-4o" which was released May 13, 2024.
# Do not change this unless explicitly requested by the user
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
openai_client = OpenAI(api_key=OPENAI_API_KEY)

def encode_image_to_base64(image_path):
    """
    Encode an image file to base64 string
    """
    try:
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    except Exception as e:
        raise Exception(f"Failed to encode image: {str(e)}")

def analyze_image_with_openai(base64_image):
    """
    Use OpenAI's vision capabilities to analyze an image
    """
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
                            "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                        }
                    ]
                }
            ],
            response_format={"type": "json_object"},
            max_tokens=1000
        )
        
        # Parse the response
        content = response.choices[0].message.content
        result = json.loads(content)
        
        # Ensure all required fields are present
        if 'object_name' not in result:
            result['object_name'] = "Unknown object"
        if 'description' not in result:
            result['description'] = "No description available"
        if 'confidence' not in result:
            result['confidence'] = 0.5
            
        return result
    
    except Exception as e:
        raise Exception(f"OpenAI API error: {str(e)}")

def process_single_image(image_path):
    """
    Process a single image and return analysis results
    """
    if not is_valid_image(image_path):
        raise ValueError(f"Invalid or unsupported image file: {image_path}")
    
    try:
        # Encode image to base64
        base64_image = encode_image_to_base64(image_path)
        
        # Analyze the image
        result = analyze_image_with_openai(base64_image)
        
        # Extract metadata
        metadata = extract_image_metadata(image_path)
        
        # Add metadata to the result
        result['metadata'] = metadata
        
        return result
    
    except Exception as e:
        raise Exception(f"Error processing image {os.path.basename(image_path)}: {str(e)}")

def process_image_folder(folder_path):
    """
    Process all images in a folder and return analysis results
    """
    if not os.path.exists(folder_path) or not os.path.isdir(folder_path):
        raise ValueError(f"Invalid folder path: {folder_path}")
    
    results = []
    
    # Get all image files in the folder
    image_files = [os.path.join(folder_path, f) for f in os.listdir(folder_path) 
                  if os.path.isfile(os.path.join(folder_path, f)) and is_valid_image(os.path.join(folder_path, f))]
    
    if not image_files:
        return results
    
    # Process each image
    for img_path in image_files:
        try:
            result = process_single_image(img_path)
            
            # Add file path to result
            result_with_path = {
                "file_path": img_path,
                "file_name": os.path.basename(img_path),
                "object_name": result.get("object_name", "Unknown"),
                "description": result.get("description", "No description available"),
                "confidence": result.get("confidence", 0),
                "metadata": result.get("metadata", {})
            }
            
            results.append(result_with_path)
            
        except Exception as e:
            # Log error and continue with next image
            print(f"Error processing {img_path}: {str(e)}")
            results.append({
                "file_path": img_path,
                "file_name": os.path.basename(img_path),
                "object_name": "Error",
                "description": f"Failed to process: {str(e)}",
                "confidence": 0,
                "metadata": {}
            })
    
    return results
