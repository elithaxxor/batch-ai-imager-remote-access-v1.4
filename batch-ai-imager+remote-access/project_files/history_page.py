import streamlit as st
import os
import pandas as pd
from database import get_all_folders, get_images_by_folder_id
import logging

logger = logging.getLogger(__name__)

def show_history_page():
    """
    Display the history of processed folders and allow browsing previous analysis results
    """
    st.header("Analysis History")
    st.write("Browse previously analyzed image folders")
    try:
        with st.spinner("Loading folders from database..."):
            folders = get_all_folders()
    except Exception as e:
        logger.error(f"Error loading folders: {e}")
        st.error("Failed to load folders from the database.")
        return
    if not folders:
        st.info("No analyzed folders found in the database. Process some images first.")
        return
    # Convert to DataFrame for better display
    folder_data = [{
        "id": folder.id,
        "name": folder.name,
        "path": folder.path,
        "processed_at": folder.processed_at,
        "image_count": len(folder.images) if hasattr(folder, 'images') else 0
    } for folder in folders]
    folder_df = pd.DataFrame(folder_data)
    # Sort by most recent first
    folder_df = folder_df.sort_values(by="processed_at", ascending=False)
    # Display as a table, with pagination warning if large
    if len(folder_df) > 100:
        st.warning("More than 100 folders found. Consider adding pagination for better performance.")
    st.dataframe(
        folder_df[["name", "processed_at", "image_count"]],
        column_config={
            "name": "Folder Name",
            "processed_at": st.column_config.DatetimeColumn("Processed Date", format="MMM DD, YYYY, hh:mm A"),
            "image_count": st.column_config.NumberColumn("Images")
        },
        hide_index=True
    )
    # Let user select a folder to view details
    try:
        selected_folder_id = st.selectbox(
            "Select a folder to view images",
            options=folder_df["id"].tolist(),
            format_func=lambda x: folder_df.loc[folder_df["id"] == x, "name"].iloc[0] if x in folder_df["id"].values else str(x)
        )
    except Exception as e:
        logger.error(f"Error in folder selectbox: {e}")
        st.error("Failed to display folder selection.")
        return
    # Show images for the selected folder
    try:
        show_folder_images(selected_folder_id)
    except Exception as e:
        logger.error(f"Error displaying folder images: {e}")
        st.error("Failed to display images for the selected folder.")

def show_folder_images(folder_id):
    """
    Display all images from a specific folder
    """
    try:
        with st.spinner("Loading images from database..."):
            images = get_images_by_folder_id(folder_id)
    except Exception as e:
        logger.error(f"Error loading images: {e}")
        st.error("Failed to load images from the database.")
        return
    if not images:
        st.info("No images found in this folder.")
        return
    image_data = [{
        "id": img.id,
        "file_name": img.file_name,
        "object_name": img.object_name,
        "confidence": img.confidence,
        "description": img.description[:100] + "..." if img.description and len(img.description) > 100 else (img.description or "")
    } for img in images]
    image_df = pd.DataFrame(image_data)
    st.dataframe(
        image_df[["file_name", "object_name", "confidence", "description"]],
        column_config={
            "file_name": "Image Name",
            "object_name": "Object Identified",
            "confidence": st.column_config.NumberColumn("Confidence", format="%.2f"),
            "description": "Description Preview"
        },
        hide_index=True
    )
    # Optionally: Add selectbox for image details, pagination, etc.
    try:
        selected_image_id = st.selectbox(
            "Select an image to view details",
            options=image_df["id"].tolist(),
            format_func=lambda x: image_df.loc[image_df["id"] == x, "file_name"].iloc[0] if x in image_df["id"].values else str(x)
        )
    except Exception as e:
        logger.error(f"Error in image selectbox: {e}")
        st.error("Failed to display image selection.")
        return
    # Show details for the selected image
    try:
        show_image_details(selected_image_id)
    except Exception as e:
        logger.error(f"Error displaying image details: {e}")
        st.error("Failed to display details for the selected image.")

def show_image_details(image_id):
    """
    Display details for a specific image
    """
    try:
        from database import get_db, Image
        db = next(get_db())
        image = db.query(Image).filter(Image.id == image_id).first()
    except Exception as e:
        logger.error(f"Error loading image: {e}")
        st.error("Failed to load image from the database.")
        return
    if not image:
        st.error("Image not found")
        return
    # Display image details
    col1, col2 = st.columns([1, 2])
    # Check if file exists first
    if os.path.exists(image.file_path):
        with col1:
            st.subheader("Image")
            st.image(image.file_path, use_column_width=True)
    else:
        with col1:
            st.subheader("Image")
            st.warning("Image file not found at path: " + image.file_path)
    with col2:
        st.subheader("Analysis Results")
        st.markdown(f"**File:** {image.file_name}")
        st.markdown(f"**Object Identified:** {image.object_name}")
        st.markdown(f"**Confidence:** {image.confidence:.2f}")
        st.markdown("### Description")
        st.markdown(image.description)
        # Additional metadata
        st.markdown("### Metadata")
        st.markdown(f"**Processed Date:** {image.processed_at.strftime('%Y-%m-%d %H:%M:%S')}")
        st.markdown(f"**Full Path:** {image.file_path}")