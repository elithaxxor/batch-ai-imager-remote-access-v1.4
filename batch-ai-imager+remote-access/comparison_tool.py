
import streamlit as st
import os
import pandas as pd
from database import get_db, Image, Folder
import difflib

def show_comparison_page():
    """
    Display a comparison interface for multiple images
    """
    st.markdown("""
    <div class="card">
        <div class="card-header">
            <h2>Image Comparison Tool</h2>
            <p>Compare analysis results of multiple images side by side</p>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Get all images from database
    db_session = next(get_db())
    all_images = db_session.query(Image).all()
    
    if not all_images:
        st.info("No images available for comparison. Process some images first.")
        return
    
    # Get images by folders for better organization
    folders = db_session.query(Folder).all()
    
    # Image selection
    st.subheader("Select Images to Compare")
    
    # Option to select by folder first
    use_folder_filter = st.checkbox("Filter by folder", value=True)
    
    if use_folder_filter and folders:
        # Create folder selection
        folder_options = [(f.id, f.name) for f in folders]
        selected_folder_id = st.selectbox(
            "Select Folder",
            options=[f[0] for f in folder_options],
            format_func=lambda x: next((f[1] for f in folder_options if f[0] == x), "")
        )
        
        # Filter images by folder
        available_images = db_session.query(Image).filter(Image.folder_id == selected_folder_id).all()
    else:
        available_images = all_images
    
    # Convert to dataframe for selection
    image_data = [{
        "id": img.id,
        "file_name": img.file_name,
        "object_name": img.object_name,
        "confidence": img.confidence
    } for img in available_images]
    
    image_df = pd.DataFrame(image_data)
    
    if image_df.empty:
        st.warning("No images found with the current filter.")
        return
    
    # Display as a table for selection
    st.dataframe(
        image_df[["file_name", "object_name", "confidence"]],
        use_container_width=True,
        column_config={
            "file_name": "Image Name",
            "object_name": "Object Identified",
            "confidence": st.column_config.NumberColumn("Confidence", format="%.2f")
        },
        hide_index=True
    )
    
    # Multi-select images
    selected_image_ids = st.multiselect(
        "Select 2-4 images to compare",
        options=image_df["id"].tolist(),
        format_func=lambda x: f"{image_df[image_df['id'] == x]['file_name'].iloc[0]} ({image_df[image_df['id'] == x]['object_name'].iloc[0]})",
        max_selections=4
    )
    
    # Proceed with comparison
    if len(selected_image_ids) >= 2:
        # Get selected images
        selected_images = [
            db_session.query(Image).filter(Image.id == img_id).first()
            for img_id in selected_image_ids
        ]
        
        show_image_comparison(selected_images)
    elif selected_image_ids:
        st.warning("Please select at least 2 images to compare.")

def find_differences(text1, text2):
    """
    Find and highlight differences between two text strings
    """
    d = difflib.Differ()
    diff = list(d.compare(text1.split(), text2.split()))
    
    added = [word[2:] for word in diff if word.startswith('+ ')]
    removed = [word[2:] for word in diff if word.startswith('- ')]
    
    return added, removed

def highlight_differences(text1, text2):
    """
    Return text1 with differences highlighted
    """
    added, removed = find_differences(text1, text2)
    
    highlighted_text = text1
    for word in removed:
        if len(word) > 3:  # Avoid highlighting short words
            highlighted_text = highlighted_text.replace(f" {word} ", f" <span style='background-color: #FFCCCB'>{word}</span> ")
    
    return highlighted_text

def show_image_comparison(images):
    """
    Display the comparison between selected images
    """
    st.subheader("Image Comparison")
    
    # Create columns for each image
    cols = st.columns(len(images))
    
    # Display images
    for i, (img, col) in enumerate(zip(images, cols)):
        with col:
            st.markdown(f"**Image {i+1}**")
            
            if os.path.exists(img.file_path):
                st.image(img.file_path, use_column_width=True)
            else:
                st.warning("Image not found")
            
            st.markdown(f"**File:** {img.file_name}")
    
    # Comparison tabs
    tab1, tab2, tab3 = st.tabs(["Basic Information", "Descriptions", "Metadata"])
    
    with tab1:
        # Create a comparison table of basic information
        comparison_data = []
        for img in images:
            comparison_data.append({
                "Name": img.file_name,
                "Object": img.object_name,
                "Confidence": f"{img.confidence:.2f}",
                "Folder": img.folder.name if img.folder else "Unknown",
                "Processed": img.processed_at.strftime("%Y-%m-%d")
            })
        
        comparison_df = pd.DataFrame(comparison_data)
        st.dataframe(comparison_df)
        
        # Check for same object types
        if len(set([img.object_name for img in images])) == 1:
            st.success(f"All selected images contain the same object type: {images[0].object_name}")
        else:
            st.info("The selected images contain different object types")
    
    with tab2:
        # Display descriptions with differences highlighted
        st.subheader("Descriptions Comparison")
        
        # Toggle for highlighting differences
        highlight_diffs = st.checkbox("Highlight differences", value=True)
        
        for i, img in enumerate(images):
            st.markdown(f"**Image {i+1} ({img.file_name}):**")
            
            if highlight_diffs and i > 0:
                # Highlight differences compared to previous description
                highlighted_desc = highlight_differences(img.description, images[i-1].description)
                st.markdown(highlighted_desc, unsafe_allow_html=True)
            else:
                st.markdown(img.description)
            
            st.markdown("---")
        
        # Show similarity score
        if len(images) == 2:
            from difflib import SequenceMatcher
            similarity = SequenceMatcher(None, images[0].description, images[1].description).ratio()
            st.metric("Description Similarity", f"{similarity:.2%}")
    
    with tab3:
        # Compare metadata if available
        st.subheader("Metadata Comparison")
        
        metadata_rows = []
        for img in images:
            metadata = {}
            
            # Try to get metadata from DB
            for field in ['width', 'height', 'camera_make', 'camera_model', 
                         'focal_length', 'aperture', 'exposure_time', 'iso_speed',
                         'date_taken', 'file_size', 'file_type']:
                if hasattr(img, field):
                    metadata[field] = getattr(img, field)
            
            if metadata:
                metadata_rows.append({
                    "Image": img.file_name,
                    "Dimensions": f"{metadata.get('width', 0)}×{metadata.get('height', 0)}",
                    "Camera": f"{metadata.get('camera_make', '')} {metadata.get('camera_model', '')}".strip(),
                    "Settings": f"f/{metadata.get('aperture', '-')}, {metadata.get('exposure_time', '-')}s, ISO {metadata.get('iso_speed', '-')}",
                    "File Size": f"{metadata.get('file_size', 0) / 1024 / 1024:.1f} MB" if metadata.get('file_size') else "-",
                    "File Type": metadata.get('file_type', '-').upper()
                })
        
        if metadata_rows:
            st.dataframe(pd.DataFrame(metadata_rows))
        else:
            st.info("No metadata available for comparison")
