from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import asyncio
import os

app = FastAPI(title="Scholacite API", docs_url="/api/docs")

# Serve static files
if not os.path.exists("static"):
    os.makedirs("static")
    
app.mount("/static", StaticFiles(directory="static"), name="static")

# In-memory storage for demo purposes (would use database in production)
usage_count = 0
MAX_FREE_USES = 10

@app.get("/", response_class=HTMLResponse)
async def read_root():
    with open("static/index.html", "r") as file:
        return HTMLResponse(content=file.read(), status_code=200)

@app.post("/api/format")
async def format_citation(file: UploadFile = File(...)):
    global usage_count
    
    # Check usage limit for freemium model
    if usage_count >= MAX_FREE_USES:
        raise HTTPException(status_code=429, detail="Usage limit exceeded. Please upgrade for unlimited access.")
    
    # Simulate processing delay
    await asyncio.sleep(1)
    
    # Validate file type
    if not file.content_type.startswith("text/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a text file.")
    
    # Read file content
    content = await file.read()
    text_content = content.decode("utf-8")
    
    # Simple citation formatting (would be more sophisticated in reality)
    formatted_citation = format_bibliography(text_content)
    
    # Increment usage count
    usage_count += 1
    
    return {
        "formatted_citation": formatted_citation,
        "usage_count": usage_count,
        "max_free_uses": MAX_FREE_USES
    }

def format_bibliography(content: str) -> str:
    """
    Simple bibliography formatter.
    In a real implementation, this would parse various citation formats
    and standardize them according to selected styles (APA, MLA, Chicago, etc.)
    """
    lines = content.strip().split('\n')
    formatted_entries = []
    
    for i, line in enumerate(lines, 1):
        # Simple formatting - in reality would parse author, title, publication, etc.
        if line.strip():
            formatted_entries.append(f"[{i}] {line.strip()}")
    
    return "\n".join(formatted_entries)

@app.get("/api/usage")
async def get_usage():
    return {
        "usage_count": usage_count,
        "max_free_uses": MAX_FREE_USES
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)