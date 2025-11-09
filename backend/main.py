from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agents.orchestrator_v2 import OrchestratorV2  # CHANGED: V2
from typing import List # Added for CompareRequest

app = FastAPI(
    title="Viably API",
    description="Product Sandbox War Game - Multi-Agent Analysis",
    version="1.0.0"
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OrchestratorV2 (merged schema)
orchestrator = OrchestratorV2(use_vector_embeddings=False)

class AnalyzeRequest(BaseModel):
    feature_name: str
    description: str
    target_user: str = "PNC customers"
    business_goal: str = "increase engagement and revenue"
    industry: str = "banking"  # ADDED: default to banking

@app.get("/")
async def root():
    return {
        "status": "healthy",
        "service": "Viably Product Sandbox API",
        "agents": ["Engineer", "Competitor", "Orchestrator", "Upskilling"]
    }

@app.post("/api/analyze")
async def analyze_feature(request: AnalyzeRequest):
    """
    Analyze a product feature using multi-agent AI.
    """
    result = orchestrator.analyze(
        feature_name=request.feature_name,
        feature_description=request.description,
        target_user=request.target_user,
        business_goal=request.business_goal,
        industry=request.industry
    )
    return result

# Added GET /health endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok"}

# Added POST /api/compare endpoint
class CompareRequest(BaseModel):
    features: List[str]

@app.post("/api/compare")
async def compare_features(request: CompareRequest):
    return {"message": "Comparing features"}

# Added GET /api/analytics/skills endpoint
@app.get("/api/analytics/skills")
async def get_skills():
    return {"skills": ["python", "fastapi", "react", "typescript"]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)