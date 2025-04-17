import streamlit as st
import time
import os
import base64
from PIL import Image
import io

def show_onboarding_tour():
    """
    Display an interactive onboarding tour to introduce users to the application's capabilities
    """
    st.markdown("""
    <div class="card">
        <div class="card-header">
            <h2>AI Discovery Tour</h2>
            <p>Let's explore the amazing capabilities of the AI Image Analyzer!</p>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Tour progress tracking
    if 'tour_step' not in st.session_state:
        st.session_state.tour_step = 1
    if 'tour_completed' not in st.session_state:
        st.session_state.tour_completed = False
    
    # Tour navigation buttons
    def next_step():
        st.session_state.tour_step += 1
        
    def prev_step():
        st.session_state.tour_step = max(1, st.session_state.tour_step - 1)
    
    def finish_tour():
        st.session_state.tour_completed = True
        st.session_state.current_page = "process"
    
    def restart_tour():
        st.session_state.tour_step = 1
        st.session_state.tour_completed = False
    
    # Display current tour step
    show_tour_step(st.session_state.tour_step)
    
    # Show navigation buttons
    col1, col2, col3 = st.columns([1, 1, 1])
    
    with col1:
        if st.session_state.tour_step > 1:
            st.button("⬅️ Previous", on_click=prev_step)
    
    with col2:
        if st.session_state.tour_step < 5:  # Adjust based on total steps
            st.button("Next ➡️", on_click=next_step)
        else:
            st.button("🎉 Finish Tour", on_click=finish_tour)
    
    with col3:
        if st.session_state.tour_step > 1:
            st.button("🔄 Restart Tour", on_click=restart_tour)
    
    # Tour progress indicator
    progress = st.session_state.tour_step / 5  # Adjust denominator based on total steps
    st.progress(progress)
    st.caption(f"Step {st.session_state.tour_step} of 5")  # Adjust based on total steps

def show_tour_step(step):
    """
    Display content for a specific tour step
    """
    if step == 1:
        show_welcome_step()
    elif step == 2:
        show_image_analysis_step()
    elif step == 3:
        show_folder_processing_step()
    elif step == 4:
        show_dashboard_step()
    elif step == 5:
        show_export_step()

def show_welcome_step():
    """
    Introduction step explaining the purpose of the application
    """
    st.subheader("🎯 Welcome to AI Image Analyzer")
    
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.markdown("""
        ### Discover the Power of AI for Your Images
        
        The AI Image Analyzer helps you:
        
        * 🤖 **Analyze images** using advanced AI to identify objects
        * 📊 **Extract metadata** from your image files
        * 🔍 **Organize and search** your image collection
        * 📱 **Create dashboards** of your favorite images
        * 📑 **Export results** in multiple formats
        
        This tour will walk you through the key features so you can get the most out of the application!
        """)
    
    with col2:
        # Display a sample image or icon
        st.image("generated-icon.png", use_column_width=True)
    
    st.info("Click 'Next' to continue the tour and learn about each feature!")

def show_image_analysis_step():
    """
    Step explaining image analysis capabilities
    """
    st.subheader("🧠 AI Image Analysis")
    
    col1, col2 = st.columns([1, 1])
    
    with col1:
        st.markdown("""
        ### How AI Analyzes Your Images
        
        When you process an image, our AI:
        
        1. 👁️ **Identifies objects** in the image
        2. 📝 **Generates descriptions** of what it sees
        3. 📏 **Calculates a confidence score** for its analysis
        4. 📊 **Extracts metadata** like camera type, location, etc.
        
        The AI uses advanced computer vision and natural language models to understand images like a human would.
        """)
        
        with st.expander("How accurate is the AI?"):
            st.markdown("""
            The AI uses state-of-the-art vision models from OpenAI. 
            
            * For common objects, accuracy is typically very high (90%+)
            * For complex scenes, it provides detailed descriptions
            * All analyses include confidence scores so you know how certain the AI is
            * Results improve over time as AI models are updated
            """)
    
    with col2:
        # Simulate AI analysis with a mock result display
        st.markdown("#### Sample Analysis Result")
        
        st.markdown("""
        <div style="border:1px solid #ddd; padding:10px; border-radius:5px;">
            <h5>Mountain Landscape</h5>
            <p><b>Confidence:</b> 0.98</p>
            <p><b>Description:</b> A scenic mountain landscape featuring snow-capped peaks reflected in a clear alpine lake. The foreground shows pine trees and wildflowers along the shore, with a clear blue sky above.</p>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("""
        <div style="font-size:0.8em; margin-top:15px;">
            <p><b>Metadata extracted:</b> Canon EOS 5D Mark IV, f/8.0, 1/250s, ISO 100, 24mm focal length, GPS: 47.5962° N, 13.6545° E</p>
        </div>
        """, unsafe_allow_html=True)

def show_folder_processing_step():
    """
    Step explaining batch processing of folders
    """
    st.subheader("📁 Processing Image Folders")
    
    col1, col2 = st.columns([3, 2])
    
    with col1:
        st.markdown("""
        ### Batch Process Your Image Collections
        
        Process entire folders of images at once:
        
        1. 📂 **Select a folder** containing your images
        2. 🚀 **Click "Process Folder"** to start the analysis
        3. ⏱️ **Wait** while the AI processes each image
        4. 📋 **Review the results** in a convenient table
        
        Perfect for photographers with large collections of images to analyze!
        """)
        
        with st.expander("Supported image formats"):
            st.markdown("""
            * JPEG (.jpg, .jpeg)
            * PNG (.png)
            * HEIF/HEIC (.heic) - common for iPhone photos
            * RAW formats from major camera manufacturers
            """)
    
    with col2:
        # Show a folder processing animation/illustration
        st.markdown("#### Folder Processing")
        
        # Create a simple animation effect
        folder_progress = st.progress(0)
        for i in range(100):
            if i < 33:
                status = "Reading image files..."
            elif i < 66:
                status = "Analyzing with AI..."
            else:
                status = "Saving results..."
            
            # Only update animation if this is the active step (to avoid animation running in background)
            if st.session_state.tour_step == 3:
                folder_progress.progress(i + 1)
                st.caption(status)
                time.sleep(0.02)
        
        st.success("Folder processed successfully!")
        st.caption("Your real processing time will depend on the number of images and your internet connection")

def show_dashboard_step():
    """
    Step explaining the dashboard functionality
    """
    st.subheader("📊 Your Customizable Dashboard")
    
    st.markdown("""
    ### Create Your Personal Image Gallery
    
    The Dashboard feature lets you:
    
    * ⭐ **Save favorite images** for quick access
    * 🏷️ **Add custom labels** to organize your collection
    * 📝 **Include notes** about why each image matters to you
    * 🔀 **Reorder** your favorites any way you like
    * 🖼️ **Choose different layouts** - Grid, List, or Detailed view
    """)
    
    # Show layout options
    st.markdown("#### Dashboard Layout Options")
    
    tab1, tab2, tab3 = st.tabs(["Grid Layout", "List Layout", "Detailed Layout"])
    
    with tab1:
        st.markdown("""
        <div style="display: flex; justify-content: space-between;">
            <div style="border: 1px solid #ddd; padding: 10px; width: 30%;">
                <h5 style="text-align: center;">Mountain View</h5>
                <div style="height: 100px; background-color: #f0f0f0; display: flex; align-items: center; justify-content: center;">
                    <p style="color: #888;">Image</p>
                </div>
            </div>
            <div style="border: 1px solid #ddd; padding: 10px; width: 30%;">
                <h5 style="text-align: center;">Beach Sunset</h5>
                <div style="height: 100px; background-color: #f0f0f0; display: flex; align-items: center; justify-content: center;">
                    <p style="color: #888;">Image</p>
                </div>
            </div>
            <div style="border: 1px solid #ddd; padding: 10px; width: 30%;">
                <h5 style="text-align: center;">Forest Path</h5>
                <div style="height: 100px; background-color: #f0f0f0; display: flex; align-items: center; justify-content: center;">
                    <p style="color: #888;">Image</p>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        st.caption("Grid view shows a compact gallery of images")
    
    with tab2:
        st.markdown("""
        <div style="border: 1px solid #ddd; padding: 10px; margin-bottom: 10px;">
            <div style="display: flex;">
                <div style="width: 30%; background-color: #f0f0f0; height: 80px; display: flex; align-items: center; justify-content: center;">
                    <p style="color: #888;">Image</p>
                </div>
                <div style="width: 70%; padding-left: 15px;">
                    <h5>Mountain View</h5>
                    <p>Object: Mountain landscape</p>
                    <p>Note: Taken during summer hiking trip</p>
                </div>
            </div>
        </div>
        <div style="border: 1px solid #ddd; padding: 10px;">
            <div style="display: flex;">
                <div style="width: 30%; background-color: #f0f0f0; height: 80px; display: flex; align-items: center; justify-content: center;">
                    <p style="color: #888;">Image</p>
                </div>
                <div style="width: 70%; padding-left: 15px;">
                    <h5>Beach Sunset</h5>
                    <p>Object: Coastal sunset</p>
                    <p>Note: Beautiful colors on the horizon</p>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        st.caption("List view provides more details with a streamlined layout")
    
    with tab3:
        st.markdown("""
        <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 10px;">
            <h5>Mountain View</h5>
            <div style="display: flex;">
                <div style="width: 40%; background-color: #f0f0f0; height: 120px; display: flex; align-items: center; justify-content: center;">
                    <p style="color: #888;">Image</p>
                </div>
                <div style="width: 60%; padding-left: 15px;">
                    <p><b>Object:</b> Mountain landscape</p>
                    <p><b>Description:</b> A scenic mountain landscape with snow-capped peaks...</p>
                    <p><b>Note:</b> Taken during summer hiking trip in the Alps</p>
                    <p><b>Camera:</b> Canon EOS 5D Mark IV</p>
                    <p><b>Location:</b> Swiss Alps</p>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        st.caption("Detailed view shows comprehensive information about each image")

def show_export_step():
    """
    Final step explaining export capabilities and wrapping up the tour
    """
    st.subheader("📤 Export & Share Your Results")
    
    col1, col2 = st.columns([3, 2])
    
    with col1:
        st.markdown("""
        ### Multiple Export Options
        
        Share your analysis results in various formats:
        
        * 📊 **CSV files** for spreadsheet applications
        * 📑 **Excel workbooks** with formatted data
        * 📄 **Simple PDF reports** for basic sharing
        * 📚 **Detailed PDF reports** with images and complete metadata
        
        Perfect for research, cataloging, presentations, or sharing with friends!
        """)
        
        st.markdown("""
        ### 🎉 You're Ready to Explore!
        
        Now that you've completed the tour, you're ready to:
        
        1. 📂 **Process** your own image folders
        2. 🔍 **Search** through your analyzed images
        3. 📊 **Create** your personalized dashboard
        4. 📤 **Export** your findings in your preferred format
        
        Click "Finish Tour" to start using the application!
        """)
    
    with col2:
        # Show export format options
        st.markdown("#### Export Format Samples")
        
        with st.expander("CSV Example"):
            st.markdown("""
            ```
            file_name,object_name,confidence,description
            mountain.jpg,Mountain landscape,0.98,"A scenic mountain..."
            beach.jpg,Coastal sunset,0.95,"Beautiful sunset..."
            forest.jpg,Forest path,0.96,"A winding path..."
            ```
            """)
        
        with st.expander("PDF Example"):
            st.markdown("""
            <div style="border: 1px solid #ddd; padding: 10px; background-color: #f9f9f9;">
                <h4 style="text-align: center;">Image Analysis Report</h4>
                <p style="text-align: center;">Generated: April 14, 2023</p>
                <hr>
                <h5>Mountain Landscape</h5>
                <p>Confidence: 0.98</p>
                <p>Description: A scenic mountain landscape...</p>
                <div style="height: 60px; background-color: #e0e0e0; display: flex; align-items: center; justify-content: center; margin: 10px 0;">
                    <p style="color: #888;">Image Preview</p>
                </div>
                <hr>
                <h5>Beach Sunset</h5>
                <p>Confidence: 0.95</p>
                <p>Description: Beautiful sunset over the ocean...</p>
            </div>
            """, unsafe_allow_html=True)

# Helper functions to display sample images if needed
def get_base64_encoded_image(image_path):
    """Get base64 encoded string for an image file"""
    with open(image_path, "rb") as img_file:
        return base64.b64encode(img_file.read()).decode()

def create_sample_image(width, height, color="#f0f0f0", text="Sample Image"):
    """Create a sample image with text for demonstration purposes"""
    img = Image.new('RGB', (width, height), color=color)
    # Add text would require PIL's ImageDraw, omitted for simplicity
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode()