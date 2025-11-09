# 🔧 INTEGRATION TODO - Person 2 (Backend Engineer)

**Date:** 2025-11-08
**Status:** ✅ Pull successful - No conflicts!
**Your current code:** `backend/main.py` using `Orchestrator` (old version)

---

## ⚠️ CRITICAL ISSUE FOUND

**Problem:** You're using `Orchestrator` (old) instead of `OrchestratorV2` (merged schema)

**In your `main.py` line 4:**
```python
from agents.orchestrator import Orchestrator  # ❌ OLD VERSION
```

**Should be:**
```python
from agents.orchestrator_v2 import OrchestratorV2  # ✅ CORRECT VERSION
```

**Why this matters:**
- `OrchestratorV2` has the merged schema Person 4 created
- It matches the output format in `CLAUDE.md`
- `Orchestrator` (old) has different output structure

---

## 🔄 QUICK FIX (5 minutes)

Replace your entire `backend/main.py` with this:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agents.orchestrator_v2 import OrchestratorV2  # CHANGED: V2

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
orchestrator = OrchestratorV2(use_vector_embeddings=True)

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

**Test it:**
```bash
cd backend
uvicorn main:app --reload

# In another terminal:
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "feature_name": "Smart Branch Connect",
    "description": "Hybrid banking experience",
    "industry": "banking"
  }'
```

---

## 🆕 NEW AGENTS TO INTEGRATE (Choose Your Approach)

You have **3 new agents** ready to integrate:
1. **Market Intelligence Agent** - Real-time market research
2. **Similar Feature Analyzer** - RAG explainability
3. **ROI Calculator** - Multi-scenario projections

### **OPTION A: Extend OrchestratorV2** (Recommended - Easiest)

Add new agents to existing orchestrator so everything comes back in one API call.

**File:** `backend/agents/orchestrator_v2.py`

**Add these imports at the top:**
```python
from agents.market_intelligence_agent import MarketIntelligenceAgent
from agents.similar_feature_agent import SimilarFeatureAgent
from agents.roi_calculator_agent import ROICalculatorAgent
```

**In `__init__` method, add:**
```python
def __init__(self, use_vector_embeddings: bool = True):
    # Existing agents
    self.engineer_agent = EngineerAgent(use_vector_embeddings)
    self.competitor_agent = CompetitorAgent()
    self.upskilling = UpskillingTracker()

    # NEW AGENTS
    self.market_intel = MarketIntelligenceAgent()
    self.similar_features = SimilarFeatureAgent(use_vector_embeddings)
    self.roi_calculator = ROICalculatorAgent()
```

**In `analyze` method, add (after existing analysis):**
```python
def analyze(self, feature_name, feature_description, ...):
    # Existing analysis
    engineer_result = self.engineer_agent.analyze(...)
    competitor_result = self.competitor_agent.analyze(...)

    # NEW: Market intelligence
    market_intel_result = self.market_intel.analyze(
        feature_name=feature_name,
        industry=industry,
        config={
            "search_market_size": True,
            "search_competitors": True  # Optional: set to False to save tokens
        }
    )

    # NEW: Similar features (adds transparency to engineer estimate)
    similar_features_result = self.similar_features.analyze(
        feature_name=feature_name,
        feature_description=feature_description,
        estimated_sprints=engineer_result["estimated_sprints"]
    )

    # NEW: ROI calculation
    roi_result = self.roi_calculator.analyze(
        feature_name=feature_name,
        cost=engineer_result["estimated_cost_usd"],
        similar_projects=similar_features_result["similar_projects"],
        target_users=6_000_000,  # 10% of PNC's 60M customers
        industry=industry
    )

    # Add to final result
    result = {
        "feature_name": feature_name,
        "engineer_analysis": engineer_result,
        "competitor_analysis": competitor_result,
        "overall_recommendation": recommendation,
        "upskilling_insights": upskilling_result,

        # NEW SECTIONS
        "market_intelligence": market_intel_result,
        "similar_features": similar_features_result,
        "roi_projections": roi_result
    }

    return result
```

**Pros:**
- One API call gets everything
- Frontend gets all data at once
- Backward compatible (existing fields still work)

**Cons:**
- Longer response time (~15-25 seconds total)
- More tokens used per request
- Can't selectively disable new agents easily

---

### **OPTION B: Separate Endpoints** (More Flexible)

Create dedicated endpoints for each new agent.

**Add to `backend/main.py`:**

```python
from agents.market_intelligence_agent import MarketIntelligenceAgent
from agents.similar_feature_agent import SimilarFeatureAgent
from agents.roi_calculator_agent import ROICalculatorAgent

# Initialize new agents
market_intel = MarketIntelligenceAgent()
similar_features_agent = SimilarFeatureAgent(use_vector_embeddings=False)
roi_calculator = ROICalculatorAgent()

# Pydantic models
class MarketIntelRequest(BaseModel):
    feature_name: str
    industry: str = "banking"

class SimilarFeaturesRequest(BaseModel):
    feature_name: str
    feature_description: str
    estimated_sprints: int = 12

class ROIRequest(BaseModel):
    feature_name: str
    cost: int
    similar_projects: list = []
    target_users: int = 6_000_000
    industry: str = "banking"

# NEW ENDPOINTS
@app.post("/api/market-intelligence")
async def get_market_intel(request: MarketIntelRequest):
    """Get real-time market research data."""
    return market_intel.analyze(
        feature_name=request.feature_name,
        industry=request.industry,
        config={
            "search_market_size": True,
            "search_competitors": True
        }
    )

@app.post("/api/similar-features")
async def get_similar_features(request: SimilarFeaturesRequest):
    """Find similar PNC projects with explainability."""
    return similar_features_agent.analyze(
        feature_name=request.feature_name,
        feature_description=request.feature_description,
        estimated_sprints=request.estimated_sprints
    )

@app.post("/api/roi-projections")
async def calculate_roi(request: ROIRequest):
    """Calculate ROI with multiple scenarios."""
    return roi_calculator.analyze(
        feature_name=request.feature_name,
        cost=request.cost,
        similar_projects=request.similar_projects,
        target_users=request.target_users,
        industry=request.industry
    )
```

**Test the new endpoints:**
```bash
# Market Intelligence
curl -X POST http://localhost:8000/api/market-intelligence \
  -H "Content-Type: application/json" \
  -d '{"feature_name": "Smart Branch Connect", "industry": "banking"}'

# Similar Features
curl -X POST http://localhost:8000/api/similar-features \
  -H "Content-Type: application/json" \
  -d '{"feature_name": "Smart Branch", "feature_description": "Hybrid banking"}'

# ROI Projections
curl -X POST http://localhost:8000/api/roi-projections \
  -H "Content-Type: application/json" \
  -d '{"feature_name": "Smart Branch", "cost": 864000}'
```

**Pros:**
- Modular - frontend can call only what it needs
- Faster individual responses
- Token efficient (only pay for what you use)
- Can test each agent independently

**Cons:**
- Multiple API calls from frontend
- Frontend needs to orchestrate the calls
- More complex integration

---

## 📋 MY RECOMMENDATION

**For Hackathon Demo: Use OPTION A (Extend OrchestratorV2)**

**Why:**
- Easier for Person 1 (frontend) - just one API call
- Shows full system capability in one response
- Judges see everything at once
- Less code for Person 1 to write

**Implementation time:** ~30 minutes

**After hackathon:** Refactor to Option B for production flexibility

---

## 🧪 TESTING CHECKLIST

After integration, test these:

### Test 1: Core Analysis (Existing)
```bash
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "feature_name": "Smart Branch Connect",
    "description": "Hybrid banking experience connecting digital and in-branch",
    "target_user": "PNC customers",
    "industry": "banking"
  }'
```

**Expected:** JSON with `engineer_analysis`, `competitor_analysis`, `overall_recommendation`, `upskilling_insights`

### Test 2: With New Agents (If using Option A)
Same request as above should now also return:
- `market_intelligence`
- `similar_features`
- `roi_projections`

### Test 3: Health Check
```bash
curl http://localhost:8000/
```

**Expected:** `{"status": "healthy", ...}`

### Test 4: Response Time
- Without new agents: ~8-12 seconds
- With new agents: ~15-25 seconds
- **If >30 seconds:** Consider making some agents optional

---

## ⚡ PERFORMANCE OPTIMIZATION (Optional)

If response time is too slow, make new agents optional:

```python
class AnalyzeRequest(BaseModel):
    feature_name: str
    description: str
    target_user: str = "PNC customers"
    business_goal: str = "increase engagement"
    industry: str = "banking"

    # NEW: Optional flags
    include_market_intel: bool = True
    include_similar_features: bool = True
    include_roi: bool = True

@app.post("/api/analyze")
async def analyze_feature(request: AnalyzeRequest):
    result = orchestrator.analyze(...)

    # Conditionally add new agents
    if request.include_market_intel:
        result["market_intelligence"] = market_intel.analyze(...)

    if request.include_similar_features:
        result["similar_features"] = similar_features.analyze(...)

    if request.include_roi:
        result["roi_projections"] = roi_calculator.analyze(...)

    return result
```

---

## 📊 EXPECTED OUTPUT STRUCTURE

With all agents integrated, the response should look like:

```json
{
  "feature_name": "Smart Branch Connect",

  "engineer_analysis": {
    "estimated_sprints": 12,
    "estimated_engineers": 8,
    "estimated_cost_usd": 864000,
    "key_risks": [...],
    "confidence": 0.75
  },

  "competitor_analysis": {
    "key_competitors": ["Chase", "BofA", "Wells Fargo"],
    "expected_response_time_sprints": 6,
    "competitive_risk_level": "MEDIUM"
  },

  "overall_recommendation": {
    "summary": "PROCEED",
    "rationale": "...",
    "action_items": [...]
  },

  "upskilling_insights": {
    "bottleneck_skills": ["mobile", "security"],
    "suggested_training": [...]
  },

  "market_intelligence": {
    "market_data": {
      "market_size_usd": 470940000000,
      "growth_rate_cagr": 0.124,
      "source_url": "https://..."
    },
    "competitor_news": [...]
  },

  "similar_features": {
    "similar_projects": [
      {
        "name": "Mobile Accept",
        "similarity_score": 0.85,
        "cost": 384000,
        "why_similar": "Both mobile-first..."
      }
    ],
    "cost_estimate_basis": {
      "formula": "...",
      "final_estimate": 542478
    },
    "confidence": {
      "score": 0.78,
      "level": "HIGH"
    }
  },

  "roi_projections": {
    "roi_scenarios": {
      "worst_case": {"roi_percent": 665.6, ...},
      "base_case": {"roi_percent": 1097.9, ...},
      "best_case": {"roi_percent": 1475.0, ...}
    }
  }
}
```

---

## 🐛 COMMON ISSUES & FIXES

### Issue 1: Import Error
```
ImportError: cannot import name 'MarketIntelligenceAgent'
```

**Fix:** Make sure you're in the `backend/` directory when running
```bash
cd backend
python -c "from agents.market_intelligence_agent import MarketIntelligenceAgent; print('OK')"
```

### Issue 2: Missing .env
```
SERPER_API_KEY not found
```

**Fix:** `.env` file exists but may not be loaded. Check it's in `backend/.env`

### Issue 3: Slow Response
```
Request takes >30 seconds
```

**Fix:** Disable optional agents or use Option B (separate endpoints)

### Issue 4: Vector Embeddings Error
```
'input_type' parameter is required for asymmetric models
```

**Fix:** Set `use_vector_embeddings=False` for now:
```python
orchestrator = OrchestratorV2(use_vector_embeddings=False)
similar_features = SimilarFeatureAgent(use_vector_embeddings=False)
```

---

## 📚 HELPFUL FILES

- **Integration guide:** `backend/AGENT_INTEGRATION_GUIDE.md` (detailed examples)
- **Agent code:**
  - `backend/agents/market_intelligence_agent.py`
  - `backend/agents/similar_feature_agent.py`
  - `backend/agents/roi_calculator_agent.py`
- **Test standalone:** Run each agent's file directly to test

---

## ✅ DONE CRITERIA

You're done when:
- [ ] Using `OrchestratorV2` (not `Orchestrator`)
- [ ] `/api/analyze` returns all sections including new agents
- [ ] Response time is <25 seconds
- [ ] No errors in console
- [ ] Person 1 can call API and get expected JSON structure

---

## 🚀 NEXT STEPS AFTER INTEGRATION

1. **Test with Person 1** - Share API URL and output schema
2. **Update README** - Document new response fields
3. **Optional:** Add analytics endpoint using saved JSON files
4. **Optional:** Add rate limiting to prevent API abuse
5. **Demo prep:** Practice showing the enhanced analysis

---

**Questions?** Check `AGENT_INTEGRATION_GUIDE.md` or ask Person 3 (Agent Architect)

**Estimated integration time:** 30-60 minutes

**Current status:** Your basic FastAPI works ✅, just need to swap to V2 and add new agents!
