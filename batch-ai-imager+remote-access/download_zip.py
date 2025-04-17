
import streamlit as st
import os
import base64

# Set page config
st.set_page_config(
    page_title="AI Image Analyzer - Code Download",
    page_icon="📦",
    layout="wide"
)

# Load custom CSS
with open("custom_styles.css") as f:
    st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

def get_binary_file_downloader_html(bin_file, file_label='File'):
    with open(bin_file, 'rb') as f:
        data = f.read()
    bin_str = base64.b64encode(data).decode()
    href = f'<a href="data:application/octet-stream;base64,{bin_str}" download="{os.path.basename(bin_file)}">Download {file_label}</a>'
    return href

# Main title with styling
st.markdown('<div class="app-header">', unsafe_allow_html=True)
st.title("AI Image Analyzer - Code Download")
st.markdown('</div>', unsafe_allow_html=True)

st.markdown('<div class="card">', unsafe_allow_html=True)
st.markdown("This page allows you to download the complete codebase for the AI Image Analyzer application.")

st.subheader("What's included in the download:")
st.markdown("""
- All Python code files (`app.py`, `database.py`, etc.)
- Documentation (`README.md`)
- Configuration files
- Dependencies list (`package_requirements.txt`)
""")
st.markdown('</div>', unsafe_allow_html=True)

# Package info
st.markdown('<div class="card">', unsafe_allow_html=True)
st.subheader("Package Contents")
st.markdown("""
This package includes:

- **app.py**: Main application file
- **database.py**: Database models and operations
- **image_processor.py**: OpenAI image analysis logic
- **utils.py**: Utility functions including metadata extraction
- **history_page.py**: History browser functionality
- **search_page.py**: Search functionality
- **export_utils.py**: Export functions (CSV, Excel, PDF)
- **custom_styles.css**: Custom styling
- **dashboard_page.py**: Dashboard and analytics
- **image_clustering.py**: Image clustering functionality
- **comparison_tool.py**: Image comparison tool
- **README.md**: User documentation
- **package_requirements.txt**: Required Python packages
- **pyproject.toml**: Python project configuration
""")
st.markdown('</div>', unsafe_allow_html=True)

# Download section
st.markdown('<div class="card">', unsafe_allow_html=True)
st.subheader("Download the Code")
st.markdown("Click the button below to download the full codebase as a ZIP file:")

zip_file = "mommies_toy_code.zip"
if os.path.exists(zip_file):
    # Read the file as bytes
    with open(zip_file, "rb") as file:
        zip_data = file.read()
    
    # Create a download button
    st.download_button(
        label="📦 Download Complete Code Package",
        data=zip_data,
        file_name="mommies_toy_code.zip",
        mime="application/zip",
        help="Click to download all source code files as a zip archive"
    )
    
    # Display file size
    file_size_kb = os.path.getsize(zip_file) / 1024
    file_size_mb = file_size_kb / 1024
    
    if file_size_mb < 1:
        st.info(f"Download size: {file_size_kb:.1f} KB")
    else:
        st.info(f"Download size: {file_size_mb:.2f} MB")
else:
    st.error(f"ZIP file not found: {zip_file}")
    st.info("The code package needs to be created first. Please contact the administrator.")
st.markdown('</div>', unsafe_allow_html=True)

# Installation instructions
st.markdown('<div class="card">', unsafe_allow_html=True)
st.subheader("Installation Instructions")
st.markdown("""
After downloading:
1. Extract the ZIP file to a folder on your computer
2. Install Python 3.11 or newer if you don't have it
3. Open a terminal/command prompt in the extracted folder
4. Install the required packages: `pip install -r package_requirements.txt`
5. Create a `.env` file with your OpenAI API key and database URL:
   ```
   OPENAI_API_KEY=your_openai_api_key
   DATABASE_URL=postgresql://username:password@localhost:5432/mommies_toy_db
   ```
6. Run the application: `streamlit run app.py`
""")
st.markdown('</div>', unsafe_allow_html=True)

# Footer
st.markdown("---")
st.markdown("AI Image Analyzer - Powered by OpenAI")
