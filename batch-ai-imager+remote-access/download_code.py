
import streamlit as st
import base64
import os

def get_binary_file_downloader_html(bin_file, file_label='File'):
    with open(bin_file, 'rb') as f:
        data = f.read()
    bin_str = base64.b64encode(data).decode()
    href = f'<a href="data:application/octet-stream;base64,{bin_str}" download="{os.path.basename(bin_file)}">Download {file_label}</a>'
    return href

# Load custom CSS
with open("custom_styles.css") as f:
    st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

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

st.markdown('<div class="card">', unsafe_allow_html=True)
st.subheader("Download the Code")
st.markdown("Click the link below to download the full codebase as a ZIP file:")

zip_file = "ai_image_analyzer_code_export.zip"
if os.path.exists(zip_file):
    st.markdown(get_binary_file_downloader_html(zip_file, 'AI Image Analyzer Code (ZIP)'), unsafe_allow_html=True)
    
    # Also provide a direct download button
    with open(zip_file, "rb") as file:
        btn = st.download_button(
            label="Download Code (ZIP File)",
            data=file,
            file_name=zip_file,
            mime="application/zip"
        )
        
    st.success("Download available! Click the link or button above to download the code.")
else:
    st.error(f"ZIP file not found: {zip_file}")
st.markdown('</div>', unsafe_allow_html=True)

st.markdown('<div class="card">', unsafe_allow_html=True)
st.subheader("Installation Instructions")
st.markdown("""
After downloading:
1. Extract the ZIP file
2. Install the required dependencies: `pip install -r package_requirements.txt`
3. Configure your environment variables (OpenAI API key and database connection)
4. Run the application: `streamlit run app.py`

For detailed instructions, please refer to the README.md file included in the download.
""")
st.markdown('</div>', unsafe_allow_html=True)

# Footer
st.markdown("---")
st.markdown("AI Image Analyzer - Powered by OpenAI")
