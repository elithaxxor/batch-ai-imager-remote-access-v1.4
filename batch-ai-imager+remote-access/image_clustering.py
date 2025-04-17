
import numpy as np
from sklearn.cluster import KMeans
from sklearn.manifold import TSNE
import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import altair as alt
import os
from database import get_db, Image, Folder
from sqlalchemy import func
import json

def extract_features_from_metadata(metadata):
    """
    Extract numerical features from image metadata for clustering
    """
    features = []
    
    # Basic image dimensions
    features.append(metadata.get('width', 0))
    features.append(metadata.get('height', 0))
    features.append(metadata.get('file_size', 0) / 1024)  # KB
    
    # Camera settings
    features.append(metadata.get('focal_length', 0))
    features.append(metadata.get('aperture', 0))
    features.append(metadata.get('iso_speed', 0))
    
    return features

def extract_features_from_description(description):
    """
    Placeholder for extracting features from the AI-generated descriptions
    In a production environment, this would use a text embedding model
    """
    # Simple word count features as a basic implementation
    words = description.lower().split()
    features = [
        len(words),  # Description length
        sum(1 for w in words if w in ['old', 'ancient', 'historic', 'vintage']),  # Historical terms
        sum(1 for w in words if w in ['person', 'man', 'woman', 'people', 'child']),  # People terms
        sum(1 for w in words if w in ['landscape', 'nature', 'mountain', 'ocean', 'sky']),  # Nature terms
        sum(1 for w in words if w in ['building', 'structure', 'architecture', 'house']),  # Building terms
        sum(1 for w in words if w in ['colorful', 'bright', 'vibrant', 'dark', 'black', 'white']),  # Color terms
    ]
    return features

def cluster_images(images, n_clusters=5):
    """
    Cluster images based on their metadata and descriptions
    """
    if not images:
        return None, None
    
    # Prepare features matrix
    features_list = []
    for img in images:
        # Extract metadata features
        metadata = {}
        if hasattr(img, 'metadata_json') and img.metadata_json:
            try:
                metadata = json.loads(img.metadata_json)
            except:
                metadata = {}
                
        # Combine features
        img_features = extract_features_from_metadata(metadata)
        desc_features = extract_features_from_description(img.description)
        features_list.append(img_features + desc_features + [img.confidence])
    
    # Convert to numpy array
    X = np.array(features_list)
    
    # Normalize features
    from sklearn.preprocessing import StandardScaler
    X = StandardScaler().fit_transform(X)
    
    # Apply KMeans clustering
    kmeans = KMeans(n_clusters=min(n_clusters, len(images)), random_state=42)
    clusters = kmeans.fit_predict(X)
    
    # Create a visualization using TSNE
    tsne = TSNE(n_components=2, random_state=42)
    X_2d = tsne.fit_transform(X)
    
    # Return clustering results
    return clusters, X_2d

def show_clustering_page():
    """
    Display the image clustering interface
    """
    st.markdown("""
    <div class="card">
        <div class="card-header">
            <h2>Image Clustering</h2>
            <p>Automatically organize similar images into groups</p>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Get all images from database
    db_session = next(get_db())
    all_images = db_session.query(Image).all()
    
    if not all_images:
        st.info("No images available for clustering. Process some images first.")
        return
    
    # Sidebar controls
    st.sidebar.header("Clustering Settings")
    
    # Select clustering scope
    cluster_scope = st.sidebar.radio(
        "Select images to cluster",
        ["All Images", "By Folder"]
    )
    
    if cluster_scope == "By Folder":
        # Get folders
        folders = db_session.query(Folder).all()
        folder_options = [(f.id, f.name) for f in folders]
        
        if not folder_options:
            st.warning("No folders available")
            return
        
        selected_folder_id = st.sidebar.selectbox(
            "Select Folder",
            options=[f[0] for f in folder_options],
            format_func=lambda x: next((f[1] for f in folder_options if f[0] == x), "")
        )
        
        # Filter images by folder
        images = db_session.query(Image).filter(Image.folder_id == selected_folder_id).all()
    else:
        images = all_images
    
    # Set number of clusters
    n_clusters = st.sidebar.slider(
        "Number of clusters",
        min_value=2,
        max_value=min(10, len(images)),
        value=min(5, len(images))
    )
    
    # Run clustering
    if st.sidebar.button("Generate Clusters"):
        with st.spinner("Clustering images..."):
            clusters, viz_data = cluster_images(images, n_clusters)
            
            if clusters is None:
                st.error("Clustering failed. Not enough data.")
                return
            
            # Store results in session state
            st.session_state.clustered_images = {
                'images': images,
                'clusters': clusters,
                'viz_data': viz_data
            }
    
    # Display clustering results
    if 'clustered_images' in st.session_state:
        results = st.session_state.clustered_images
        images = results['images']
        clusters = results['clusters']
        viz_data = results['viz_data']
        
        # Create visualization
        st.subheader("Clustering Visualization")
        
        # Create DataFrame for visualization
        viz_df = pd.DataFrame({
            'x': viz_data[:, 0],
            'y': viz_data[:, 1],
            'cluster': clusters,
            'filename': [img.file_name for img in images],
            'object': [img.object_name for img in images]
        })
        
        # Create scatter plot
        chart = alt.Chart(viz_df).mark_circle(size=100).encode(
            x='x',
            y='y',
            color='cluster:N',
            tooltip=['filename', 'object', 'cluster']
        ).properties(
            width=600,
            height=400
        ).interactive()
        
        st.altair_chart(chart, use_container_width=True)
        
        # Display clusters
        st.subheader("Image Clusters")
        
        # For each cluster, show the images
        for cluster_id in range(n_clusters):
            if cluster_id in clusters:
                with st.expander(f"Cluster {cluster_id+1}", expanded=True):
                    # Get images in this cluster
                    cluster_images = [img for img, clust in zip(images, clusters) if clust == cluster_id]
                    
                    # Determine common characteristics
                    common_objects = pd.Series([img.object_name for img in cluster_images]).value_counts()
                    
                    st.markdown(f"**Common objects:** {', '.join(common_objects.index[:3])}")
                    st.markdown(f"**Contains {len(cluster_images)} images**")
                    
                    # Display images in grid
                    cols = st.columns(min(4, len(cluster_images)))
                    for i, img in enumerate(cluster_images[:12]):  # Limit to avoid overloading
                        col_idx = i % len(cols)
                        with cols[col_idx]:
                            if os.path.exists(img.file_path):
                                st.image(img.file_path, caption=img.file_name, use_column_width=True)
                            else:
                                st.warning(f"Image not found: {img.file_name}")
