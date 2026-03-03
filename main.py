from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import tempfile
import os
import fitz  # PyMuPDF
from docx import Document
from openai import OpenAI
import json
from typing import Optional

app = FastAPI(title="ScholaCite API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize NVIDIA NIM client (OpenAI-compatible, free tier)
NVIDIA_API_KEY = "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"
client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=NVIDIA_API_KEY,
)

class CitationRequest(BaseModel):
    file_base64: str
    filename: str
    style: str

class CitationResponse(BaseModel):
    citation: str
    metadata: dict

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from PDF file"""
    text = ""
    try:
        pdf_document = fitz.open(pdf_path)
        for page_num in range(len(pdf_document)):
            page = pdf_document.load_page(page_num)
            text += page.get_text()
        pdf_document.close()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error extracting text from PDF: {str(e)}")
    return text

def extract_text_from_docx(docx_path: str) -> str:
    """Extract text from DOCX file"""
    try:
        doc = Document(docx_path)
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error extracting text from DOCX: {str(e)}")
    return text

def extract_metadata_and_format(text: str, style: str) -> tuple[str, dict]:
    """Use Claude to extract metadata and format citation"""
    prompt = f"""
    Extract bibliographic metadata from the following text and format it according to the specified citation style.
    
    Text to analyze:
    {text[:4000]}  # Limit text sent to Claude
    
    Citation Style: {style}
    
    Supported styles:
    1. sbl - SBL/JBL (Footnote): SBL Handbook of Style 2nd ed. + Chicago 17th. Footnote style only.
    2. jsot - JSOT (Author-date OR footnote): Flexible author-date or footnote system.
    3. jsnt - JSNT (SAGE Harvard): Author-date system.
    4. generic_sbl - Generic SBL: Standard SBL for books, journal articles, essays in collections.
    
    Respond ONLY with a JSON object in this exact format:
    {{
        "citation": "Formatted citation string",
        "metadata": {{
            "title": "Title of work",
            "authors": ["Author 1", "Author 2"],
            "publication_year": 2023,
            "journal_or_publisher": "Journal Name or Publisher",
            "volume": "Volume number (if applicable)",
            "pages": "Page range (if applicable)"
        }}
    }}
    """
    
    try:
        completion = client.chat.completions.create(
            model="qwen/qwen3-coder-480b-a35b-instruct",
            max_tokens=1024,
            temperature=0,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        
        response_text = completion.choices[0].message.content
        
        # Find JSON in response
        start = response_text.find('{')
        end = response_text.rfind('}') + 1
        if start != -1 and end != 0:
            json_str = response_text[start:end]
            result = json.loads(json_str)
            return result["citation"], result["metadata"]
        else:
            raise ValueError("No JSON found in Claude response")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing with Claude: {str(e)}")

@app.post("/format-citation", response_model=CitationResponse)
async def format_citation(request: CitationRequest):
    """Format citation from uploaded document"""
    
    # Validate file size (max 10MB)
    if len(request.file_base64) > 10 * 1024 * 1024 * 4/3:  # Base64 is ~4/3 larger than binary
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
    
    # Decode base64
    try:
        file_data = base64.b64decode(request.file_base64)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 data: {str(e)}")
    
    # Create temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(request.filename)[1]) as tmp_file:
        tmp_file.write(file_data)
        tmp_file_path = tmp_file.name
    
    try:
        # Extract text based on file type
        if request.filename.lower().endswith('.pdf'):
            text = extract_text_from_pdf(tmp_file_path)
        elif request.filename.lower().endswith('.docx'):
            text = extract_text_from_docx(tmp_file_path)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        
        # Process with Claude
        citation, metadata = extract_metadata_and_format(text, request.style)
        
        return CitationResponse(citation=citation, metadata=metadata)
        
    finally:
        # Clean up temporary file
        if os.path.exists(tmp_file_path):
            os.unlink(tmp_file_path)

@app.get("/")
async def root():
    return {"message": "ScholaCite API - Biblical Studies Citation Formatter"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
