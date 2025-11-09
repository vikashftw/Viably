# Viably Backend - Product Sandbox War Game

**Multi-agent AI system for product feature analysis and competitive intelligence.**

---

## 🎯 Overview

This backend powers the Product Sandbox War Game - an AI-driven system that helps Product Managers test feature ideas before building them.

### Architecture

```
PM Input → Orchestrator → Engineer Agent + Competitor Agent → Strategic Report
                              ↓              ↓
                            RAG          Serper API
                         (Past Projects) (Web Search)
```

### Agents

1. **Engineer Agent** - Cost estimation using RAG over 20 past fintech projects
2. **Competitor Agent** - Market analysis using real-time Google search (Serper API)
3. **Orchestrator** - Multi-agent coordination and strategic synthesis

---

## 🚀 Quick Start

### 1. Installation

```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Setup

Create a `.env` file (copy from `.env.example`):

```bash
# NVIDIA API (Required)
NVIDIA_API_KEY=your_nvidia_api_key_here
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1

# Serper API (Required for Competitor Agent)
SERPER_API_KEY=your_serper_api_key_here

# Models
NEMOTRON_MODEL=nvidia/llama-3.1-nemotron-70b-instruct
EMBEDDINGS_MODEL=nvidia/nv-embedqa-e5-v5
```

### 3. Get API Keys

**NVIDIA API:**
1. Go to https://build.nvidia.com
2. Create free account
3. Click "Get API Key"
4. Copy key to `.env`

**Serper API:**
1. Go to https://serper.dev
2. Sign up for free account (10k searches)
3. Get API key from dashboard
4. Copy key to `.env`

### 4. Test the Agents

```bash
# Test with keyword matching (fast)
python test_agents.py

# Test with vector embeddings (requires NVIDIA API, more impressive)
python test_agents.py --embeddings
```

This will run 5 test cases and show you the full output from each agent.

---

## 📁 File Structure

```
backend/
├── agents/
│   ├── __init__.py
│   ├── base_agent.py           # Abstract agent class
│   ├── engineer_agent.py       # Cost estimation agent
│   ├── competitor_agent.py     # Market analysis agent
│   └── orchestrator.py         # Multi-agent coordinator
├── prompts/
│   ├── engineer_prompts.py     # Engineer Agent prompts
│   └── competitor_prompts.py   # Competitor Agent prompts
├── data/
│   ├── past_projects.json      # 20 fintech project examples
│   └── mock_competitors.json   # Fallback competitor data
├── utils/
│   ├── __init__.py
│   ├── rag.py                  # RAG system (keyword + vector)
│   └── search.py               # Serper API wrapper
├── test_agents.py              # Test script
├── requirements.txt            # Dependencies
├── .env.example                # Environment template
└── README.md                   # This file
```

---

## 🧪 Testing Individual Components

### Test Engineer Agent Only

```python
from agents.engineer_agent import EngineerAgent

agent = EngineerAgent(use_vector_embeddings=False)
result = agent.analyze(
    feature_name="Crypto Payments",
    feature_description="Add cryptocurrency payment support to checkout"
)

print(f"Cost: ${result['cost']:,}")
print(f"Hours: {result['hours']}")
print(f"Skills: {result['skills_required']}")
```

### Test Competitor Agent Only

```python
from agents.competitor_agent import CompetitorAgent

agent = CompetitorAgent()
result = agent.analyze(
    feature_name="Crypto Payments",
    feature_description="Add cryptocurrency payment support to checkout"
)

print(f"Risk Score: {result['risk_score']}/10")
print(f"Competitors: {len(result['competitors'])}")
```

### Test RAG System

```python
from utils.rag import RAGSystem

# Keyword matching
rag = RAGSystem(use_embeddings=False)
similar = rag.find_similar_projects("cryptocurrency payments", top_k=3)

for project in similar:
    print(f"- {project['feature_name']}: {project['hours_spent']} hours")
```

### Test Serper Search

```python
from utils.search import SerperSearch

search = SerperSearch()
results = search.search_competitors("cryptocurrency payments", industry="fintech")
print(results)
```

---

## 🔧 Integration with FastAPI

### Example FastAPI Endpoint

```python
from fastapi import FastAPI
from agents.orchestrator import Orchestrator

app = FastAPI()
orchestrator = Orchestrator(use_vector_embeddings=True)

@app.post("/api/analyze")
async def analyze_feature(request: dict):
    result = orchestrator.analyze(
        feature_name=request["feature_name"],
        feature_description=request["description"],
        industry=request.get("industry", "fintech")
    )
    return result
```

**Expected Input:**
```json
{
  "feature_name": "Crypto Payments",
  "description": "Add cryptocurrency payment support",
  "industry": "fintech"
}
```

**Expected Output:**
```json
{
  "feature_name": "Crypto Payments",
  "feature_description": "...",
  "cost_estimate": {
    "hours": 2880,
    "cost": 432000,
    "duration_weeks": 16,
    "team_size": 9,
    "skills_required": ["backend", "crypto", "security", ...],
    "complexity": "high",
    "confidence": 0.75,
    "breakdown": {...},
    "risks": [...],
    "assumptions": [...]
  },
  "competitive_analysis": {
    "competitors": [...],
    "risk_score": 8,
    "market_maturity": "growing",
    "time_to_replicate": "6-12 months",
    ...
  },
  "recommendation": {
    "decision": "proceed",
    "priority": "medium",
    "estimated_roi_months": "12-18 months",
    ...
  },
  "summary": "EXECUTIVE SUMMARY: ..."
}
```

---

## 🎛️ Configuration

### RAG Modes

**Keyword Matching (Default):**
- Fast, no API calls required
- Good for quick testing
- Uses Jaccard similarity

**Vector Embeddings:**
- Uses NVIDIA embeddings API
- Semantic search (more accurate)
- Slower but more impressive for judges

```python
# Keyword
orchestrator = Orchestrator(use_vector_embeddings=False)

# Vector embeddings
orchestrator = Orchestrator(use_vector_embeddings=True)
```

### Prompt Tuning

Edit prompts in `prompts/engineer_prompts.py` and `prompts/competitor_prompts.py`:
- Adjust temperature (0.0 = deterministic, 1.0 = creative)
- Modify system prompts for different personas
- Change output JSON schema

### Adding More Past Projects

Edit `data/past_projects.json`:
```json
{
  "project_id": "proj_021",
  "feature_name": "Your Feature",
  "description": "...",
  "hours_spent": 1000,
  "cost_usd": 150000,
  ...
}
```

---

## 🐛 Troubleshooting

### "NVIDIA API key not found"
- Make sure `.env` file exists in `backend/` directory
- Check that `NVIDIA_API_KEY=...` is set correctly
- Try: `python -c "import os; from dotenv import load_dotenv; load_dotenv(); print(os.getenv('NVIDIA_API_KEY'))"`

### "Serper API error"
- Verify API key is correct in `.env`
- Check you haven't exceeded free tier (10k searches)
- Fallback: System will use mock competitor data automatically

### "No similar projects found"
- Check that `data/past_projects.json` exists and is valid JSON
- Verify file path in `RAGSystem.__init__`

### "JSON parsing failed"
- LLM might be returning markdown code blocks
- Check prompt engineering in `prompts/` files
- Try lowering temperature (make more deterministic)

---

## 📊 Performance Benchmarks

**Keyword Matching Mode:**
- Engineer Agent: ~3-5 seconds
- Competitor Agent: ~5-7 seconds (with web search)
- Total: ~10-15 seconds per analysis

**Vector Embeddings Mode:**
- Engineer Agent: ~8-12 seconds (embedding generation)
- Competitor Agent: ~5-7 seconds
- Total: ~15-20 seconds per analysis

---

## 🔐 Security Notes

- **Never commit `.env`** - API keys are sensitive
- Rate limiting: NVIDIA has generous limits, Serper has 10k free searches
- Input validation: FastAPI should validate inputs before passing to agents
- Error handling: All agents have fallback behavior on failures

---

## 🚧 Known Limitations

1. **RAG Quality:** Only 20 past projects - more data = better estimates
2. **Web Search:** Dependent on Serper API availability
3. **LLM Determinism:** Responses may vary slightly between runs
4. **Cost Estimation:** Assumes $150/hour blended rate (adjust in prompts)

---

## 🎯 Next Steps (If Time Permits)

- [ ] Implement upskilling tracker (track engineer recommendations)
- [ ] Add caching for RAG embeddings (faster startup)
- [ ] Implement parallel agent execution (faster overall)
- [ ] Add unit tests for each component
- [ ] Create Dockerfile for easy deployment

---

## 📝 Person 2 (Backend Engineer) - Integration Guide

### What You Need From This Code

1. **Import the Orchestrator:**
   ```python
   from agents.orchestrator import Orchestrator
   ```

2. **Initialize Once (at startup):**
   ```python
   orchestrator = Orchestrator(use_vector_embeddings=True)
   ```

3. **Call from API endpoint:**
   ```python
   result = orchestrator.analyze(
       feature_name=request.feature_name,
       feature_description=request.description,
       industry=request.industry
   )
   return result
   ```

### API Contract

**Input Schema:**
```python
from pydantic import BaseModel

class AnalyzeRequest(BaseModel):
    feature_name: str
    description: str
    industry: str = "fintech"
```

**Output:** Returns dictionary with:
- `cost_estimate` (dict)
- `competitive_analysis` (dict)
- `recommendation` (dict)
- `summary` (str)

All error handling is built-in - won't crash, will return error info in response.

---

## 📞 Need Help?

**Person 3 (Agent Architect)** owns this code.

Quick tests:
```bash
# Test everything works
python test_agents.py

# Test individual agent
python -c "from agents.engineer_agent import EngineerAgent; a = EngineerAgent(); print(a.analyze('test feature'))"
```

---

**Built for NVIDIA + PNC Hackathon 2025**
**14-hour sprint | Multi-agent AI | Production-ready code**