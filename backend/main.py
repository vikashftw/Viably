from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agents.orchestrator import Orchestrator
from routers import jira

app = FastAPI(title="Viably API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize orchestrator once
orchestrator = Orchestrator(use_vector_embeddings=True)

class AnalyzeRequest(BaseModel):
    feature_name: str
    description: str
    industry: str = "fintech"

@app.get("/")
def read_root():
    return {"message": "Viably Backend is running"}

@app.post("/api/analyze")
async def analyze_feature(request: AnalyzeRequest):
    result = orchestrator.analyze(
        feature_name=request.feature_name,
        feature_description=request.description,
        industry=request.industry
    )
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)