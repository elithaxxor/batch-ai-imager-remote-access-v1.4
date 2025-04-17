import streamlit as st
import os
import pandas as pd
from database import search_images, get_db, Image, FavoriteImage
import database as db
from export_utils import export_to_csv, export_to_excel, export_to_pdf_simple, export_to_pdf_detailed

def show_search_page():
    """
    Display a search interface for finding images by object name, description, or metadata
    """
    st.markdown("""
    <div class="card">
        <div class="card-header">
            <h2>Search Images</h2>
            <p>Find specific objects, descriptions, or metadata in your analyzed images</p>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # Search input
    search_query = st.text_input("Search for objects, descriptions, or metadata", 
                                help="Enter keywords to search. Examples: 'cat', 'mountain', 'sunset', 'iPhone', 'Canon', 'JPEG', etc.")

    # Execute search when a query is entered
    if search_query:
        results = search_images(search_query)

        if not results:
            st.info(f"No results found for '{search_query}'")
            return

        # Convert to DataFrame for better display
        result_data = [{
            "id": img.id,
            "file_name": img.file_name, 
            "folder_name": img.folder.name if img.folder else "Unknown",
            "object_name": img.object_name, 
            "confidence": img.confidence,
            "camera_info": f"{img.camera_make} {img.camera_model}".strip() if hasattr(img, 'camera_make') and img.camera_make else "",
            "file_type": img.file_type.upper() if hasattr(img, 'file_type') and img.file_type else "",
            "description_snippet": img.description[:100] + "..." if len(img.description) > 100 else img.description
        } for img in results]

        result_df = pd.DataFrame(result_data)

        # Display results count
        st.subheader(f"Found {len(results)} results")

        # Display as a table
        st.dataframe(
            result_df[["file_name", "folder_name", "object_name", "confidence", "camera_info", "file_type", "description_snippet"]],
            use_container_width=True, #Added for mobile optimization
            column_config={
                "file_name": "Image Name",
                "folder_name": "Folder",
                "object_name": "Object Identified",
                "confidence": st.column_config.NumberColumn("Confidence", format="%.2f"),
                "camera_info": "Camera",
                "file_type": "Format",
                "description_snippet": "Description Preview"
            },
            hide_index=True
        )

        # Add export options
        st.subheader("Export Search Results")

        st.markdown('<div class="export-options">', unsafe_allow_html=True)
        export_format = st.selectbox("Export Format", 
                                    ["CSV", "Excel", "PDF (Simple)", "PDF (Detailed)"],
                                    key="search_export_format")

        if export_format.startswith("PDF"):
            include_images = st.checkbox("Include Images in PDF", value=True, 
                                        help="Include image previews in the PDF export (may increase file size)",
                                        key="search_include_images")
        st.markdown('</div>', unsafe_allow_html=True)

        # Add text area for folder description
        folder_description = st.text_area(
            "Folder Description (will be included in exports)",
            value=f"Collection of images related to '{search_query}'",
            height=100,
            key="search_folder_description"
        )

        if st.button("Export Results", key="search_export_button"):
            # Construct a proper dataframe for export with all fields
            export_data = []
            for img in results:
                export_data.append({
                    "file_name": img.file_name,
                    "file_path": img.file_path,
                    "folder_name": img.folder.name if img.folder else "Unknown",
                    "object_name": img.object_name,
                    "description": img.description,
                    "confidence": img.confidence,
                    "processed_at": img.processed_at.strftime("%Y-%m-%d %H:%M:%S"),
                    "folder_description": folder_description,
                    "item_description": f"Found in search for '{search_query}'"
                })

            export_df = pd.DataFrame(export_data)

            if export_format == "CSV":
                export_filename = export_to_csv(export_df, f"search_results_{search_query}")
                st.success(f"Results exported to {export_filename}")

            elif export_format == "Excel":
                export_filename = export_to_excel(export_df, f"search_results_{search_query}")
                st.success(f"Results exported to {export_filename}")

            elif export_format == "PDF (Simple)":
                with st.spinner("Generating PDF..."):
                    export_filename = export_to_pdf_simple(export_df, f"search_results_{search_query}")
                st.success(f"Results exported to {export_filename}")

            elif export_format == "PDF (Detailed)":
                with st.spinner("Generating detailed PDF report with images..."):
                    include_imgs = include_images if 'include_images' in locals() else True
                    export_filename = export_to_pdf_detailed(export_df, f"search_results_{search_query}", include_imgs)
                st.success(f"Results exported to {export_filename}")

            # Provide download link
            with open(export_filename, "rb") as file:
                btn = st.download_button(
                    label="Download File",
                    data=file,
                    file_name=os.path.basename(export_filename),
                    mime="application/octet-stream",
                    key="search_download_button"
                )

        # Let user select an image to view details
        st.subheader("View Image Details")
        selected_image_id = st.selectbox(
            "Select an image to view details",
            options=result_df["id"].tolist(),
            format_func=lambda x: f"{result_df[result_df['id'] == x]['file_name'].iloc[0]} ({result_df[result_df['id'] == x]['folder_name'].iloc[0]})"
        )

        if selected_image_id:
            show_search_result_details(selected_image_id)
    else:
        st.info("Enter a search term to find images")

def show_search_result_details(image_id):
    """
    Display details for a specific image from search results
    """
    # Find the image in the database
    db = next(get_db())
    image = db.query(Image).filter(Image.id == image_id).first()

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
        st.markdown(f"**Folder:** {image.folder.name if image.folder else 'Unknown'}")
        st.markdown(f"**Object Identified:** {image.object_name}")
        st.markdown(f"**Confidence:** {image.confidence:.2f}")
        st.markdown("### Description")

        # Highlight search terms in description
        if 'search_query' in st.session_state and st.session_state.search_query:
            highlighted_desc = image.description
            for term in st.session_state.search_query.split():
                if len(term) > 2:  # Only highlight terms with more than 2 characters
                    highlighted_desc = highlighted_desc.replace(
                        term, f"<mark>{term}</mark>"
                    )
            st.markdown(highlighted_desc, unsafe_allow_html=True)
        else:
            st.markdown(image.description)

        # Additional metadata
        st.markdown("### File Metadata")
        st.markdown(f"**Processed Date:** {image.processed_at.strftime('%Y-%m-%d %H:%M:%S')}")
        st.markdown(f"**Full Path:** {image.file_path}")
        
        # Add dashboard and export buttons
        col_btn1, col_btn2 = st.columns(2)
        
        with col_btn1:
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
        
        with col_btn2:
            if st.button("Export Details"):
                # Create a DataFrame with this image for export
                image_data = [{
                    "Object": image.object_name,
                    "Description": image.description,
                    "Confidence": image.confidence,
                    "File Name": image.file_name,
                    "File Path": image.file_path,
                    "Folder": image.folder.name if image.folder else "Unknown",
                }]
                df = pd.DataFrame(image_data)
                
                # Show export options
                st.session_state.export_single_image_data = df
                st.session_state.export_single_image_id = image.id
                st.rerun()
        
        # Check if we need to show add to dashboard form
        if 'add_to_dashboard_image_id' in st.session_state and st.session_state.add_to_dashboard_image_id == image.id:
            st.subheader("Add to Dashboard")
            
            with st.form("search_add_to_dashboard_form"):
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
            
            export_format = st.selectbox("Export Format", ["CSV", "Excel", "PDF (Simple)", "PDF (Detailed)"], key="search_detail_export_format")
            
            # Include images option for detailed PDF
            include_images = False
            if export_format == "PDF (Detailed)":
                include_images = st.checkbox("Include Image", value=True, key="search_detail_include_image")
            
            if st.button("Generate Export", key="search_detail_generate_export"):
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
                        mime="application/octet-stream",
                        key="search_detail_download_export"
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