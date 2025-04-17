
# AI Image Analyzer

![AI Image Analyzer](https://img.shields.io/badge/AI-Image%20Analyzer-blue?style=for-the-badge&logo=openai)

A powerful AI-powered application that processes images to identify objects and generate detailed descriptions using OpenAI's vision capabilities.

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Program Flow Analysis](#program-flow-analysis)
- [Technical Deep Dive](#technical-deep-dive)
- [Installation Instructions](#installation-instructions)
- [Usage Guide](#usage-guide)
- [Changelog](#changelog)

## 🔍 Overview

The AI Image Analyzer enables users to process large collections of images, automatically identifying objects in each image and generating detailed descriptions with historical context. The system leverages OpenAI's GPT-4o model for advanced image analysis and stores all results in a PostgreSQL database for easy retrieval and searching.

## ✨ Key Features

- **Batch Image Processing**: Process entire folders of images with automatic object identification
- **AI-Powered Analysis**: Utilize OpenAI's GPT-4o model for object detection and detailed descriptions
- **Database Integration**: Store and retrieve analysis results with PostgreSQL
- **Search Functionality**: Find specific images by object name, description, or metadata
- **History Browsing**: Review previously analyzed image collections
- **Dashboard View**: Pin favorite images for quick access
- **Export Options**: Save analysis results as CSV, Excel, or PDF files
- **Image Metadata Extraction**: Extract and store technical metadata from images

## 🏗️ System Architecture

### Data Flow Diagram

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│    Image      │     │  OpenAI API   │     │  PostgreSQL   │
│   Selection   │────▶│   Processing  │────▶│   Database    │
└───────────────┘     └───────────────┘     └───────────────┘
        │                                           │
        │                                           │
        ▼                                           ▼
┌───────────────┐                         ┌───────────────┐
│   Results     │◀────────────────────────│    Query &    │
│    Display    │                         │    Search     │
└───────────────┘                         └───────────────┘
        │                                           │
        │                                           │
        ▼                                           ▼
┌───────────────┐                         ┌───────────────┐
│    Export     │                         │   History &   │
│    Options    │                         │   Dashboard   │
└───────────────┘                         └───────────────┘
```

### Component Structure

The application is built using the following components:

- **Web Interface**: Streamlit framework for interactive UI
- **Image Processing**: OpenAI API for vision analysis (GPT-4o model)
- **Database Layer**: SQLAlchemy with PostgreSQL for persistent storage
- **Utility Modules**: Image handling, metadata extraction, export functionality
- **Feature Pages**: History browsing, search, dashboard, clustering (planned)

## 🔄 Program Flow Analysis

The application follows a logical flow from image selection to analysis and storage:

1. **User selects a method of input**:
   - Upload individual images
   - Select a directory containing images

2. **Images are processed sequentially**:
   - Each image is validated
   - Base64 encoding is applied for API compatibility
   - Metadata is extracted (camera info, dimensions, GPS data)
   - The image is sent to OpenAI's vision model

3. **Analysis results are stored**:
   - PostgreSQL database maintains relationships between folders and images
   - Results include object name, description, confidence score, and metadata

4. **Users can interact with results**:
   - View detailed analysis for each image
   - Search across all processed images
   - Browse history of previous analyses
   - Export results in various formats

## 🔬 Technical Deep Dive

### Core Processing Logic

The heart of the application is the image processing function in `image_processor.py`, which handles the interaction with OpenAI:

```python
def analyze_image_with_openai(base64_image):
    """
    Use OpenAI's vision capabilities to analyze an image
    """
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert object identifier and historian. First identify the main object in the image, then provide its name and a detailed description including historical context if relevant. Return your response as JSON with 'object_name', 'description', and 'confidence' fields."
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Identify the main object in this image. Provide the object name and a detailed description that includes historical or contextual information if relevant. Format your response as JSON."
                        },
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                        }
                    ]
                }
            ],
            response_format={"type": "json_object"},
            max_tokens=1000
        )
```

### Database Structure

The database design (from `database.py`) features a relational structure with three main tables:

1. **Folders**: Store information about processed image folders
2. **Images**: Store analysis results and metadata for each image
3. **FavoriteImages**: Track pinned images for the dashboard

```python
class Image(Base):
    """
    Represents an image and its analysis results
    """
    __tablename__ = 'images'
    
    id = Column(Integer, primary_key=True)
    folder_id = Column(Integer, ForeignKey('folders.id'), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False, unique=True)
    object_name = Column(String(255))
    description = Column(Text)
    confidence = Column(Float)
    processed_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Metadata fields
    metadata_json = Column(Text, nullable=True)  # Stores all metadata as JSON
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    camera_make = Column(String(255), nullable=True)
    # ... additional metadata fields
```

### User Interface Organization

The Streamlit interface is organized into several pages, accessible via navigation buttons:

```python
# Navigation
col1, col2, col3, col4 = st.columns(4)
with col1:
    if st.button("Process Images", use_container_width=True):
        st.session_state.current_page = "process"
        st.rerun()
with col2:
    if st.button("Analysis History", use_container_width=True):
        st.session_state.current_page = "history"
        st.rerun()
with col3:
    if st.button("Search Database", use_container_width=True):
        st.session_state.current_page = "search"
        st.rerun()
with col4:
    if st.button("Dashboard", use_container_width=True):
        st.session_state.current_page = "dashboard"
        st.rerun()
```

### Smart Metadata Extraction

The application extracts detailed metadata from images using the `extract_image_metadata` function in `utils.py`:

```python
def extract_image_metadata(file_path):
    """
    Extract metadata from an image file
    """
    metadata = {
        'width': 0,
        'height': 0,
        'file_size': 0,
        'file_type': '',
        'camera_make': '',
        'camera_model': '',
        'date_taken': None,
        'focal_length': None,
        'exposure_time': '',
        'aperture': None,
        'iso_speed': None,
        'gps_latitude': None,
        'gps_longitude': None,
    }
    
    try:
        # Extract EXIF data
        with open(file_path, 'rb') as f:
            exif_tags = exifread.process_file(f, details=False)
            
            # Camera information
            if 'Image Make' in exif_tags:
                metadata['camera_make'] = str(exif_tags['Image Make'])
            
            # ... additional metadata extraction
```

### Search Implementation

The search functionality allows users to find images by content or metadata using SQL queries:

```python
def search_images(query):
    """
    Search for images by object name, description, or metadata fields
    """
    db = get_db()
    return db.query(Image).filter(
        (Image.object_name.ilike(f"%{query}%")) | 
        (Image.description.ilike(f"%{query}%")) |
        (Image.camera_make.ilike(f"%{query}%")) |
        (Image.camera_model.ilike(f"%{query}%")) |
        (Image.file_type.ilike(f"%{query}%")) |
        (Image.metadata_json.ilike(f"%{query}%"))
    ).all()
```

## 📥 Installation Instructions

### Prerequisites

- Python 3.11 or later
- PostgreSQL database
- OpenAI API key with access to GPT-4o model

### Setup Steps

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/ai-image-analyzer.git
cd ai-image-analyzer
```

2. **Install required packages**

```bash
pip install -r package_requirements.txt
```

3. **Set up environment variables**

Create a `.env` file in the project root with your API keys:

```
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=postgresql://username:password@localhost:5432/image_analyzer_db
```

4. **Initialize the database**

```bash
python -c "import database; database.Base.metadata.create_all(database.engine)"
```

## 🚀 Usage Guide

### Starting the Application

```bash
streamlit run app.py
```

This will start the Streamlit web application, typically accessible at http://localhost:5000

### Processing Images

1. Navigate to the "Process Images" page (default view)
2. Choose your input method:
   - Upload Images: Select individual files
   - Select Directory: Browse your filesystem for folders
3. Click "Process" to start the analysis
4. View results in the table and detailed view

### Viewing Analysis History

1. Click the "Analysis History" button in the navigation
2. Browse previously analyzed folders
3. Select a folder to view all processed images
4. Click on specific images to see detailed analysis results

### Searching Images

1. Click the "Search Database" button in the navigation
2. Enter search terms (object names, descriptions, camera info, etc.)
3. View matching results from the database
4. Select an image to see the full analysis details

### Exporting Results

From any results view:
1. Select an export format (CSV, Excel, PDF Simple, or PDF Detailed)
2. Add an optional folder description
3. Click "Export Results"
4. Use the download button to save the exported file

## 📝 Changelog

### May 15, 2024
- Initial documentation created
- Added comprehensive README.md with system architecture diagram
- Included detailed technical explanations and usage guides

### May 10, 2024
- Fixed bug in metadata extraction for HEIC image format
- Improved PDF export formatting
- Added option to include images in PDF exports

### May 5, 2024
- Implemented clustering page placeholder for future development
- Added comparison page placeholder
- Created download code functionality

### May 1, 2024
- Integrated OpenAI GPT-4o model for improved image analysis
- Updated database schema to store additional metadata
- Enhanced search capabilities to include metadata fields

### April 25, 2024
- Initial release of AI Image Analyzer
- Core functionality for image processing and analysis
- Basic search and history features
- CSV and Excel export options
