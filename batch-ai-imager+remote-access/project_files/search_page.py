import streamlit as st
import os
import pandas as pd
from database import search_images, get_db, Image
import logging

logger = logging.getLogger(__name__)

def show_search_page():
    """
    Display a search interface for finding images by object name or description
    """
    st.header("Search Images")
    st.write("Search the database for specific objects or descriptions")
    
    # Search input
    search_query = st.text_input("Search for objects or descriptions", 
                                help="Enter keywords to search. Examples: 'cat', 'mountain', 'sunset'")
    
    # Execute search when a query is entered
    if search_query:
        try:
            with st.spinner("Searching images..."):
                results = search_images(search_query)
        except Exception as e:
            logger.error(f"Error searching images: {e}")
            st.error("Failed to search images in the database.")
            return
        
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
            "description_snippet": (img.description[:100] + "...") if img.description and len(img.description) > 100 else (img.description or "")
        } for img in results]
        
        result_df = pd.DataFrame(result_data)
        
        # Display results count
        st.subheader(f"Found {len(results)} results")
        
        # Warn if too many results (pagination suggestion)
        if len(result_df) > 100:
            st.warning("More than 100 results found. Consider refining your search or adding pagination.")
        
        # Display as a table
        st.dataframe(
            result_df[["file_name", "folder_name", "object_name", "confidence", "description_snippet"]],
            column_config={
                "file_name": "Image Name",
                "folder_name": "Folder",
                "object_name": "Object Identified",
                "confidence": st.column_config.NumberColumn("Confidence", format="%.2f"),
                "description_snippet": "Description Preview"
            },
            hide_index=True
        )
        
        # Let user select an image to view details
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
    try:
        db = next(get_db())
        image = db.query(Image).filter(Image.id == image_id).first()
    except Exception as e:
        logger.error(f"Error retrieving image from database: {e}")
        st.error("Failed to retrieve image from the database.")
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
        st.markdown(f"**Folder:** {image.folder.name if image.folder else 'Unknown'}")
        st.markdown(f"**Object Identified:** {image.object_name}")
        st.markdown(f"**Confidence:** {image.confidence:.2f}")
        st.markdown("### Description")
        if image.description:
            st.markdown(image.description)
        else:
            st.markdown("No description available")
        
        # Highlight search terms in description
        if 'search_query' in st.session_state and st.session_state.search_query:
            highlighted_desc = image.description if image.description else ""
            for term in st.session_state.search_query.split():
                if len(term) > 2:  # Only highlight terms with more than 2 characters
                    highlighted_desc = highlighted_desc.replace(
                        term, f"<mark>{term}</mark>"
                    )
            st.markdown(highlighted_desc, unsafe_allow_html=True)
        
        # Additional metadata
        st.markdown("### Metadata")
        st.markdown(f"**Processed Date:** {image.processed_at.strftime('%Y-%m-%d %H:%M:%S')}")
        st.markdown(f"**Full Path:** {image.file_path}")