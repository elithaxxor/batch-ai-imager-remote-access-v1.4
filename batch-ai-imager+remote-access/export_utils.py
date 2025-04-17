import os
import pandas as pd
from datetime import datetime
from fpdf import FPDF
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from PIL import Image as PILImage
import io
import base64

def export_to_csv(results_df, folder_name=None):
    """
    Export analysis results to CSV format
    
    Args:
        results_df (pandas.DataFrame): DataFrame containing the analysis results
        folder_name (str, optional): Name of the folder being analyzed
        
    Returns:
        str: Path to the exported CSV file
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    if folder_name:
        file_name = f"image_analysis_{folder_name}_{timestamp}.csv"
    else:
        file_name = f"image_analysis_{timestamp}.csv"
    
    # Export to CSV
    results_df.to_csv(file_name, index=False)
    
    return file_name

def export_to_excel(results_df, folder_name=None):
    """
    Export analysis results to Excel format
    
    Args:
        results_df (pandas.DataFrame): DataFrame containing the analysis results
        folder_name (str, optional): Name of the folder being analyzed
        
    Returns:
        str: Path to the exported Excel file
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    if folder_name:
        file_name = f"image_analysis_{folder_name}_{timestamp}.xlsx"
    else:
        file_name = f"image_analysis_{timestamp}.xlsx"
    
    # Export to Excel
    results_df.to_excel(file_name, index=False)
    
    return file_name

def export_to_pdf_simple(results_df, folder_name=None):
    """
    Export analysis results to PDF format using FPDF (simple format)
    
    Args:
        results_df (pandas.DataFrame): DataFrame containing the analysis results
        folder_name (str, optional): Name of the folder being analyzed
        
    Returns:
        str: Path to the exported PDF file
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    if folder_name:
        file_name = f"image_analysis_{folder_name}_{timestamp}_simple.pdf"
    else:
        file_name = f"image_analysis_{timestamp}_simple.pdf"
    
    # Create PDF object
    pdf = FPDF()
    pdf.add_page()
    
    # Set title
    pdf.set_font('Arial', 'B', 16)
    if folder_name:
        pdf.cell(0, 10, f'Image Analysis Results - {folder_name}', 0, 1, 'C')
    else:
        pdf.cell(0, 10, 'Image Analysis Results', 0, 1, 'C')
    
    pdf.set_font('Arial', '', 10)
    pdf.cell(0, 10, f'Generated on: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}', 0, 1, 'C')
    
    # Add folder description if available
    if 'folder_description' in results_df.columns and not results_df.empty:
        pdf.ln(5)
        pdf.set_font('Arial', 'B', 12)
        pdf.cell(0, 10, 'Folder Description:', 0, 1)
        pdf.set_font('Arial', '', 10)
        
        folder_desc = results_df.iloc[0].get('folder_description', 'No folder description available')
        # Handle multiline text
        pdf.multi_cell(0, 5, folder_desc)
    
    # Add a line break
    pdf.ln(10)
    
    # Set up table headers
    pdf.set_font('Arial', 'B', 12)
    pdf.cell(50, 10, 'File Name', 1, 0, 'C')
    pdf.cell(50, 10, 'Object Name', 1, 0, 'C')
    pdf.cell(30, 10, 'Confidence', 1, 1, 'C')
    
    # Add rows
    pdf.set_font('Arial', '', 10)
    for _, row in results_df.iterrows():
        file_name_text = row['file_name'] if len(row['file_name']) < 25 else row['file_name'][:22] + '...'
        object_name_text = row['object_name'] if len(row['object_name']) < 25 else row['object_name'][:22] + '...'
        
        pdf.cell(50, 10, file_name_text, 1, 0)
        pdf.cell(50, 10, object_name_text, 1, 0)
        pdf.cell(30, 10, f"{row['confidence']:.2f}", 1, 1, 'C')
    
    # Save PDF
    pdf.output(file_name)
    
    return file_name

def export_to_pdf_detailed(results_df, folder_name=None, include_images=True):
    """
    Export analysis results to PDF format using ReportLab (detailed format with images)
    
    Args:
        results_df (pandas.DataFrame): DataFrame containing the analysis results
        folder_name (str, optional): Name of the folder being analyzed
        include_images (bool): Whether to include the images in the PDF
        
    Returns:
        str: Path to the exported PDF file
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    if folder_name:
        file_name = f"image_analysis_{folder_name}_{timestamp}_detailed.pdf"
    else:
        file_name = f"image_analysis_{timestamp}_detailed.pdf"
    
    # Create PDF
    doc = SimpleDocTemplate(file_name, pagesize=letter)
    styles = getSampleStyleSheet()
    
    # Create title style
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        alignment=1,  # Center alignment
        spaceAfter=12
    )
    
    # Create content items list
    content = []
    
    # Add title
    if folder_name:
        content.append(Paragraph(f'Image Analysis Results - {folder_name}', title_style))
    else:
        content.append(Paragraph('Image Analysis Results', title_style))
    
    # Add timestamp
    content.append(Paragraph(f'Generated on: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}', 
                            styles['Normal']))
    content.append(Spacer(1, 20))
    
    # Add folder description if available
    if 'folder_description' in results_df.columns and not results_df.empty:
        content.append(Paragraph("Folder Description:", styles['Heading2']))
        folder_desc = results_df.iloc[0].get('folder_description', 'No folder description available')
        content.append(Paragraph(folder_desc, styles['Normal']))
        content.append(Spacer(1, 10))
    
    # Add summary table
    data = [['File Name', 'Object Name', 'Confidence']]
    for _, row in results_df.iterrows():
        data.append([
            row['file_name'], 
            row['object_name'], 
            f"{row['confidence']:.2f}"
        ])
    
    # Create table
    table = Table(data, colWidths=[200, 200, 80])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightblue),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    content.append(table)
    content.append(Spacer(1, 20))
    
    # Add detailed entries for each image
    content.append(Paragraph('Detailed Analysis', styles['Heading2']))
    
    for _, row in results_df.iterrows():
        content.append(Spacer(1, 10))
        content.append(Paragraph(f"<b>File:</b> {row['file_name']}", styles['Heading3']))
        
        # Include image if available and requested
        if include_images and 'file_path' in row and os.path.exists(row['file_path']):
            try:
                # Limit image size
                img = PILImage.open(row['file_path'])
                width, height = img.size
                max_width = 400
                if width > max_width:
                    ratio = max_width / width
                    width = max_width
                    height = int(height * ratio)
                
                content.append(RLImage(row['file_path'], width=width, height=height))
            except Exception as e:
                content.append(Paragraph(f"Error including image: {str(e)}", styles['Normal']))
        
        # Add analysis details
        content.append(Paragraph(f"<b>Object Identified:</b> {row['object_name']}", styles['Normal']))
        content.append(Paragraph(f"<b>Confidence:</b> {row['confidence']:.2f}", styles['Normal']))
        
        if 'description' in row:
            content.append(Paragraph("<b>Description:</b>", styles['Normal']))
            content.append(Paragraph(row['description'], styles['Normal']))
        
        # Add individual item description if available
        if 'item_description' in row:
            content.append(Paragraph("<b>Item Notes:</b>", styles['Normal']))
            content.append(Paragraph(row['item_description'], styles['Normal']))
        
        content.append(Spacer(1, 10))
        content.append(Paragraph("-" * 80, styles['Normal']))
    
    # Build PDF
    doc.build(content)
    
    return file_name

def get_image_base64(image_path):
    """Get base64 encoded string for an image file"""
    try:
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    except Exception:
        return None