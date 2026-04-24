# 3DCraft - AI 3D Model Generator

## Windows Setup Instructions

### Prerequisites
- Node.js (latest LTS)
- Python 3.8+
- Git
# Live Link https://aquamarine-3dcradtai.netlify.app/
### Quick Start

1. **Frontend Setup:**
   `powershell
   cd frontend
   npm install
   npm start
   `

2. **Backend Setup:**
   `powershell
   cd backend
   .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   `

### Project Structure
- rontend/ - React + Three.js frontend
- ackend/ - FastAPI backend service
- i-service/ - AI model processing service
- lender-scripts/ - Blender automation scripts

## Development Commands

### Start Frontend
`powershell
cd frontend
npm start
`

### Start Backend
`powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
`

The frontend will run on http://localhost:3000
The backend will run on http://localhost:8000
