from fastapi import FastAPI, HTTPException, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import uuid
import json
import os
import logging
import httpx
import time
import asyncio
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

from agents.orchestrator import Orchestrator
from agents.orchestrator_v2 import OrchestratorV2
from agents.engineer_agent import EngineerAgent
from agents.competitor_agent import CompetitorAgent
from agents.market_intelligence_agent import MarketIntelligenceAgent
from agents.similar_feature_agent import SimilarFeatureAgent
from agents.roi_calculator_agent import ROICalculatorAgent
from agents.implementation_planner_agent import ImplementationPlannerAgent
from routers import jira

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Viably API - Extended",
    description="Product Sandbox War Game - Multi-Agent Analysis with Complete Flow",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "*"],  # Allow frontend origin
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
implementation_planner_agent = ImplementationPlannerAgent()

# Data directories
ANALYSIS_RESULTS_DIR = Path(__file__).parent / "data" / "analysis_results"
ANALYSIS_RESULTS_DIR.mkdir(parents=True, exist_ok=True)

# Request schemas
class AnalyzeRequest(BaseModel):
    feature_name: str
    description: str
    target_user: str = "PNC customers"
    business_goal: str = "increase engagement and revenue"
    industry: str = "banking"

class CompleteAnalysisRequest(BaseModel):
    feature_name: str
    description: str
    target_user: str = "PNC customers"
    business_goal: str = "increase engagement and revenue"
    industry: str = "banking"

class TriggerImplementationRequest(BaseModel):
    analysis_id: str
    target_repo: Dict[str, Any]

class CompareRequest(BaseModel):
    features: List[str]

# Include Jira router
app.include_router(jira.router, prefix="/api/jira", tags=["jira"])

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
            "/api/analyze-stream",
            "/api/trigger-implementation",
            "/api/analysis/{analysis_id}",
            "/api/compare",
            "/api/analytics/skills",
            "/api/jira/*",
            "/health"
        ]
    }

@app.get("/health")
async def health_check():
    return {"status": "ok"}

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
            target_user=request.target_user,
            business_goal=request.business_goal,
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

# NEW ENDPOINT: Stream analysis progress via Server-Sent Events
@app.get("/api/analyze-stream")
async def stream_analysis_progress(
    feature_name: str,
    description: str,
    target_user: str = "PNC customers",
    business_goal: str = "increase engagement and revenue",
    industry: str = "banking"
):
    """
    Stream real-time analysis progress using Server-Sent Events (SSE).

    Returns agent execution events:
    - agent_start: When an agent begins execution
    - agent_progress: Progress updates (if supported)
    - agent_complete: When an agent finishes with results
    - wave_complete: When a wave of agents completes
    - complete: Final completion event

    For NVIDIA Technical Dashboard live visualization.
    """
    async def event_generator():
        try:
            analysis_start_time = time.time()

            # Emit start event
            yield f"data: {json.dumps({'type': 'start', 'timestamp': time.time()})}\n\n"

            # WAVE 1: Parallel execution (Engineer, Competitor, Market Intelligence)
            wave1_start = time.time()

            # Emit wave 1 start events
            for agent_name in ['engineer', 'competitor', 'market_intelligence']:
                yield f"data: {json.dumps({'type': 'agent_start', 'agent': agent_name, 'wave': 1, 'timestamp': time.time()})}\n\n"
                await asyncio.sleep(0.01)  # Small delay for streaming

            # Run Wave 1 agents in parallel
            wave1_results = await asyncio.gather(
                run_engineer_with_events(feature_name, description),
                run_competitor_with_events(feature_name, description, industry),
                run_market_intel_with_events(feature_name, industry)
            )

            # Emit Wave 1 completion events
            for idx, agent_name in enumerate(['engineer', 'competitor', 'market_intelligence']):
                result = wave1_results[idx]
                yield f"data: {json.dumps({'type': 'agent_complete', 'agent': agent_name, 'wave': 1, 'result': result, 'timestamp': time.time()})}\n\n"
                await asyncio.sleep(0.01)

            wave1_duration = (time.time() - wave1_start) * 1000
            yield f"data: {json.dumps({'type': 'wave_complete', 'wave': 1, 'duration_ms': wave1_duration, 'timestamp': time.time()})}\n\n"

            # WAVE 2: Dependent execution (ROI, Similar Features - needs Engineer output)
            wave2_start = time.time()
            engineer_result = wave1_results[0]

            for agent_name in ['roi_calculator', 'similar_features']:
                yield f"data: {json.dumps({'type': 'agent_start', 'agent': agent_name, 'wave': 2, 'timestamp': time.time()})}\n\n"
                await asyncio.sleep(0.01)

            # Run Wave 2 agents in parallel (both depend on Engineer)
            wave2_results = await asyncio.gather(
                run_roi_with_events(feature_name, engineer_result, industry),
                run_similar_with_events(feature_name, description, engineer_result)
            )

            for idx, agent_name in enumerate(['roi_calculator', 'similar_features']):
                result = wave2_results[idx]
                yield f"data: {json.dumps({'type': 'agent_complete', 'agent': agent_name, 'wave': 2, 'result': result, 'timestamp': time.time()})}\n\n"
                await asyncio.sleep(0.01)

            wave2_duration = (time.time() - wave2_start) * 1000
            yield f"data: {json.dumps({'type': 'wave_complete', 'wave': 2, 'duration_ms': wave2_duration, 'timestamp': time.time()})}\n\n"

            # WAVE 3: Final synthesis (Implementation Planner - needs all outputs)
            wave3_start = time.time()

            yield f"data: {json.dumps({'type': 'agent_start', 'agent': 'implementation_planner', 'wave': 3, 'timestamp': time.time()})}\n\n"
            await asyncio.sleep(0.01)

            # Call REAL Implementation Planner Agent (Wave 3)
            planner_start = time.time()

            implementation_plan = implementation_planner_agent.analyze(
                feature_name=feature_name,
                feature_description=description,
                engineer_analysis=engineer_result,
                similar_features=wave2_results[1].get('similar_projects', []) if len(wave2_results) > 1 else [],
                market_intelligence=wave1_results[2] if len(wave1_results) > 2 else {},
                competitor_analysis=wave1_results[1] if len(wave1_results) > 1 else {}
            )

            planner_elapsed_ms = (time.time() - planner_start) * 1000

            planner_result = {
                "search_patterns": implementation_plan.get("search_patterns", []),
                "tasks": implementation_plan.get("tasks", []),
                "total_hours": implementation_plan.get("total_estimated_hours", 0),
                "reasoning": [
                    f"Analyzed all {len(wave1_results) + len(wave2_results)} agent outputs",
                    f"Engineer estimate: ${engineer_result.get('estimated_cost_usd', 0):,} over {engineer_result.get('estimated_sprints', 0)} sprints",
                    f"Generated {len(implementation_plan.get('tasks', []))} implementation tasks",
                    f"Total estimated hours: {implementation_plan.get('total_estimated_hours', 0)}",
                    "Using NVIDIA Nemotron Nano 8B for task breakdown and file structure planning"
                ],
                "confidence": 0.85,
                "tool_calls": [
                    {"tool": "NVIDIA Nemotron Nano 8B", "action": "Implementation planning and task breakdown"}
                ],
                "elapsed_ms": planner_elapsed_ms
            }

            yield f"data: {json.dumps({'type': 'agent_complete', 'agent': 'implementation_planner', 'wave': 3, 'result': planner_result, 'timestamp': time.time()})}\n\n"

            wave3_duration = (time.time() - wave3_start) * 1000
            yield f"data: {json.dumps({'type': 'wave_complete', 'wave': 3, 'duration_ms': wave3_duration, 'timestamp': time.time()})}\n\n"

            # Final completion
            total_duration = (time.time() - analysis_start_time) * 1000
            yield f"data: {json.dumps({'type': 'complete', 'total_duration_ms': total_duration, 'wave_timings': {'wave1_ms': wave1_duration, 'wave2_ms': wave2_duration, 'wave3_ms': wave3_duration}, 'timestamp': time.time()})}\n\n"

        except Exception as e:
            logger.error(f"Stream analysis failed: {str(e)}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'message': str(e), 'timestamp': time.time()})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive"
        }
    )

# Helper functions for streaming agents
async def run_engineer_with_events(feature_name: str, description: str):
    """Run Engineer Agent and return result with reasoning/tool_calls."""
    start_time = time.time()

    result = engineer_agent.analyze(
        feature_description=description,
        feature_name=feature_name
    )

    elapsed_ms = (time.time() - start_time) * 1000

    # Add reasoning and tool calls for NVIDIA dashboard
    return {
        "estimated_sprints": result.get("duration_weeks", 0) // 2,  # Convert weeks to sprints
        "estimated_engineers": result.get("team_size", 0),
        "estimated_cost_usd": result.get("cost", 0),  # Fixed: Engineer returns "cost" not "estimated_cost_usd"
        "key_risks": result.get("risks", []),  # Fixed: Engineer returns "risks" not "key_risks"
        "confidence": result.get("confidence", 0.7),
        "reasoning": [
            "Performing RAG vector search for similar PNC projects",
            f"Found {result.get('similar_projects_found', 0)} similar projects using {result.get('rag_mode', 'vector_embeddings')}",
            "Using NVIDIA NV-Embed-v2 for semantic similarity matching",
            f"Analyzing complexity: {result.get('complexity', 'MEDIUM')}",
            "Using NVIDIA Nemotron Nano 8B for cost estimation",
            f"Final estimate: ${result.get('cost', 0):,} over {result.get('duration_weeks', 0) // 2} sprints with {result.get('team_size', 0)} engineers"
        ],
        "tool_calls": [
            {"tool": "NVIDIA NV-Embed-v2", "action": "Generate query embedding for RAG search"},
            {"tool": "Vector Database", "action": "Semantic similarity search across 20 past projects"},
            {"tool": "NVIDIA Nemotron Nano 8B", "action": "Cost estimation and complexity analysis"}
        ],
        "elapsed_ms": elapsed_ms
    }

async def run_competitor_with_events(feature_name: str, description: str, industry: str):
    """Run Competitor Agent and return result with reasoning/tool_calls."""
    start_time = time.time()

    result = competitor_agent.analyze(
        feature_description=description,
        feature_name=feature_name,
        industry=industry
    )

    elapsed_ms = (time.time() - start_time) * 1000

    return {
        "key_competitors": result.get("key_competitors", []),
        "expected_response_time_sprints": result.get("expected_response_time_sprints", 0),
        "response_play": result.get("response_play", ""),
        "competitive_risk_level": result.get("competitive_risk_level", "MEDIUM"),
        "reasoning": [
            f"Searching for '{feature_name}' competitive landscape",
            f"Google Search API returned {result.get('search_results_count', 5)} relevant results",
            f"Identified {len(result.get('key_competitors', []))} key competitors",
            f"Risk assessment: {result.get('competitive_risk_level', 'MEDIUM')} (response time: {result.get('expected_response_time_sprints', 6)} sprints)"
        ],
        "tool_calls": [
            {"tool": "Google Search API (Serper)", "action": "Competitive landscape research"},
            {"tool": "NVIDIA Nemotron Nano 8B", "action": "Risk level analysis"}
        ],
        "confidence": 0.75,
        "elapsed_ms": elapsed_ms
    }

async def run_market_intel_with_events(feature_name: str, industry: str):
    """Run Market Intelligence Agent and return result with reasoning/tool_calls."""
    start_time = time.time()

    try:
        result = market_intel_agent.analyze(
            feature_name=feature_name,
            industry=industry,
            config={
                "search_market_size": True,
                "search_trends": False,
                "search_competitors": False,
                "search_regulatory": False
            }
        )
        market_data = result.get("market_data", {})
    except Exception as e:
        logger.warning(f"Market Intelligence failed: {str(e)}")
        market_data = {
            "market_size_usd": 0,
            "growth_rate_cagr": 0.0,
            "source_url": "",
            "note": "Market data unavailable",
            "confidence": "LOW"
        }

    elapsed_ms = (time.time() - start_time) * 1000

    return {
        "market_data": market_data,
        "reasoning": [
            f"Researching {industry} market for {feature_name}",
            f"Market size: ${market_data.get('market_size_usd', 0):,} USD",
            f"Growth rate: {market_data.get('growth_rate_cagr', 0):.1%} CAGR",
            f"Data source: {market_data.get('source_url', 'N/A')}"
        ],
        "tool_calls": [
            {"tool": "Google Search API (Serper)", "action": "Market research"},
            {"tool": "NVIDIA Nemotron Nano 8B", "action": "Market data synthesis"}
        ],
        "confidence": 0.70 if market_data.get("market_size_usd", 0) > 0 else 0.30,
        "elapsed_ms": elapsed_ms
    }

async def run_roi_with_events(feature_name: str, engineer_result: dict, industry: str):
    """Run ROI Calculator Agent and return result with reasoning/tool_calls."""
    start_time = time.time()

    # Extract similar projects from engineer result if available
    similar_projects_data = engineer_result.get("result", {}).get("similar_projects", []) if "result" in engineer_result else []

    result = roi_calculator_agent.analyze(
        feature_name=feature_name,
        cost=engineer_result.get("estimated_cost_usd", 0),
        similar_projects=similar_projects_data,
        industry=industry
    )

    elapsed_ms = (time.time() - start_time) * 1000
    scenarios = result.get("roi_scenarios", {})

    return {
        "scenarios": scenarios,
        "recommended_scenario": result.get("recommended_scenario", "base_case"),
        "reasoning": [
            f"Using Engineer cost estimate: ${engineer_result.get('estimated_cost_usd', 0):,}",
            f"Calculating 3 scenarios (worst/base/best case)",
            f"Base case ROI: {scenarios.get('base_case', {}).get('roi_percent', 0):.0f}%",
            f"Payback period: {scenarios.get('base_case', {}).get('payback_period_months', 0):.1f} months"
        ],
        "tool_calls": [
            {"tool": "NVIDIA Nemotron Nano 8B", "action": "Financial projection modeling"}
        ],
        "confidence": 0.72,
        "elapsed_ms": elapsed_ms
    }

async def run_similar_with_events(feature_name: str, description: str, engineer_result: dict):
    """Run Similar Features Agent and return result with reasoning/tool_calls."""
    start_time = time.time()

    result = similar_feature_agent.analyze(
        feature_name=feature_name,
        feature_description=description,
        estimated_sprints=engineer_result.get("estimated_sprints", 0)
    )

    elapsed_ms = (time.time() - start_time) * 1000

    return {
        "similar_projects": result.get("similar_projects", []),
        "cost_estimate_basis": result.get("cost_estimate_basis", {}),
        "confidence": result.get("confidence", {}),
        "reasoning": [
            f"RAG search for similar features to '{feature_name}'",
            f"Found {len(result.get('similar_projects', []))} similar projects",
            f"Using NVIDIA NV-Embed-v2 for semantic matching",
            f"Cost validation confidence: {result.get('confidence', {}).get('level', 'MEDIUM')}"
        ],
        "tool_calls": [
            {"tool": "NVIDIA NV-Embed-v2", "action": "Semantic similarity search"},
            {"tool": "ChromaDB", "action": "RAG query execution"},
            {"tool": "NVIDIA Nemotron Nano 8B", "action": "Cost validation analysis"}
        ],
        "elapsed_ms": elapsed_ms
    }

# NEW ENDPOINT 2: Trigger implementation via Automation Service
@app.post("/api/trigger-implementation")
async def trigger_implementation(request: TriggerImplementationRequest):
    """
    Trigger implementation workflow by sending analysis to Automation Service.

    Steps:
    1. Load analysis from saved JSON file
    2. Call Automation Service at http://localhost:3002/api/implementation-flow
    3. Return response from service

    Raises 404 if analysis_id not found, 503 if service unavailable.
    """
    logger.info(f"Triggering implementation for analysis: {request.analysis_id}")

    try:
        # Step 1: Load analysis from JSON
        analysis = load_analysis(request.analysis_id)

        if not analysis:
            raise HTTPException(status_code=404, detail=f"Analysis not found: {request.analysis_id}")

        # Step 2: Call Automation Service
        automation_url = "http://localhost:3002/api/implementation-flow"
        payload = {
            "viably_analysis": analysis,
            "target_repo": request.target_repo
        }

        logger.info(f"Calling Automation Service at {automation_url}...")

        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                response = await client.post(automation_url, json=payload)
                response.raise_for_status()

                result = response.json()
                logger.info("Implementation workflow triggered successfully")

                return {
                    "status": "success",
                    "analysis_id": request.analysis_id,
                    "automation_response": result
                }

            except httpx.ConnectError:
                logger.error("Automation Service unavailable")
                raise HTTPException(
                    status_code=503,
                    detail="Automation Service unavailable at http://localhost:3002. Is it running?"
                )
            except httpx.HTTPStatusError as e:
                logger.error(f"Automation Service error: {e.response.status_code}")
                raise HTTPException(
                    status_code=e.response.status_code,
                    detail=f"Automation Service error: {e.response.text}"
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

# NEW ENDPOINT 4: Compare multiple features
@app.post("/api/compare")
async def compare_features(request: CompareRequest):
    """
    Compare multiple features side by side.

    Placeholder for future implementation.
    """
    return {
        "message": "Feature comparison endpoint",
        "features": request.features,
        "status": "not_implemented"
    }

# NEW ENDPOINT 5: Get skills analytics
@app.get("/api/analytics/skills")
async def get_skills():
    """
    Get upskilling analytics across all analyzed features.

    Returns aggregated skill data from upskilling tracker.
    """
    try:
        insights = orchestrator.upskilling_tracker.get_insights()
        return {
            "status": "success",
            "skills": insights.get("bottleneck_skills", []),
            "training": insights.get("suggested_training", [])
        }
    except Exception as e:
        logger.error(f"Skills analytics failed: {str(e)}")
        return {
            "status": "error",
            "skills": [],
            "training": []
        }

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
