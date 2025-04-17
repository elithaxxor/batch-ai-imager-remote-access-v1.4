
import streamlit as st
import os
import base64
import datetime

# Set page config
st.set_page_config(
    page_title="AI Image Analyzer - Project Export",
    page_icon="📦",
    layout="wide"
)

# Load custom CSS if available
if os.path.exists("custom_styles.css"):
    with open("custom_styles.css") as f:
        st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

# Main title with styling
st.markdown('<div class="app-header">', unsafe_allow_html=True)
st.title("AI Image Analyzer - Project Export")
st.markdown('</div>', unsafe_allow_html=True)

# Create new export section
st.markdown('<div class="card">', unsafe_allow_html=True)
st.subheader("Create New Project Export")

if st.button("Create Fresh Project Export"):
    with st.spinner("Creating project export..."):
        # Import and run the create_zip function
        import create_zip
        zip_filename = create_zip.create_project_zip()
        st.success(f"Project export created successfully: {zip_filename}")
        st.session_state.latest_export = zip_filename
st.markdown('</div>', unsafe_allow_html=True)

# Download section
st.markdown('<div class="card">', unsafe_allow_html=True)
st.subheader("Download Project Export")

# Find all zip files
zip_files = [f for f in os.listdir() if f.endswith('.zip')]
zip_files.sort(key=lambda x: os.path.getmtime(x), reverse=True)  # Sort by modification time (newest first)

if not zip_files:
    st.warning("No export files found. Please create a project export first.")
else:
    # Let user select which file to download
    selected_file = st.selectbox(
        "Select project export to download:",
        zip_files,
        index=0
    )
    
    # Display file info
    file_size_kb = os.path.getsize(selected_file) / 1024
    file_size_mb = file_size_kb / 1024
    
    mod_time = datetime.datetime.fromtimestamp(os.path.getmtime(selected_file))
    
    if file_size_mb < 1:
        st.info(f"File size: {file_size_kb:.1f} KB - Created: {mod_time.strftime('%Y-%m-%d %H:%M:%S')}")
    else:
        st.info(f"File size: {file_size_mb:.2f} MB - Created: {mod_time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Create download button
    with open(selected_file, "rb") as file:
        st.download_button(
            label="📦 Download Project Export",
            data=file,
            file_name=selected_file,
            mime="application/zip",
            help="Click to download the complete project as a zip archive"
        )
st.markdown('</div>', unsafe_allow_html=True)

# Instructions section
st.markdown('<div class="card">', unsafe_allow_html=True)
st.subheader("Export Contents")
st.markdown("""
This export includes all project files:

- Python code files (app.py, database.py, etc.)
- Utility scripts and modules
- HTML/CSS templates
- Configuration files
- Documentation (README.md)
- Requirements file

After downloading, extract the ZIP file to access all project components.
""")
st.markdown('</div>', unsafe_allow_html=True)

# Footer
st.markdown("---")
st.markdown("AI Image Analyzer - Project Export Tool")
