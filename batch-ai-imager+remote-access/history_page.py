
import streamlit as st
import os
import pandas as pd
from database import get_all_folders, get_images_by_folder_id, FavoriteImage
import database as db
from export_utils import export_to_csv, export_to_excel, export_to_pdf_simple, export_to_pdf_detailed

def show_history_page():
    """
    Display the history of processed folders and allow browsing previous analysis results
    """
    st.markdown("""
    <div class="card">
        <div class="card-header">
            <h2>Analysis History</h2>
            <p>Browse previously analyzed image folders</p>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Get all folders from the database
    folders = get_all_folders()
    
    if not folders:
        st.info("No analyzed folders found in the database. Process some images first.")
        return
    
    # Convert to DataFrame for better display
    folder_data = [{
        "id": folder.id,
        "name": folder.name, 
        "path": folder.path, 
        "processed_at": folder.processed_at,
        "image_count": len(folder.images)
    } for folder in folders]
    
    folder_df = pd.DataFrame(folder_data)
    
    # Sort by most recent first
    folder_df = folder_df.sort_values(by="processed_at", ascending=False)
    
    # Display as a table
    st.markdown('<div class="card styled-table">', unsafe_allow_html=True)
    st.dataframe(
        folder_df[["name", "processed_at", "image_count"]],
        use_container_width=True,
        column_config={
            "name": "Folder Name",
            "processed_at": st.column_config.DatetimeColumn("Processed Date", format="MMM DD, YYYY, hh:mm A"),
            "image_count": st.column_config.NumberColumn("Images")
        },
        hide_index=True
    )
    st.markdown('</div>', unsafe_allow_html=True)
    
    # Let user select a folder to view details
    selected_folder_id = st.selectbox(
        "Select a folder to view images",
        options=folder_df["id"].tolist(),
        format_func=lambda x: folder_df[folder_df["id"] == x]["name"].iloc[0]
    )
    
    if selected_folder_id:
        show_folder_images(selected_folder_id)
    
def show_folder_images(folder_id):
    """
    Display all images from a specific folder
    """
    # Get all images for the folder
    images = get_images_by_folder_id(folder_id)
    
    if not images:
        st.warning("No images found for this folder")
        return
    
    # Convert to DataFrame for better display
    image_data = [{
        "id": img.id,
        "file_name": img.file_name, 
        "object_name": img.object_name, 
        "confidence": img.confidence,
        "processed_at": img.processed_at
    } for img in images]
    
    image_df = pd.DataFrame(image_data)
    
    # Sort alphabetically by filename
    image_df = image_df.sort_values(by="file_name")
    
    # Display as a table
    st.markdown('<div class="card styled-table">', unsafe_allow_html=True)
    st.dataframe(
        image_df[["file_name", "object_name", "confidence", "processed_at"]],
        use_container_width=True,
        column_config={
            "file_name": "Image Name",
            "object_name": "Object Identified",
            "confidence": st.column_config.NumberColumn("Confidence", format="%.2f"),
            "processed_at": st.column_config.DatetimeColumn("Processed Date", format="MMM DD, YYYY, hh:mm A")
        },
        hide_index=True
    )
    st.markdown('</div>', unsafe_allow_html=True)
    
    # Export options for selected folder
    st.subheader("Export Folder Results")
    col1, col2 = st.columns(2)
    
    with col1:
        export_format = st.selectbox(
            "Export Format", 
            ["CSV", "Excel", "PDF (Simple)", "PDF (Detailed)"],
            key="history_export_format"
        )
    
    with col2:
        if export_format.startswith("PDF"):
            include_images = st.checkbox(
                "Include Images in PDF", 
                value=True, 
                help="Include image previews in the PDF export (may increase file size)",
                key="history_include_images"
            )
    
    # Add text area for folder description
    folder_name = image_df["file_name"].iloc[0] if not image_df.empty else "Unknown folder"
    folder_description = st.text_area(
        "Folder Description (will be included in exports)",
        value=f"Analysis results from folder '{folder_name}'",
        height=100,
        key="history_folder_description"
    )
    
    if st.button("Export Results", key="history_export_button"):
        # Create export DataFrame
        export_data = []
        for img in images:
            export_data.append({
                "file_name": img.file_name,
                "file_path": img.file_path,
                "object_name": img.object_name,
                "description": img.description,
                "confidence": img.confidence,
                "processed_at": img.processed_at.strftime("%Y-%m-%d %H:%M:%S"),
                "folder_description": folder_description
            })
        
        export_df = pd.DataFrame(export_data)
        
        if export_format == "CSV":
            export_filename = export_to_csv(export_df, f"folder_history_{folder_name}")
            st.success(f"Results exported to {export_filename}")
        
        elif export_format == "Excel":
            export_filename = export_to_excel(export_df, f"folder_history_{folder_name}")
            st.success(f"Results exported to {export_filename}")
        
        elif export_format == "PDF (Simple)":
            with st.spinner("Generating PDF..."):
                export_filename = export_to_pdf_simple(export_df, f"folder_history_{folder_name}")
            st.success(f"Results exported to {export_filename}")
        
        elif export_format == "PDF (Detailed)":
            with st.spinner("Generating detailed PDF report with images..."):
                include_imgs = include_images if 'include_images' in locals() else True
                export_filename = export_to_pdf_detailed(export_df, f"folder_history_{folder_name}", include_imgs)
            st.success(f"Results exported to {export_filename}")
        
        # Provide download link
        with open(export_filename, "rb") as file:
            btn = st.download_button(
                label="Download File",
                data=file,
                file_name=os.path.basename(export_filename),
                mime="application/octet-stream",
                key="history_download_button"
            )
    
    # Let user select an image to view details
    selected_image_id = st.selectbox(
        "Select an image to view details",
        options=image_df["id"].tolist(),
        format_func=lambda x: image_df[image_df["id"] == x]["file_name"].iloc[0]
    )
    
    if selected_image_id:
        show_image_details(selected_image_id)

def show_image_details(image_id):
    """
    Display details for a specific image
    """
    # Find the image in the database
    from database import get_db, Image
    
    db = next(get_db())
    image = db.query(Image).filter(Image.id == image_id).first()
    
    if not image:
        st.error("Image not found")
        return
    
    # Display image details in a card
    st.markdown('<div class="card">', unsafe_allow_html=True)
    
    # Check if file exists first
    if os.path.exists(image.file_path):
        st.markdown('<div class="image-container">', unsafe_allow_html=True)
        st.image(image.file_path, use_column_width=True)
        st.markdown('</div>', unsafe_allow_html=True)
    else:
        st.warning("Image file not found at path: " + image.file_path)
    
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
    
    # Add to dashboard button and related functionality
    col1, col2 = st.columns(2)
    
    with col1:
        # Check if image is already in favorites
        existing_favorite = None
        try:
            db_session = db.get_db()
            existing_favorite = db_session.query(db.FavoriteImage).filter(
                db.FavoriteImage.image_id == image.id
            ).first()
        except:
            pass
    
        if existing_favorite:
            st.success("This image is in your dashboard")
            if st.button("Remove from Dashboard"):
                db.remove_from_favorites(existing_favorite.id)
                st.success("Removed from dashboard")
                st.rerun()
        else:
            if st.button("Add to Dashboard"):
                st.session_state.add_to_dashboard_image_id = image.id
                st.rerun()
                
    with col2:
        if st.button("Export Details"):
            # Create a DataFrame with this image for export
            image_data = [{
                "Object": image.object_name,
                "Description": image.description,
                "Confidence": image.confidence,
                "File Name": image.file_name,
                "File Path": image.file_path,
                "Folder": image.folder.name,
            }]
            df = pd.DataFrame(image_data)
            
            # Show export options
            st.session_state.export_single_image_data = df
            st.session_state.export_single_image_id = image.id
            st.rerun()
    
    # Check if we need to show add to dashboard form
    if 'add_to_dashboard_image_id' in st.session_state and st.session_state.add_to_dashboard_image_id == image.id:
        st.subheader("Add to Dashboard")
        
        with st.form("add_to_dashboard_form"):
            custom_label = st.text_input("Custom Label", value=image.object_name)
            note = st.text_area("Note", placeholder="Add notes about why this image is important")
            display_order = st.number_input("Display Order", value=0, min_value=0, 
                help="Lower numbers appear first in the dashboard")
            
            submitted = st.form_submit_button("Add to Dashboard")
            
            if submitted:
                try:
                    db.add_to_favorites(
                        image_id=image.id,
                        custom_label=custom_label,
                        note=note,
                        display_order=display_order
                    )
                    st.success("Added to dashboard successfully!")
                    del st.session_state.add_to_dashboard_image_id
                    st.rerun()
                except Exception as e:
                    st.error(f"Error adding to dashboard: {e}")
    
    # Check if we need to show export options
    if 'export_single_image_data' in st.session_state and 'export_single_image_id' in st.session_state and st.session_state.export_single_image_id == image.id:
        st.subheader("Export Options")
        
        export_format = st.selectbox("Export Format", ["CSV", "Excel", "PDF (Simple)", "PDF (Detailed)"])
        
        # Include images option for detailed PDF
        include_images = False
        if export_format == "PDF (Detailed)":
            include_images = st.checkbox("Include Image", value=True)
        
        if st.button("Generate Export"):
            df = st.session_state.export_single_image_data
            
            if export_format == "CSV":
                export_filename = export_to_csv(df, f"image_{image.id}")
                st.success(f"Exported to CSV: {export_filename}")
            
            elif export_format == "Excel":
                export_filename = export_to_excel(df, f"image_{image.id}")
                st.success(f"Exported to Excel: {export_filename}")
            
            elif export_format == "PDF (Simple)":
                export_filename = export_to_pdf_simple(df, f"image_{image.id}")
                st.success(f"Exported to PDF: {export_filename}")
            
            elif export_format == "PDF (Detailed)":
                export_filename = export_to_pdf_detailed(df, f"image_{image.id}", include_images)
                st.success(f"Exported to detailed PDF: {export_filename}")
            
            # Download link
            with open(export_filename, "rb") as file:
                st.download_button(
                    label="Download Export",
                    data=file,
                    file_name=os.path.basename(export_filename),
                    mime="application/octet-stream"
                )
                
            # Clear export state
            del st.session_state.export_single_image_data
            del st.session_state.export_single_image_id
            st.rerun()
    
    # Display image metadata if available
    if hasattr(image, 'metadata_json') and image.metadata_json:
        st.markdown("### Image Metadata")
        try:
            from utils import format_metadata_for_display
            import json
            
            # Create metadata dictionary from database fields
            metadata = {}
            for field in ['width', 'height', 'camera_make', 'camera_model', 
                        'focal_length', 'aperture', 'exposure_time', 'iso_speed',
                        'date_taken', 'gps_latitude', 'gps_longitude',
                        'file_size', 'file_type']:
                if hasattr(image, field):
                    metadata[field] = getattr(image, field)
            
            metadata_text = format_metadata_for_display(metadata)
            st.markdown(metadata_text)
        except Exception as e:
            st.error(f"Error displaying metadata: {str(e)}")
    
    st.markdown('</div>', unsafe_allow_html=True)
