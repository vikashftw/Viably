# Viably
# this is the format for getting the input from the Product manager (in this same field format) that would be used by the agents to analyse the market.
{
  "feature_name": "Buy Now, Pay Later (BNPL)",
  "description": "Let users split payments into installments directly at checkout.",
  "target_user": "Online shoppers in the US",
  "business_goal": "Increase checkout conversion and average order value"
}



# Below is the output format in which data would be provided by the agents used for doing market research about the input product

{
  "feature_name": "string",
  "engineer_analysis": {
    "estimated_sprints": 0,
    "estimated_engineers": 0,
    "estimated_cost_usd": 0,
    "key_risks": [],
    "confidence": 0.0
  },
  "competitor_analysis": {
    "key_competitors": [],
    "expected_response_time_sprints": 0,
    "response_play": "",
    "competitive_risk_level": "LOW"
  },
  "overall_recommendation": {
    "summary": "",
    "rationale": "",
    "action_items": []
  },
  "upskilling_insights": {
    "bottleneck_skills": [],
    "suggested_training": []
  }
}
 - AI Product Sandbox War Game

**NVIDIA + PNC Hackathon Project**

## Quick Start

1. **Backend** (port 8000):
```bash
cd backend
python main.py
```

2. **Automation Service** (port 3002):
```bash
cd automation-service
npm start
```

3. **Frontend** (port 3000):
```bash
cd frontend
npm run dev
```

## Demo
- Input feature → 6 AI agents analyze (10s) → Generate PR (25s) → GitHub PR created (5s)
- **Total: ~40 seconds from idea to working PR**

## Documentation
- See `CLAUDE.md` for complete project details
- Each service has its own README with setup instructions

---
Built by ULTRATHINK Multi-Agent System