from fastapi import FastAPI
from pydantic import BaseModel

from agents.orchestrator import Orchestrator

app = FastAPI()

# Initialize the Orchestrator
# Set use_vector_embeddings to True to use the more advanced RAG system
orchestrator = Orchestrator(use_vector_embeddings=False)

class AnalyzeRequest(BaseModel):
    feature_name: str
    description: str
    industry: str = "fintech"

@app.get("/")
def read_root():
    return {"message": "Viably Backend is running"}

@app.post("/api/analyze")
async def analyze_feature(request: AnalyzeRequest):
    """
    Analyzes a feature by running it through the Orchestrator agent.
    """
    result = orchestrator.analyze(
        feature_name=request.feature_name,
        feature_description=request.description,
        industry=request.industry
    )
    return result
