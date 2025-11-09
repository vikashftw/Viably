# Output Schema

`POST /analyze` responds with JSON in this exact format:

{
  "feature_name": "string",

  "engineer_analysis": {
    "estimated_sprints": 0,          // int (2-week sprints)
    "estimated_engineers": 0,        // int
    "estimated_cost_usd": 0,         // int
    "key_risks": ["..."],            // list of strings
    "confidence": 0.0                // float 0-1
  },

  "competitor_analysis": {
    "key_competitors": ["..."],          // list of names
    "expected_response_time_sprints": 0, // int (2-week sprints)
    "response_play": "...",              // short description
    "competitive_risk_level": "LOW"      // one of: LOW | MEDIUM | HIGH
  },

  "overall_recommendation": {
    "summary": "...",              // 1–2 line high-level verdict
    "rationale": "...",            // why we recommend this
    "action_items": ["..."]        // concrete next steps
  },

  "upskilling_insights": {
    "bottleneck_skills": ["..."],  // skills/org gaps detected
    "suggested_training": ["..."]  // recommended learning items
  }
}

This shape is FIXED.
No extra keys.
Always return all sections.
