# AI Image Analyzer

An AI-powered image analysis tool that processes folders of images to identify objects and generate descriptions using OpenAI's vision capabilities.

## Project Overview

This application enables users to process large collections of images (up to 5,000 images across 200 folders), automatically identifying objects in each image and generating detailed descriptions with historical context. The system uses OpenAI's GPT-4o model for advanced image analysis and stores all results in a PostgreSQL database for easy retrieval and searching.

### Key Features

- **Batch Image Processing**: Process entire folders of images with automatic object identification
- **AI-Powered Analysis**: Utilize OpenAI's GPT-4o model for object detection and detailed descriptions
- **Database Integration**: Store and retrieve analysis results with PostgreSQL
- **Search Functionality**: Find specific images by object name or description
- **History Browsing**: Review previously analyzed image collections
- **Export Options**: Save analysis results as CSV or Excel files

## Technical Architecture

The application is built using the following technologies:

- **Python** (3.11+) for the core application logic
- **Streamlit** for the web interface
- **OpenAI API** (GPT-4o) for image analysis
- **PostgreSQL** with SQLAlchemy for database operations
- **Pandas** for data manipulation and export

## Installation Instructions

### Prerequisites

- Python 3.11 or later
- PostgreSQL database
- OpenAI API key

### Setup

1. **Clone the repository**

```bash
git clone <repository-url>
cd ai-image-analyzer
```

2. **Install required packages**

```bash
pip install -r requirements.txt
```

3. **Set up environment variables**

Create a `.env` file in the project root directory with the following variables:

```
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=postgresql://username:password@localhost:5432/image_analyzer_db
```

Alternatively, you can set these environment variables in your system.

4. **Create the database**

```bash
python -c "import database; database.Base.metadata.create_all(database.engine)"
```

## Usage Guide

### Starting the Application

```bash
streamlit run app.py
```

This will start the web application on `http://localhost:5000`.

### Processing Images

1. Navigate to the "Process Images" page (default view)
2. In the sidebar, enter the parent directory containing your image folders
3. Select a folder from the dropdown menu
4. Click "Process Folder" to start the analysis
5. View the results in the table and detailed view

### Viewing Analysis History

1. Click the "Analysis History" button at the top
2. Browse previously analyzed folders
3. Select a folder to view all processed images
4. Click on specific images to see detailed analysis results

### Searching Images

1. Click the "Search Database" button at the top
2. Enter search terms in the input field (object names or descriptions)
3. View matching results from the database
4. Select an image to see the full analysis details

### Exporting Results

After processing images:
1. In the Results Table view, select an export format (CSV or Excel)
2. Click "Export Results"
3. The file will be saved in the current working directory

## Cost Considerations

The estimated cost for processing 5,000 images:
- OpenAI API costs: Approximately $300-350 (based on current pricing)
- Implementation costs: Approximately $400
- Total estimated cost: $700-750

This can vary based on actual image processing needs and any additional requirements.

## Future Enhancements

- Batch processing progress tracking across sessions
- User authentication and role-based access
- Custom analysis templates for different image categories
- Integration with cloud storage services
- Enhanced visualization of analysis results

## Support and Documentation

For more information on the OpenAI API and the models used in this application, please refer to:
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [GPT-4o Model Documentation](https://platform.openai.com/docs/models)