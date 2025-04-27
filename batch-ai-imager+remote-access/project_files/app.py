import streamlit as st
import os
import pandas as pd
from datetime import datetime
import time
from image_processor import process_image_folder, process_single_image
from utils import get_all_image_files, is_valid_image
import database as db
from history_page import show_history_page
from search_page import show_search_page
import logging

logger = logging.getLogger(__name__)

# Set page config
st.set_page_config(
    page_title="AI Image Analyzer",
    page_icon="",
    layout="wide"
)

# Initialize session state variables if they don't exist
for key, default in {
    'processing': False,
    'results': None,
    'current_folder': None,
    'selected_image': None,
    'processed_images': {},
    'current_page': "process",
    'export_success': None,
    'export_error': None
}.items():
    if key not in st.session_state:
        st.session_state[key] = default

# Main title
st.title("AI Image Analyzer")
st.subheader("Process folders of images to identify objects and generate descriptions")

# Navigation
st.markdown(
    """
    <style>
    div.stButton > button {
        width: 100%;
    }
    </style>
    """,
    unsafe_allow_html=True
)

col1, col2, col3 = st.columns(3)
with col1:
    if st.button("Process Images", use_container_width=True):
        st.session_state.current_page = "process"
        st.rerun()
with col2:
    if st.button("Analysis History", use_container_width=True):
        st.session_state.current_page = "history"
        st.rerun()
with col3:
    if st.button("Search Database", use_container_width=True):
        st.session_state.current_page = "search"
        st.rerun()

try:
    # Add a Reset/Clear All button at the top of the main page
    st.markdown("<div style='text-align:right'>", unsafe_allow_html=True)
    if st.button("Reset All", help="Clear all results and selections. Start over."):
        for key in ['processing', 'results', 'current_folder', 'selected_image', 'processed_images']:
            if key in st.session_state:
                del st.session_state[key]
        st.session_state.current_page = "process"
        st.rerun()
    st.markdown("</div>", unsafe_allow_html=True)

    # Sidebar for folder selection
    with st.sidebar:
        st.header("Settings")
        parent_dir = st.text_input("Parent Directory Path", 
                                  value=os.path.expanduser("~") if not st.session_state.current_folder else st.session_state.current_folder,
                                  help="Enter the path to the directory containing your image folders. Example: /home/user/Pictures")
        
        if parent_dir and os.path.exists(parent_dir):
            # Get all subdirectories
            subdirs = [d for d in os.listdir(parent_dir) if os.path.isdir(os.path.join(parent_dir, d))]
            
            if subdirs:
                # Folder selection dropdown
                selected_folder = st.selectbox(
                    "Select Image Folder", 
                    [""] + subdirs,
                    help="Choose a folder with images to analyze. Supported formats: JPG, JPEG, PNG."
                )
                
                if selected_folder:
                    folder_path = os.path.join(parent_dir, selected_folder)
                    
                    # Count images in the folder
                    image_files = get_all_image_files(folder_path)
                    
                    if image_files:
                        st.info(f"Found {len(image_files)} images in this folder.")
                        
                        # Store current folder
                        st.session_state.current_folder = parent_dir
                        
                        # Process button
                        if st.button("Process Folder", use_container_width=True, disabled=st.session_state.processing, help="Start analyzing all images in the selected folder."):
                            st.session_state.processing = True
                            st.session_state.results = None
                            st.session_state.processed_images = {}
                            st.session_state.selected_image = None
                            st.rerun()
                    else:
                        st.warning("No valid images found in this folder. Supported formats: JPG, JPEG, PNG.")
            else:
                st.warning("No subdirectories found in the selected path.")
        else:
            if parent_dir:
                st.error("Directory not found. Please enter a valid path")

    if st.session_state.current_page == "history":
        show_history_page()
    elif st.session_state.current_page == "search":
        show_search_page()
    else:  # Process page (default)
        # Main content area for processing
        if st.session_state.processing and st.session_state.current_folder:
            # Find folder with images
            selected_folder = ""
            for d in os.listdir(st.session_state.current_folder):
                if os.path.isdir(os.path.join(st.session_state.current_folder, d)):
                    if get_all_image_files(os.path.join(st.session_state.current_folder, d)):
                        selected_folder = d
                        break
            
            if not selected_folder:
                st.error("Could not find a folder with valid images")
                st.session_state.processing = False
                st.rerun()
                
            full_folder_path = os.path.join(st.session_state.current_folder, selected_folder)
            
            # Display processing status
            with st.spinner("Processing images... This may take a while depending on the number of images."):
                # Create progress bar
                progress_bar = st.progress(0)
                status_text = st.empty()
                
                # Get all images in the folder
                image_files = get_all_image_files(full_folder_path)
                total_images = len(image_files)
                
                if total_images > 0:
                    results = []
                    
                    # Process each image
                    # Add folder to database
                    folder_name = os.path.basename(full_folder_path)
                    db_folder = db.add_folder(folder_name, full_folder_path)
                    
                    for i, img_path in enumerate(image_files):
                        try:
                            # Update progress
                            progress = (i + 1) / total_images
                            progress_bar.progress(progress)
                            status_text.text(f"Processing image {i+1} of {total_images}: {os.path.basename(img_path)}")
                            
                            # Check if image already exists in database
                            existing_image = db.get_image_by_path(img_path)
                            if existing_image:
                                # Use existing result
                                result = {
                                    "object_name": existing_image.object_name,
                                    "description": existing_image.description,
                                    "confidence": existing_image.confidence
                                }
                            else:
                                # Process the image
                                result = process_single_image(img_path)
                                
                                # Save to database
                                db.add_image_result(
                                    folder_id=db_folder.id,
                                    file_name=os.path.basename(img_path),
                                    file_path=img_path,
                                    object_name=result.get("object_name", "Unknown"),
                                    description=result.get("description", "No description available"),
                                    confidence=result.get("confidence", 0)
                                )
                            
                            # Store result
                            result_with_path = {
                                "file_path": img_path,
                                "file_name": os.path.basename(img_path),
                                "object_name": result.get("object_name", "Unknown"),
                                "description": result.get("description", "No description available"),
                                "confidence": result.get("confidence", 0)
                            }
                            results.append(result_with_path)
                            
                            # Store in session state
                            st.session_state.processed_images[img_path] = result
                        
                        except Exception as e:
                            st.error(f"Error processing {os.path.basename(img_path)}: {str(e)}")
                            # Add error entry
                            results.append({
                                "file_path": img_path,
                                "file_name": os.path.basename(img_path),
                                "object_name": "Error",
                                "description": f"Failed to process: {str(e)}",
                                "confidence": 0
                            })
                    
                    # Convert results to DataFrame
                    df = pd.DataFrame(results)
                    
                    # Store results in session state
                    st.session_state.results = df
                else:
                    st.warning("No valid images found in the selected folder")
            
            # Reset processing flag
            st.session_state.processing = False
            st.rerun()

        # Display results
        if st.session_state.results is not None:
            # Create tabs for different views
            tab1, tab2 = st.tabs(["Results Table", "Detailed View"])
            
            with tab1:
                # Display summary table
                st.subheader("Analysis Results")
                
                # Convert DataFrame for display (hide file_path column)
                display_df = st.session_state.results.copy()
                
                if not display_df.empty:
                    # Add clickable links in the table
                    display_df["View Details"] = display_df.apply(
                        lambda row: f'<a href="#" id="{row["file_path"]}">View</a>', 
                        axis=1
                    )
                    
                    # Add image thumbnails to the results table
                    display_df["Thumbnail"] = display_df["file_path"].apply(lambda p: f'<img src="file://{p}" width="80">' if os.path.exists(p) else "")
                    display_df = display_df[["Thumbnail", "file_name", "object_name", "confidence", "View Details"]]
                    
                    # Display the table with HTML
                    st.write(display_df.to_html(escape=False, index=False), unsafe_allow_html=True)
                    
                    # JavaScript to handle clicks
                    st.markdown("""
                    <script>
                    document.addEventListener('DOMContentLoaded', function() {
                        const links = document.querySelectorAll('a[id]');
                        links.forEach(link => {
                            link.addEventListener('click', function(e) {
                                e.preventDefault();
                                const filePath = this.id;
                                window.parent.postMessage({
                                    type: 'streamlit:setComponentValue',
                                    value: filePath
                                }, '*');
                            });
                        });
                    });
                    </script>
                    """, unsafe_allow_html=True)
                    
                    # Use st.text_input as a hack to receive the clicked value
                    clicked_path = st.text_input("", key="clicked_path", label_visibility="collapsed")
                    if clicked_path and clicked_path in st.session_state.processed_images:
                        st.session_state.selected_image = clicked_path
                        st.rerun()
                    
                    # Add CSV/Excel download buttons
                    csv = display_df.to_csv(index=False).encode('utf-8')
                    st.download_button("Download CSV", csv, "results.csv", "text/csv", help="Download results as a CSV file.")
                    try:
                        import io
                        import openpyxl
                        output = io.BytesIO()
                        display_df.to_excel(output, index=False, engine='openpyxl')
                        st.download_button("Download Excel", output.getvalue(), "results.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", help="Download results as an Excel file.")
                    except Exception as e:
                        st.warning("Excel export unavailable: openpyxl not installed.")
                else:
                    st.info("No results to display")
            
            with tab2:
                # Check if an image is selected
                if st.session_state.selected_image:
                    selected_path = st.session_state.selected_image
                    selected_result = st.session_state.processed_images.get(selected_path, {})
                    
                    # Display image details
                    col1, col2 = st.columns([1, 2])
                    
                    with col1:
                        st.subheader("Image")
                        st.image(selected_path, use_column_width=True)
                    
                    with col2:
                        st.subheader("Analysis Results")
                        st.markdown(f"**File:** {os.path.basename(selected_path)}")
                        st.markdown(f"**Object Identified:** {selected_result.get('object_name', 'Unknown')}")
                        st.markdown(f"**Confidence:** {selected_result.get('confidence', 0):.2f}")
                        st.markdown("### Description")
                        st.markdown(selected_result.get('description', 'No description available'))
                else:
                    # No image selected
                    st.info("Select an image from the Results Table to view details")

    # Use st.success and st.error for major actions
    if st.session_state.get('export_success'):
        st.success(st.session_state.export_success)
        st.session_state.export_success = None
    if st.session_state.get('export_error'):
        st.error(st.session_state.export_error)
        st.session_state.export_error = None

except Exception as e:
    logger.error(f"Unhandled error in main app: {e}")
    st.error("An unexpected error occurred. Please check logs for details.")

# Footer
st.markdown("---")
st.markdown("AI Image Analyzer - Powered by OpenAI")