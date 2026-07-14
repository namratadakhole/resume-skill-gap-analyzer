import io
import pypdf
import docx

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extracts text from PDF file bytes using pypdf.
    """
    try:
        pdf_file = io.BytesIO(file_bytes)
        reader = pypdf.PdfReader(pdf_file)
        text_content = []
        for page_num, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                text_content.append(page_text)
        return "\n".join(text_content)
    except Exception as e:
        raise ValueError(f"Failed to extract text from PDF: {str(e)}")

def extract_text_from_docx(file_bytes: bytes) -> str:
    """
    Extracts text from DOCX file bytes using python-docx.
    """
    try:
        docx_file = io.BytesIO(file_bytes)
        doc = docx.Document(docx_file)
        text_content = []
        
        # Extract text from paragraphs
        for para in doc.paragraphs:
            if para.text:
                text_content.append(para.text)
                
        # Extract text from tables
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    if cell.text:
                        text_content.append(cell.text)
                        
        return "\n".join(text_content)
    except Exception as e:
        raise ValueError(f"Failed to extract text from DOCX: {str(e)}")

def extract_text_from_txt(file_bytes: bytes) -> str:
    """
    Extracts text from TXT file bytes. Tries multiple encodings.
    """
    encodings = ['utf-8', 'latin-1', 'cp1252', 'utf-16']
    for encoding in encodings:
        try:
            return file_bytes.decode(encoding)
        except UnicodeDecodeError:
            continue
    raise ValueError("Failed to decode TXT file. Please verify it is a valid text file with standard encoding.")

def extract_text_from_image(file_bytes: bytes, filename: str) -> str:
    """
    Extracts text from PNG, JPG, or JPEG file bytes using pytesseract and Pillow.
    """
    try:
        from PIL import Image
        import pytesseract
        import io
        
        # Load image using Pillow
        image = Image.open(io.BytesIO(file_bytes))
        
        # Run OCR
        extracted = pytesseract.image_to_string(image)
        
        cleaned = extracted.strip()
        if cleaned:
            return cleaned
        raise ValueError("No readable text found in the uploaded image.")
    except Exception as e:
        # Handle cases where tesseract CLI is missing or throws error
        err_msg = str(e)
        if "not installed" in err_msg or "PATH" in err_msg or "tesseract" in err_msg.lower():
            # Fallback to ocr.space free API as a robust hybrid fallback
            try:
                import requests
                payload = {
                    "apikey": "helloworld",
                    "language": "eng",
                    "isOverlayRequired": False
                }
                files = {
                    "file": (filename, file_bytes)
                }
                response = requests.post("https://api.ocr.space/parse/image", data=payload, files=files, timeout=20)
                if response.status_code == 200:
                    result = response.json()
                    exit_code = str(result.get("OCRExitCode", ""))
                    if exit_code == "1":
                        parsed_results = result.get("ParsedResults", [])
                        text_runs = [item.get("ParsedText", "") for item in parsed_results if item.get("ParsedText")]
                        extracted_web = "\n".join(text_runs).strip()
                        if extracted_web:
                            return extracted_web
            except Exception:
                pass
        raise ValueError("No readable text found in the uploaded image.")

def extract_text(file_bytes: bytes, filename: str) -> str:
    """
    Routes the file content to the appropriate extractor based on the filename extension.
    """
    lower_filename = filename.lower()
    if lower_filename.endswith('.pdf'):
        return extract_text_from_pdf(file_bytes)
    elif lower_filename.endswith('.docx'):
        return extract_text_from_docx(file_bytes)
    elif lower_filename.endswith(('.txt', '.md', '.rtf')):
        return extract_text_from_txt(file_bytes)
    elif lower_filename.endswith(('.png', '.jpg', '.jpeg', '.bmp', '.gif', '.tiff')):
        return extract_text_from_image(file_bytes, filename)
    else:
        raise ValueError(f"Unsupported file format: {filename}. Supported formats are PDF, DOCX, TXT, and Images (PNG, JPG, JPEG).")
