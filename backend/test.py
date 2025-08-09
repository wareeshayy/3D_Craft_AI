# Add this to your FastAPI backend for testing
from fastapi.responses import FileResponse
import os

@app.get("/api/download/{filename}")
async def download_file(filename: str):
    # For testing - create a simple text file
    content = f"# 3DCraft AI Model: {filename}\n# Generated successfully!\n# This is a demo file."
    
    # Create a temporary file
    temp_path = f"./temp_{filename}.txt"
    with open(temp_path, "w") as f:
        f.write(content)
    
    return FileResponse(temp_path, filename=filename, media_type='application/octet-stream')