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
from dashboard_page import show_dashboard_page
from onboarding_tour import show_onboarding_tour
from clustering_page import show_clustering_page
from comparison_page import show_comparison_page
from export_utils import export_to_csv, export_to_excel, export_to_pdf_simple, export_to_pdf_detailed

# Set page config
st.set_page_config(
    page_title="AI Image Analyzer",
    page_icon="🔍",
    layout="wide"
)

# Load custom CSS
with open("custom_styles.css") as f:
    st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

# Initialize session state variables if they don't exist
if 'processing' not in st.session_state:
    st.session_state.processing = False
if 'results' not in st.session_state:
    st.session_state.results = None
if 'current_folder' not in st.session_state:
    st.session_state.current_folder = None
if 'selected_image' not in st.session_state:
    st.session_state.selected_image = None
if 'processed_images' not in st.session_state:
    st.session_state.processed_images = {}
if 'current_page' not in st.session_state:
    st.session_state.current_page = "onboarding"  # Start with onboarding tour
if 'tour_step' not in st.session_state:
    st.session_state.tour_step = 1
if 'tour_completed' not in st.session_state:
    st.session_state.tour_completed = False
    
# Check if first launch - show onboarding
first_launch = 'first_launch' not in st.session_state
if first_launch:
    st.session_state.first_launch = False
    st.session_state.current_page = "onboarding"

# Main title
st.markdown('<div class="app-header">', unsafe_allow_html=True)
st.title("AI Image Analyzer")
st.subheader("Process folders of images to identify objects and generate descriptions")
st.markdown('</div>', unsafe_allow_html=True)

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

col1, col2, col3, col4 = st.columns(4)
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
with col4:
    if st.button("Dashboard", use_container_width=True):
        st.session_state.current_page = "dashboard"
        st.rerun()

# Second row for additional features
col1, col2, col3 = st.columns(3)
with col1:
    if st.button("Image Clusters", use_container_width=True):
        st.session_state.current_page = "clusters"
        st.rerun()
with col2:
    if st.button("Compare Images", use_container_width=True):
        st.session_state.current_page = "compare"
        st.rerun()
with col3:
    if st.button("Download Code", use_container_width=True):
        # Redirect to the code download page
        import streamlit as st
        # Change to download_zip.py if it exists, otherwise use the original
        if os.path.exists("download_zip.py"):
            st.switch_page("download_zip.py")
        else:
            st.switch_page("download_code.py")

# Sidebar for folder selection
with st.sidebar:
    st.header("Settings")
    
    # Add a tab selection for different input methods
    input_method = st.radio("Choose Input Method", ["Upload Images", "Select Directory"])
    
    if input_method == "Upload Images":
        # File uploader for direct image uploads
        uploaded_files = st.file_uploader(
            "Upload Images", 
            accept_multiple_files=True,
            type=["jpg", "jpeg", "png", "bmp", "gif", "webp", "heic", "heif"],
            help="Select multiple images to analyze"
        )
        
        if uploaded_files:
            st.info(f"Selected {len(uploaded_files)} images for processing")
            
            # Create a temporary directory to store uploaded files if needed
            if 'upload_dir' not in st.session_state:
                import tempfile
                st.session_state.upload_dir = tempfile.mkdtemp()
                st.session_state.current_folder = st.session_state.upload_dir
            
            # Process button for uploaded files
            if st.button("Process Uploaded Images", use_container_width=True, disabled=st.session_state.processing):
                # Save uploaded files to temp directory
                saved_files = []
                for uploaded_file in uploaded_files:
                    file_path = os.path.join(st.session_state.upload_dir, uploaded_file.name)
                    with open(file_path, "wb") as f:
                        f.write(uploaded_file.getbuffer())
                    saved_files.append(file_path)
                
                if saved_files:
                    st.session_state.processing = True
                    st.session_state.results = None
                    st.session_state.processed_images = {}
                    st.session_state.selected_image = None
                    st.session_state.upload_files = saved_files
                    st.rerun()
                    
    else:  # Select Directory method
        # Option to select parent directory
        st.warning("Note: Directory selection requires permission from your browser and may not work in all environments.")
        parent_dir = st.text_input("Parent Directory Path", 
                                  value=os.path.expanduser("~") if not st.session_state.current_folder else st.session_state.current_folder,
                                  help="Enter the path to the directory containing your image folders")

        if parent_dir and os.path.exists(parent_dir):
            # Get all subdirectories
            subdirs = [d for d in os.listdir(parent_dir) if os.path.isdir(os.path.join(parent_dir, d))]

            if subdirs:
                # Folder selection dropdown
                selected_folder = st.selectbox(
                    "Select Image Folder", 
                    [""] + subdirs,
                    help="Choose a folder to analyze"
                )

                if selected_folder:
                    folder_path = os.path.join(parent_dir, selected_folder)

                    # Count images in the folder
                    image_files = get_all_image_files(folder_path)

                    if image_files:
                        st.info(f"Found {len(image_files)} images in this folder")

                        # Store current folder
                        st.session_state.current_folder = parent_dir

                        # Process button
                        if st.button("Process Folder", use_container_width=True, disabled=st.session_state.processing):
                            st.session_state.processing = True
                            st.session_state.results = None
                            st.session_state.processed_images = {}
                            st.session_state.selected_image = None
                            st.rerun()
                    else:
                        st.warning("No valid images found in this folder. Supported formats: JPG, JPEG, PNG")
            else:
                st.warning("No subdirectories found in the selected path")
        else:
            if parent_dir:
                st.error("Directory not found. Please enter a valid path")

# Add Tour button in sidebar if tour completed
with st.sidebar:
    if st.session_state.tour_completed:
        if st.button("🚀 Restart AI Discovery Tour", use_container_width=True):
            st.session_state.tour_step = 1
            st.session_state.tour_completed = False
            st.session_state.current_page = "onboarding"
            st.rerun()

# Show the appropriate page based on selection
if st.session_state.current_page == "history":
    show_history_page()
elif st.session_state.current_page == "search":
    show_search_page()
elif st.session_state.current_page == "dashboard":
    show_dashboard_page()
elif st.session_state.current_page == "clusters":
    show_clustering_page()
elif st.session_state.current_page == "compare":
    show_comparison_page()
elif st.session_state.current_page == "onboarding":
    show_onboarding_tour()
else:  # Process page (default)
    # Main content area for processing
    if st.session_state.processing and st.session_state.current_folder:
        # Check if we have uploaded files to process
        if 'upload_files' in st.session_state and st.session_state.upload_files:
            image_files = st.session_state.upload_files
            folder_name = "Uploaded_Images"
            full_folder_path = st.session_state.upload_dir
        else:
            # Find folder with images from directory selection
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
            folder_name = selected_folder
            # Get all images in the folder
            image_files = get_all_image_files(full_folder_path)

        # Display processing status
        with st.spinner("Processing images... This may take a while depending on the number of images."):
            # Create progress bar
            progress_bar = st.progress(0)
            status_text = st.empty()

            total_images = len(image_files)

            if total_images > 0:
                results = []

                # Process each image
                # Add folder to database
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
                                confidence=result.get("confidence", 0),
                                metadata=result.get("metadata", {})
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
        # Clean up upload files reference if it exists
        if 'upload_files' in st.session_state:
            del st.session_state.upload_files
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

                # Display the table with HTML
                st.markdown('<div class="card styled-table">', unsafe_allow_html=True) #Added
                st.write(display_df.drop(columns=["file_path"]).to_html(escape=False, index=False), unsafe_allow_html=True)
                st.markdown('</div>', unsafe_allow_html=True) #Added

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

                # Export options
                st.subheader("Export Results")

                col1, col2 = st.columns(2)

                with col1:
                    export_format = st.selectbox("Export Format", ["CSV", "Excel", "PDF (Simple)", "PDF (Detailed)"])

                with col2:
                    if export_format.startswith("PDF"):
                        include_images = st.checkbox("Include Images in PDF", value=True, 
                                                    help="Include image previews in the PDF export (may increase file size)")

                # Add text area for folder description
                folder_name = os.path.basename(os.path.dirname(st.session_state.results.iloc[0]["file_path"]))
                folder_description = st.text_area(
                    "Folder Description (will be included in exports)",
                    value=f"Collection of images from folder '{folder_name}'",
                    height=100,
                    key="process_folder_description"
                )

                if st.button("Export Results"):
                    # Add folder description to the results DataFrame
                    results_df = st.session_state.results.copy()
                    results_df["folder_description"] = folder_description
                    results_df["item_description"] = results_df.apply(
                        lambda row: f"Image analysis of {row['file_name']} from folder {folder_name}", axis=1
                    )

                    if export_format == "CSV":
                        export_filename = export_to_csv(results_df, folder_name)
                        st.success(f"Results exported to {export_filename}")

                    elif export_format == "Excel":
                        export_filename = export_to_excel(results_df, folder_name)
                        st.success(f"Results exported to {export_filename}")

                    elif export_format == "PDF (Simple)":
                        with st.spinner("Generating PDF..."):
                            export_filename = export_to_pdf_simple(results_df, folder_name)
                        st.success(f"Results exported to {export_filename}")

                    elif export_format == "PDF (Detailed)":
                        with st.spinner("Generating detailed PDF report with images..."):
                            include_imgs = include_images if 'include_images' in locals() else True
                            export_filename = export_to_pdf_detailed(results_df, folder_name, include_imgs)
                        st.success(f"Results exported to {export_filename}")

                    # Provide download link
                    with open(export_filename, "rb") as file:
                        btn = st.download_button(
                            label="Download File",
                            data=file,
                            file_name=os.path.basename(export_filename),
                            mime="application/octet-stream"
                        )
            else:
                st.info("No results to display")

        with tab2:
            # Check if an image is selected
            if st.session_state.selected_image:
                selected_path = st.session_state.selected_image
                selected_result = st.session_state.processed_images.get(selected_path, {})

                # Display image details
                # Use flexible columns for better mobile experience
                st.markdown('<div class="image-container">', unsafe_allow_html=True)
                st.image(selected_path, use_column_width=True)
                st.markdown('</div>', unsafe_allow_html=True)

                st.subheader("Analysis Results")
                st.markdown(f"**File:** {os.path.basename(selected_path)}")
                st.markdown(f"**Object Identified:** {selected_result.get('object_name', 'Unknown')}")
                st.markdown(f"**Confidence:** {selected_result.get('confidence', 0):.2f}")
                st.markdown("### Description")
                st.markdown(selected_result.get('description', 'No description available'))

                # Display metadata if available
                if 'metadata' in selected_result:
                    st.markdown("### Image Metadata")
                    from utils import format_metadata_for_display
                    metadata_text = format_metadata_for_display(selected_result.get('metadata', {}))
                    st.markdown(metadata_text)
            else:
                # No image selected
                st.info("Select an image from the Results Table to view details")

# Footer
st.markdown("---")
st.markdown("@copyleft -- don't do stupid shit with my work.")

# Import at the top of the file instead
# from clustering_page import show_clustering_page 
# from comparison_page import show_comparison_page