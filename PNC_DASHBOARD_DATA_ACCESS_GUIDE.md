# 🎯 PNC DASHBOARD DATA ACCESS GUIDE

**For: Teammates Building PNC Business Dashboard**
**Last Updated:** 2025-11-09
**Backend URL:** `http://localhost:8000`

---

## 📊 OVERVIEW

The NVIDIA dashboard consumes data from the **same backend APIs** that you'll use for the PNC dashboard. This guide shows you EXACTLY how to get all the analysis data.

### Data Flow Architecture:
```
User Input (Feature Name + Description)
    ↓
POST /api/analyze-complete
    ↓
Backend runs 6 AI agents in parallel
    ↓
Returns Complete Analysis JSON
    ↓
Saved to: backend/data/analysis_results/{uuid}.json
    ↓
Your PNC Dashboard displays the data
```

---

## 🔌 AVAILABLE API ENDPOINTS

### 1. **POST /api/analyze-complete** ⭐ PRIMARY ENDPOINT
**Purpose:** Run complete analysis and get ALL data at once
**When to use:** When user submits a new feature for analysis
**Response time:** 15-35 seconds (real AI processing)

#### Request Format:
```typescript
// TypeScript interface
interface AnalyzeRequest {
  feature_name: string;
  description: string;
  target_user?: string;        // Default: "PNC customers"
  business_goal?: string;       // Default: "increase engagement and revenue"
  industry?: string;            // Default: "banking"
}
```

#### Example Request:
```typescript
const response = await fetch('http://localhost:8000/api/analyze-complete', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    feature_name: 'Smart Branch Connect',
    description: 'Hybrid banking experience connecting digital and in-branch services with pre-populated customer data',
    target_user: 'PNC retail customers',
    business_goal: 'increase branch traffic and digital engagement',
    industry: 'banking'
  })
});

const data = await response.json();
console.log('Analysis ID:', data.analysis_id);
console.log('Complete Results:', data);
```

#### Complete Response Structure:
```typescript
interface CompleteAnalysisResponse {
  analysis_id: string;              // UUID for retrieval later
  feature_name: string;
  description: string;
  target_user: string;
  business_goal: string;
  industry: string;

  // 1️⃣ ENGINEER ANALYSIS
  engineer_analysis: {
    estimated_sprints: number;      // e.g., 12
    estimated_engineers: number;    // e.g., 8
    estimated_cost_usd: number;     // e.g., 864000
    key_risks: string[];            // e.g., ["Integration complexity", "Security review delays"]
    confidence: number;             // e.g., 0.85
  };

  // 2️⃣ COMPETITOR ANALYSIS
  competitor_analysis: {
    key_competitors: string[];      // e.g., ["Chase", "Bank of America", "Wells Fargo"]
    expected_response_time_sprints: number;  // e.g., 6
    response_play: string;          // e.g., "fast_follower"
    competitive_risk_level: "LOW" | "MEDIUM" | "HIGH";
  };

  // 3️⃣ MARKET INTELLIGENCE
  market_intelligence: {
    market_size_usd: number;        // e.g., 47000000000 ($47B)
    growth_rate_cagr: number;       // e.g., 0.12 (12%)
    source_url: string;             // Actual Google search result URL
    source_title: string;
    note: string;
    confidence: "LOW" | "MEDIUM" | "HIGH";
  };

  // 4️⃣ SIMILAR FEATURES
  similar_features: {
    similar_projects: Array<{
      name: string;                 // e.g., "Mobile Accept"
      similarity_score: number;     // e.g., 0.87
      hours_spent: number;
      cost_usd: number;
      team_size: number;
      adoption_rate: number;        // e.g., 0.42 (42%)
      outcome: "success" | "partial_success" | "failure";
    }>;
    cost_estimate_basis: {
      most_similar_project: string;
      similarity_score: number;
    };
    confidence: {
      level: "LOW" | "MEDIUM" | "HIGH";
      explanation: string;
    };
  };

  // 5️⃣ ROI PROJECTIONS
  roi_projections: {
    scenarios: {
      worst_case: {
        scenario: "worst_case";
        roi_percent: number;          // e.g., 320.5
        payback_period_months: number; // e.g., 4.2
        projected_revenue_18mo: number;
        projected_users: number;
        adoption_rate: number;
        revenue_per_user_year: number;
        assumptions: string;
        calculation: string;
      };
      base_case: {
        // Same structure as worst_case
      };
      best_case: {
        // Same structure as worst_case
      };
    };
    recommended_scenario: "base_case";
    calculation_basis: string;
    assumptions: string[];
  };

  // 6️⃣ OVERALL RECOMMENDATION
  overall_recommendation: {
    decision: "proceed" | "proceed_with_caution" | "delay" | "avoid";
    confidence: number;
    reasoning: string[];
    key_concerns: string[];
    success_probability: number;
  };

  // 7️⃣ UPSKILLING INSIGHTS
  upskilling_insights: {
    bottleneck_skills: Array<{
      skill: string;
      gap_level: "low" | "medium" | "high";
      affected_features: number;
    }>;
    suggested_training: Array<{
      skill: string;
      priority: "low" | "medium" | "high";
      training_resources: string[];
    }>;
  };
}
```

---

### 2. **GET /api/analysis/{analysis_id}**
**Purpose:** Retrieve previously saved analysis
**When to use:** User wants to view past analysis or refresh page

#### Example Request:
```typescript
const analysisId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'; // From previous analysis

const response = await fetch(`http://localhost:8000/api/analysis/${analysisId}`);
const data = await response.json();

// Returns same structure as /api/analyze-complete
```

---

### 3. **GET /api/analyze-stream** ⭐ FOR REAL-TIME UPDATES
**Purpose:** Stream live analysis progress using Server-Sent Events (SSE)
**When to use:** Show real-time progress bars and agent execution

#### Example Implementation:
```typescript
const feature_name = encodeURIComponent('Smart Branch Connect');
const description = encodeURIComponent('Hybrid banking experience...');

const eventSource = new EventSource(
  `http://localhost:8000/api/analyze-stream?feature_name=${feature_name}&description=${description}`
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case 'start':
      console.log('Analysis started');
      break;

    case 'agent_start':
      console.log(`Agent ${data.agent} starting (Wave ${data.wave})...`);
      // Update UI: Show agent as "running"
      break;

    case 'agent_complete':
      console.log(`Agent ${data.agent} completed:`, data.result);
      // Update UI: Show agent results
      break;

    case 'wave_complete':
      console.log(`Wave ${data.wave} completed in ${data.duration_ms}ms`);
      // Update UI: Show wave timing
      break;

    case 'complete':
      console.log('Analysis complete!', data.wave_timings);
      eventSource.close();
      break;

    case 'error':
      console.error('Analysis error:', data.message);
      eventSource.close();
      break;
  }
};

eventSource.onerror = (error) => {
  console.error('Stream error:', error);
  eventSource.close();
};
```

#### SSE Event Types:
```typescript
// Event 1: Start
{
  type: 'start',
  timestamp: 1699564832.123
}

// Event 2: Agent Start (per agent)
{
  type: 'agent_start',
  agent: 'engineer',
  wave: 1,
  timestamp: 1699564832.234
}

// Event 3: Agent Complete (per agent)
{
  type: 'agent_complete',
  agent: 'engineer',
  wave: 1,
  result: {
    estimated_sprints: 12,
    estimated_engineers: 8,
    estimated_cost_usd: 864000,
    reasoning: [
      "Performing RAG vector search for similar PNC projects",
      "Found 3 similar projects using vector_embeddings",
      "Using NVIDIA NV-Embed-v2 for semantic similarity matching",
      "Final estimate: $864,000 over 12 sprints with 8 engineers"
    ],
    tool_calls: [
      { tool: "NVIDIA NV-Embed-v2", action: "Generate query embedding for RAG search" },
      { tool: "Vector Database", action: "Semantic similarity search across 20 past projects" },
      { tool: "NVIDIA Nemotron Nano 8B", action: "Cost estimation and complexity analysis" }
    ],
    confidence: 0.85,
    elapsed_ms: 3240
  },
  timestamp: 1699564835.474
}

// Event 4: Wave Complete
{
  type: 'wave_complete',
  wave: 1,
  duration_ms: 8934,
  timestamp: 1699564841.168
}

// Event 5: Complete
{
  type: 'complete',
  total_duration_ms: 32456,
  wave_timings: {
    wave1_ms: 8934,
    wave2_ms: 4620,
    wave3_ms: 18902
  },
  timestamp: 1699564864.579
}
```

---

## 💾 SAVED DATA LOCATION

Every analysis is automatically saved to:
```
/Users/prajit/Desktop/projects/Viably/backend/data/analysis_results/{uuid}.json
```

You can read these files directly if needed:
```typescript
// Example: Read saved analysis file
import fs from 'fs';

const analysisId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const filePath = `/Users/prajit/Desktop/projects/Viably/backend/data/analysis_results/${analysisId}.json`;

const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
console.log(data);
```

---

## 🎨 REAL-WORLD EXAMPLE: Building a PNC Dashboard Box

Let's say you want to build **Box1: ROI Summary Card**

### Step 1: Create State Management
```typescript
// app/components/Boxes/Box1.tsx
'use client';

import React, { useState, useEffect } from 'react';

interface ROIData {
  worst_case_roi: number;
  base_case_roi: number;
  best_case_roi: number;
  payback_months: number;
  decision: string;
}

export const Box1 = () => {
  const [roiData, setRoiData] = useState<ROIData | null>(null);
  const [loading, setLoading] = useState(false);

  // Function to fetch latest analysis
  const fetchLatestAnalysis = async () => {
    setLoading(true);

    try {
      // Option 1: Run new analysis
      const response = await fetch('http://localhost:8000/api/analyze-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature_name: 'Smart Branch Connect',
          description: 'Hybrid banking experience...',
        })
      });

      const data = await response.json();

      // Extract ROI data
      const roi = data.roi_projections.scenarios;
      setRoiData({
        worst_case_roi: roi.worst_case.roi_percent,
        base_case_roi: roi.base_case.roi_percent,
        best_case_roi: roi.best_case.roi_percent,
        payback_months: roi.base_case.payback_period_months,
        decision: data.overall_recommendation.decision
      });

    } catch (error) {
      console.error('Failed to fetch analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch on mount
    fetchLatestAnalysis();
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 h-full flex items-center justify-center">
        <div className="text-white">Loading ROI Analysis...</div>
      </div>
    );
  }

  if (!roiData) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 h-full">
        <div className="text-white">No data available</div>
        <button
          onClick={fetchLatestAnalysis}
          className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded text-white"
        >
          Run Analysis
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-900 to-blue-800 border border-blue-700 rounded-lg p-6 h-full shadow-xl">
      <h2 className="text-2xl font-bold text-white mb-4">ROI Projections</h2>

      {/* Decision Badge */}
      <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4 ${
        roiData.decision === 'proceed' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'
      }`}>
        {roiData.decision.toUpperCase()}
      </div>

      {/* ROI Scenarios */}
      <div className="space-y-3">
        <div className="bg-white/10 rounded p-3">
          <div className="text-gray-300 text-sm">Worst Case</div>
          <div className="text-3xl font-bold text-red-400">{roiData.worst_case_roi.toFixed(0)}%</div>
        </div>

        <div className="bg-white/20 rounded p-3 border-2 border-green-400">
          <div className="text-gray-300 text-sm">Base Case ⭐</div>
          <div className="text-4xl font-bold text-green-400">{roiData.base_case_roi.toFixed(0)}%</div>
        </div>

        <div className="bg-white/10 rounded p-3">
          <div className="text-gray-300 text-sm">Best Case</div>
          <div className="text-3xl font-bold text-blue-400">{roiData.best_case_roi.toFixed(0)}%</div>
        </div>
      </div>

      {/* Payback Period */}
      <div className="mt-4 pt-4 border-t border-white/20">
        <div className="text-gray-300 text-sm">Payback Period</div>
        <div className="text-2xl font-bold text-white">{roiData.payback_months.toFixed(1)} months</div>
      </div>
    </div>
  );
};
```

---

## 🎯 COMMON UI PATTERNS

### Pattern 1: Real-Time Progress with SSE
```typescript
// Show live agent progress
const [agentProgress, setAgentProgress] = useState({
  engineer: 0,
  competitor: 0,
  market_intelligence: 0,
  roi_calculator: 0,
  similar_features: 0,
  implementation_planner: 0
});

const eventSource = new EventSource('http://localhost:8000/api/analyze-stream?...');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'agent_complete') {
    setAgentProgress(prev => ({
      ...prev,
      [data.agent]: 100
    }));
  }
};

// In your UI:
<div className="progress-bar">
  <div className="w-full bg-gray-700 rounded h-2">
    <div
      className="bg-green-500 h-2 rounded transition-all"
      style={{ width: `${agentProgress.engineer}%` }}
    />
  </div>
  <span className="text-sm">Engineer Agent: {agentProgress.engineer}%</span>
</div>
```

### Pattern 2: Data Polling (Alternative to SSE)
```typescript
// Poll for results if SSE doesn't work
const [analysisId, setAnalysisId] = useState<string | null>(null);
const [results, setResults] = useState(null);

const startAnalysis = async () => {
  // Step 1: Trigger analysis
  const response = await fetch('http://localhost:8000/api/analyze-complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feature_name: '...', description: '...' })
  });

  const data = await response.json();
  setAnalysisId(data.analysis_id);
  setResults(data);
};

// Step 2: No polling needed - you get results immediately!
// (Backend blocks until complete, unlike the stream endpoint)
```

### Pattern 3: Shared State Across Boxes
```typescript
// app/components/BentoGrid.tsx
import React, { useState, createContext, useContext } from 'react';

interface AnalysisContextType {
  analysisData: any;
  setAnalysisData: (data: any) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export const useAnalysis = () => {
  const context = useContext(AnalysisContext);
  if (!context) throw new Error('useAnalysis must be used within AnalysisProvider');
  return context;
};

export const BentoGrid = () => {
  const [analysisData, setAnalysisData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <AnalysisContext.Provider value={{ analysisData, setAnalysisData, isLoading, setIsLoading }}>
      <div className="grid grid-cols-3 grid-rows-3 gap-4 h-full">
        <Box1 /> {/* Can access analysisData via useAnalysis() */}
        <Box2 />
        <Box3 />
        <Box4 />
        <Box5 />
        <Box6 />
      </div>
    </AnalysisContext.Provider>
  );
};
```

```typescript
// app/components/Boxes/Box1.tsx
import { useAnalysis } from '../BentoGrid';

export const Box1 = () => {
  const { analysisData, isLoading } = useAnalysis();

  if (isLoading) return <div>Loading...</div>;
  if (!analysisData) return <div>No data</div>;

  const roi = analysisData.roi_projections.scenarios.base_case.roi_percent;

  return <div>ROI: {roi}%</div>;
};
```

---

## 🔥 RECOMMENDED BOX LAYOUT FOR PNC DASHBOARD

### Box 1 (col-span-1, row-span-2): **ROI Summary**
- Display: 3 ROI scenarios (worst/base/best)
- Payback period
- Decision badge (PROCEED/DELAY/AVOID)
- Source: `data.roi_projections.scenarios`

### Box 2 (col-span-1, row-span-1): **Cost Estimate**
- Display: Total cost, sprints, engineers
- Confidence level
- Similar projects basis
- Source: `data.engineer_analysis`

### Box 3 (col-span-1, row-span-2): **Competitive Analysis**
- Display: Top 5 competitors
- Risk level (LOW/MEDIUM/HIGH)
- Response time estimate
- Market position
- Source: `data.competitor_analysis`

### Box 4 (col-span-1, row-span-1): **Market Intelligence**
- Display: Market size (TAM)
- Growth rate (CAGR)
- Source links (verifiable)
- Confidence level
- Source: `data.market_intelligence`

### Box 5 (col-span-1, row-span-1): **Recommendation**
- Display: Final decision
- Key reasoning bullets
- Success probability
- Concerns/risks
- Source: `data.overall_recommendation`

### Box 6 (col-span-2, row-span-1): **Similar Features**
- Display: Table of 3 similar projects
- Similarity scores
- Adoption rates
- Outcomes (success/failure)
- Source: `data.similar_features.similar_projects`

---

## 🚀 QUICK START CHECKLIST

1. ✅ **Backend is running**
   ```bash
   cd /Users/prajit/Desktop/projects/Viably/backend
   python main.py
   # Should see: "Viably backend running on port 8000"
   ```

2. ✅ **Test API is accessible**
   ```bash
   curl http://localhost:8000/health
   # Should return: {"status":"ok"}
   ```

3. ✅ **Run test analysis**
   ```bash
   curl -X POST http://localhost:8000/api/analyze-complete \
     -H "Content-Type: application/json" \
     -d '{
       "feature_name": "Test Feature",
       "description": "Test description"
     }'
   ```

4. ✅ **Copy NVIDIA dashboard patterns**
   - Look at: `frontend/app/nvidia/page.tsx` (lines 36-114) for SSE example
   - Look at: `frontend/app/nvidia/components/AgentCard.tsx` for card styling

5. ✅ **Start building your boxes**
   - Replace placeholder content in `Box1.tsx` through `Box6.tsx`
   - Use the example code above as templates
   - Test with real API calls

---

## 🐛 TROUBLESHOOTING

### Problem: "Failed to fetch" error
**Solution:** Backend not running. Check terminal running `python main.py`

### Problem: CORS error
**Solution:** Backend already has CORS configured for `localhost:3000`. Make sure frontend is on that port.

### Problem: Analysis takes too long (>60 seconds)
**Solution:** Normal! Real AI processing. Use SSE to show progress instead of blocking.

### Problem: Empty/null data
**Solution:** Check backend logs. Agent might have failed. Look for Python errors in terminal.

### Problem: SSE not connecting
**Solution:**
```typescript
// Add error handler
eventSource.onerror = (error) => {
  console.error('SSE Error:', error);
  // Fallback to polling or regular fetch
};
```

---

## 📞 GETTING HELP

1. **Check backend logs:** Terminal running `python main.py` shows all agent execution
2. **Check browser console:** Network tab shows API requests/responses
3. **Inspect saved JSON:** Look at `backend/data/analysis_results/*.json` to see raw data
4. **Copy NVIDIA dashboard:** It's using the EXACT same API - just copy their code!

---

## ✅ FINAL NOTES

- **ALL DATA is available** via `/api/analyze-complete` - one call gets everything
- **Use SSE** (`/api/analyze-stream`) if you want real-time updates
- **Share state** between boxes using React Context (see Pattern 3 above)
- **Don't poll** - SSE is more efficient for live updates
- **Backend saves everything** - you can always retrieve past analyses by ID

The NVIDIA dashboard is your reference implementation. They're consuming the SAME backend APIs. Copy their patterns!

---

**Ready to build? Start with Box1 (ROI Summary) - it's the most impactful for PNC judges.** 🚀
