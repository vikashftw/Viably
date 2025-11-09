from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import uuid
import json
import os
import logging
import httpx
from pathlib import Path

from agents.orchestrator_v2 import OrchestratorV2
from agents.engineer_agent import EngineerAgent
from agents.competitor_agent import CompetitorAgent
from agents.market_intelligence_agent import MarketIntelligenceAgent
from agents.similar_feature_agent import SimilarFeatureAgent
from agents.roi_calculator_agent import ROICalculatorAgent

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Viably API - Extended",
    description="Product Sandbox War Game - Multi-Agent Analysis with Complete Flow",
    version="2.0.0"
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize agents once at startup
orchestrator = OrchestratorV2(use_vector_embeddings=True)
engineer_agent = EngineerAgent(use_vector_embeddings=True)
competitor_agent = CompetitorAgent()
market_intel_agent = MarketIntelligenceAgent()
similar_feature_agent = SimilarFeatureAgent(use_vector_embeddings=True)
roi_calculator_agent = ROICalculatorAgent()

# Data directories
ANALYSIS_RESULTS_DIR = Path(__file__).parent / "data" / "analysis_results"
ANALYSIS_RESULTS_DIR.mkdir(parents=True, exist_ok=True)

# Request schemas
class AnalyzeRequest(BaseModel):
    feature_name: str
    description: str
    industry: str = "fintech"

class CompleteAnalysisRequest(BaseModel):
    feature_name: str
    description: str
    target_user: str = "PNC customers"
    business_goal: str = "increase engagement and revenue"
    industry: str = "banking"

class TriggerImplementationRequest(BaseModel):
    analysis_id: str
    target_repo: Dict[str, Any]

# Health check
@app.get("/")
async def root():
    return {
        "status": "healthy",
        "service": "Viably Product Sandbox API - Extended",
        "version": "2.0.0",
        "agents": [
            "Engineer Agent",
            "Competitor Agent",
            "Market Intelligence Agent",
            "Similar Feature Agent",
            "ROI Calculator Agent",
            "OrchestratorV2"
        ],
        "endpoints": [
            "/api/analyze",
            "/api/analyze-complete",
            "/api/trigger-implementation",
            "/api/analysis/{analysis_id}"
        ]
    }

# Original endpoint - kept for backward compatibility
@app.post("/api/analyze")
async def analyze_feature(request: AnalyzeRequest):
    """
    Basic analysis using OrchestratorV2 (Engineer + Competitor + Recommendation + Upskilling).

    This is the original endpoint - kept for backward compatibility.
    """
    try:
        result = orchestrator.analyze(
            feature_name=request.feature_name,
            feature_description=request.description,
            industry=request.industry
        )
        return result
    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

# NEW ENDPOINT 1: Complete analysis with all agents
@app.post("/api/analyze-complete")
async def analyze_complete(request: CompleteAnalysisRequest):
    """
    Run ALL agents in parallel and return comprehensive analysis.

    Includes:
    - Engineer Analysis (cost, sprints, risks)
    - Competitor Analysis (competitive landscape)
    - Market Intelligence (market size, trends)
    - Similar Feature Analysis (RAG explainability)
    - ROI Calculator (multi-scenario projections)
    - Overall Recommendation (strategic guidance)
    - Upskilling Insights (skill bottlenecks)

    Saves complete analysis to JSON file with unique ID for later retrieval.
    """
    analysis_id = str(uuid.uuid4())
    logger.info(f"Starting complete analysis for '{request.feature_name}' (ID: {analysis_id})")

    try:
        # Step 1: Run Engineer Agent
        logger.info("Step 1/5: Running Engineer Agent...")
        engineer_result = engineer_agent.analyze(
            feature_description=request.description,
            feature_name=request.feature_name
        )

        engineer_analysis = {
            "estimated_sprints": engineer_result.get("estimated_sprints", 0),
            "estimated_engineers": engineer_result.get("estimated_engineers", 0),
            "estimated_cost_usd": engineer_result.get("estimated_cost_usd", 0),
            "key_risks": engineer_result.get("key_risks", []),
            "confidence": engineer_result.get("confidence", 0.7)
        }

        # Step 2: Run Competitor Agent
        logger.info("Step 2/5: Running Competitor Agent...")
        competitor_result = competitor_agent.analyze(
            feature_description=request.description,
            feature_name=request.feature_name,
            industry=request.industry
        )

        competitor_analysis = {
            "key_competitors": competitor_result.get("key_competitors", []),
            "expected_response_time_sprints": competitor_result.get("expected_response_time_sprints", 0),
            "response_play": competitor_result.get("response_play", ""),
            "competitive_risk_level": competitor_result.get("competitive_risk_level", "MEDIUM")
        }

        # Step 3: Run Market Intelligence Agent (minimal config for speed)
        logger.info("Step 3/5: Running Market Intelligence Agent...")
        try:
            market_result = market_intel_agent.analyze(
                feature_name=request.feature_name,
                industry=request.industry,
                config={
                    "search_market_size": True,
                    "search_trends": False,  # Disabled to save time/tokens
                    "search_competitors": False,
                    "search_regulatory": False
                }
            )
        except Exception as e:
            logger.warning(f"Market Intelligence failed: {str(e)}, using fallback")
            market_result = {
                "market_data": {
                    "market_size_usd": 0,
                    "growth_rate_cagr": 0.0,
                    "source_url": "",
                    "note": "Market data unavailable",
                    "confidence": "LOW"
                }
            }

        # Step 4: Run Similar Feature Agent
        logger.info("Step 4/5: Running Similar Feature Agent...")
        similar_result = similar_feature_agent.analyze(
            feature_name=request.feature_name,
            feature_description=request.description,
            estimated_sprints=engineer_analysis["estimated_sprints"]
        )

        # Step 5: Run ROI Calculator Agent
        logger.info("Step 5/5: Running ROI Calculator Agent...")
        roi_result = roi_calculator_agent.analyze(
            feature_name=request.feature_name,
            cost=engineer_analysis["estimated_cost_usd"],
            similar_projects=similar_result.get("similar_projects", []),
            industry=request.industry
        )

        # Generate overall recommendation (using OrchestratorV2 logic)
        recommendation = orchestrator._generate_recommendation(
            feature_name=request.feature_name,
            engineer_analysis=engineer_analysis,
            competitor_analysis=competitor_analysis,
            business_goal=request.business_goal
        )

        # Get upskilling insights
        inferred_skills = orchestrator._infer_skills_from_feature(request.description)
        orchestrator.upskilling_tracker.track_skills(inferred_skills)
        upskilling_insights = orchestrator.upskilling_tracker.get_insights()

        # Combine all results
        complete_analysis = {
            "analysis_id": analysis_id,
            "feature_name": request.feature_name,
            "description": request.description,
            "target_user": request.target_user,
            "business_goal": request.business_goal,
            "industry": request.industry,
            "engineer_analysis": engineer_analysis,
            "competitor_analysis": competitor_analysis,
            "market_intelligence": market_result.get("market_data", {}),
            "similar_features": {
                "similar_projects": similar_result.get("similar_projects", []),
                "cost_estimate_basis": similar_result.get("cost_estimate_basis", {}),
                "confidence": similar_result.get("confidence", {})
            },
            "roi_projections": {
                "scenarios": roi_result.get("roi_scenarios", {}),
                "recommended_scenario": roi_result.get("recommended_scenario", "base_case"),
                "calculation_basis": roi_result.get("calculation_basis", ""),
                "assumptions": roi_result.get("explicit_assumptions", [])
            },
            "overall_recommendation": recommendation,
            "upskilling_insights": upskilling_insights
        }

        # Save to JSON file
        save_analysis(analysis_id, complete_analysis)

        logger.info(f"Complete analysis finished (ID: {analysis_id})")

        return complete_analysis

    except Exception as e:
        logger.error(f"Complete analysis failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Complete analysis failed: {str(e)}")

# NEW ENDPOINT 2: Trigger implementation via Postman AI Service
@app.post("/api/trigger-implementation")
async def trigger_implementation(request: TriggerImplementationRequest):
    """
    Trigger implementation workflow by sending analysis to Postman AI Service.

    Steps:
    1. Load analysis from saved JSON file
    2. Call Postman AI Service at http://localhost:3002/api/implementation-flow
    3. Return response from Postman service

    Raises 404 if analysis_id not found, 503 if Postman service unavailable.
    """
    logger.info(f"Triggering implementation for analysis: {request.analysis_id}")

    try:
        # Step 1: Load analysis from JSON
        analysis = load_analysis(request.analysis_id)

        if not analysis:
            raise HTTPException(status_code=404, detail=f"Analysis not found: {request.analysis_id}")

        # Step 2: Call Postman AI Service
        postman_url = "http://localhost:3002/api/implementation-flow"
        payload = {
            "viably_analysis": analysis,
            "target_repo": request.target_repo
        }

        logger.info(f"Calling Postman service at {postman_url}...")

        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                response = await client.post(postman_url, json=payload)
                response.raise_for_status()

                result = response.json()
                logger.info("Implementation workflow triggered successfully")

                return {
                    "status": "success",
                    "analysis_id": request.analysis_id,
                    "postman_response": result
                }

            except httpx.ConnectError:
                logger.error("Postman service unavailable")
                raise HTTPException(
                    status_code=503,
                    detail="Postman AI Service unavailable at http://localhost:3002. Is it running?"
                )
            except httpx.HTTPStatusError as e:
                logger.error(f"Postman service error: {e.response.status_code}")
                raise HTTPException(
                    status_code=e.response.status_code,
                    detail=f"Postman service error: {e.response.text}"
                )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Implementation trigger failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Implementation trigger failed: {str(e)}")

# NEW ENDPOINT 3: Retrieve analysis by ID
@app.get("/api/analysis/{analysis_id}")
async def get_analysis(analysis_id: str):
    """
    Retrieve saved analysis by ID.

    Returns the complete analysis JSON that was previously saved.
    Raises 404 if analysis_id not found.
    """
    logger.info(f"Retrieving analysis: {analysis_id}")

    try:
        analysis = load_analysis(analysis_id)

        if not analysis:
            raise HTTPException(status_code=404, detail=f"Analysis not found: {analysis_id}")

        return analysis

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve analysis: {str(e)}")

# Helper functions
def save_analysis(analysis_id: str, data: Dict[str, Any]) -> None:
    """
    Save analysis to JSON file.

    Args:
        analysis_id: Unique analysis identifier (UUID)
        data: Complete analysis dictionary
    """
    filepath = ANALYSIS_RESULTS_DIR / f"{analysis_id}.json"

    try:
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)

        logger.info(f"Analysis saved to: {filepath}")

    except Exception as e:
        logger.error(f"Failed to save analysis: {str(e)}")
        raise

def load_analysis(analysis_id: str) -> Optional[Dict[str, Any]]:
    """
    Load analysis from JSON file.

    Args:
        analysis_id: Unique analysis identifier (UUID)

    Returns:
        Analysis dictionary or None if not found
    """
    filepath = ANALYSIS_RESULTS_DIR / f"{analysis_id}.json"

    if not filepath.exists():
        logger.warning(f"Analysis not found: {analysis_id}")
        return None

    try:
        with open(filepath, 'r') as f:
            data = json.load(f)

        logger.info(f"Analysis loaded from: {filepath}")
        return data

    except Exception as e:
        logger.error(f"Failed to load analysis: {str(e)}")
        return None

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)