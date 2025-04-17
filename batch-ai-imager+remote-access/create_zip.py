# This script creates a zip file for the project excluding specified directories and files.
import os
import zipfile
import datetime

def create_project_zip():
    # Get current timestamp for unique filename
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    zip_filename = f"ai_image_analyzer_{timestamp}.zip"
    
    # Files and directories to exclude
    exclude = [
        '.git', '__pycache__', '.config', '.upm', 
        '.cache', '.ipynb_checkpoints', '.pytest_cache',
        '.streamlit/secrets.toml', '.env',
        '.replit', 'replit.nix', 'venv',
        'create_zip.py'  # Don't include this script in the zip
    ]
    
    # Also exclude existing zip files
    exclude.extend([f for f in os.listdir() if f.endswith('.zip')])
    
    print(f"Creating zip file: {zip_filename}")
    
    # Create a new zip file
    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Walk through directory and add files
        for root, dirs, files in os.walk('.', topdown=True):
            # Modify dirs in-place to exclude directories
            dirs[:] = [d for d in dirs if d not in exclude and not d.startswith('.')]
            
            for file in files:
                # Check if file should be excluded
                if file in exclude or file.endswith('.zip'):
                    continue
                
                file_path = os.path.join(root, file)
                
                # Add file to zip with relative path
                arcname = file_path[2:] if file_path.startswith('./') else file_path
                print(f"Adding: {arcname}")
                zipf.write(file_path, arcname)
    
    print(f"Zip file created successfully: {zip_filename}")
    return zip_filename

if __name__ == "__main__":
    zip_file = create_project_zip()
    print(f"\nZip file is ready for download: {zip_file}")
