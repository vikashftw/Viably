# Teammate Handoff: 3-Wave Parallel Execution

**Task:** Implement dependency-aware parallel execution for 6 analysis agents
**Priority:** HIGH (2-3x performance improvement: 30-45s → 10-15s)
**Estimated Time:** 2-3 hours
**Assigned To:** Teammate 1 & Teammate 2

---

## Current State (SEQUENTIAL)

All 6 agents run one after another:
```python
# backend/agents/orchestrator_v2.py (CURRENT - SLOW)
engineer_result = await engineer_agent.analyze()      # 8s
competitor_result = await competitor_agent.analyze()   # 8s
market_result = await market_intel_agent.analyze()    # 8s
roi_result = await roi_calculator.calculate()         # 4s
similar_result = await similar_features.find()        # 4s
impl_result = await implementation_planner.plan()     # 3s
# TOTAL: 35 seconds
```

**Problem:** Wastes time - many agents are independent and can run simultaneously!

---

## Target State (3-WAVE PARALLEL)

```python
# WAVE 1 (Parallel - 8 seconds) - INDEPENDENT AGENTS
engineer_result, competitor_result, market_result = await asyncio.gather(
    engineer_agent.analyze(),
    competitor_agent.analyze(),
    market_intel_agent.analyze()
)

# WAVE 2 (Parallel - 4 seconds) - DEPEND ON ENGINEER
roi_result, similar_result = await asyncio.gather(
    roi_calculator.calculate(engineer_result),
    similar_features.find(engineer_result)
)

# WAVE 3 (Sequential - 3 seconds) - DEPENDS ON ALL
impl_result = await implementation_planner.plan({
    'engineer': engineer_result,
    'competitor': competitor_result,
    'market': market_result,
    'roi': roi_result,
    'similar': similar_result
})

# TOTAL: 15 seconds (2.3x faster!)
```

---

## Agent Dependencies

### Wave 1: INDEPENDENT (run in parallel)
- **Engineer Agent** - Uses RAG, no dependencies
- **Competitor Agent** - Uses Google search, no dependencies
- **Market Intelligence** - Uses Google search, no dependencies

### Wave 2: DEPEND ON ENGINEER (run in parallel)
- **ROI Calculator** - Needs `engineer_result.estimated_cost_usd`, `estimated_sprints`
- **Similar Features** - Needs `engineer_result` to explain similarity

### Wave 3: DEPENDS ON ALL (sequential)
- **Implementation Planner** - Needs ALL 5 previous results to create execution plan

---

## Implementation Steps

### Step 1: Update orchestrator_v2.py

**File:** `backend/agents/orchestrator_v2.py`

**Find this section** (around line 50-100):
```python
async def analyze(self, feature_name, feature_description, ...):
    # Current sequential execution
    engineer_result = await self.engineer_agent.analyze(...)
    competitor_result = await self.competitor_agent.analyze(...)
    # ... etc
```

**Replace with:**
```python
async def analyze(self, feature_name, feature_description, target_user, business_goal, industry):
    """
    Analyze feature using 3-wave parallel execution
    Wave 1: Independent agents (Engineer, Competitor, Market Intel)
    Wave 2: Dependent on Engineer (ROI, Similar Features)
    Wave 3: Depends on all (Implementation Planner)
    """

    # WAVE 1: Run independent agents in parallel (8 seconds)
    print("[Orchestrator] Wave 1: Running independent agents...")
    engineer_result, competitor_result, market_result = await asyncio.gather(
        self.engineer_agent.analyze(
            feature_name=feature_name,
            feature_description=feature_description,
            target_user=target_user,
            business_goal=business_goal
        ),
        self.competitor_agent.analyze(
            feature_name=feature_name,
            feature_description=feature_description,
            industry=industry
        ),
        self.market_intel_agent.analyze(
            feature_name=feature_name,
            feature_description=feature_description,
            industry=industry
        )
    )
    print(f"[Orchestrator] Wave 1 complete: Engineer (${engineer_result['estimated_cost_usd']}), Competitors ({len(competitor_result['key_competitors'])}), Market (${market_result.get('market_size_usd', 0)})")

    # WAVE 2: Run Engineer-dependent agents in parallel (4 seconds)
    print("[Orchestrator] Wave 2: Running dependent agents...")
    roi_result, similar_result = await asyncio.gather(
        self.roi_calculator.calculate(
            feature_name=feature_name,
            engineer_analysis=engineer_result,
            similar_features={}  # Will be updated by similar_features agent
        ),
        self.similar_features_agent.find(
            feature_name=feature_name,
            feature_description=feature_description,
            engineer_analysis=engineer_result
        )
    )
    print(f"[Orchestrator] Wave 2 complete: ROI ({roi_result['base_case']['roi_percent']}%), Similar Features ({len(similar_result['similar_projects'])})")

    # WAVE 3: Run final agent that depends on everything (3 seconds)
    print("[Orchestrator] Wave 3: Running final agent...")
    impl_result = await self.implementation_planner.plan({
        'feature_name': feature_name,
        'feature_description': feature_description,
        'engineer_analysis': engineer_result,
        'competitor_analysis': competitor_result,
        'market_intelligence': market_result,
        'roi_scenarios': roi_result,
        'similar_features': similar_result
    })
    print(f"[Orchestrator] Wave 3 complete: {len(impl_result.get('search_patterns', []))} search patterns, {len(impl_result.get('tasks', []))} tasks")

    # Rest of orchestrator logic (upskilling, recommendation, etc.)
    # ... (keep existing code)
```

---

### Step 2: Update Agent Interfaces

**Some agents might need their signatures updated to accept dependencies:**

#### ROI Calculator
**File:** `backend/agents/roi_calculator_agent.py`

**Current:**
```python
async def calculate(self, feature_name, ...):
    # Tries to load engineer data from somewhere
```

**Update to:**
```python
async def calculate(self, feature_name, engineer_analysis, similar_features=None):
    """
    Calculate ROI scenarios

    Args:
        feature_name: Name of feature
        engineer_analysis: Output from Engineer Agent (contains cost, sprints, engineers)
        similar_features: Optional output from Similar Features Agent
    """
    cost = engineer_analysis.get('estimated_cost_usd', 0)
    sprints = engineer_analysis.get('estimated_sprints', 0)

    # Use this data directly instead of loading from file
    # ...
```

#### Similar Features Agent
**File:** `backend/agents/similar_features_agent.py`

**Update to:**
```python
async def find(self, feature_name, feature_description, engineer_analysis):
    """
    Find similar PNC projects

    Args:
        engineer_analysis: Output from Engineer Agent (for comparison)
    """
    # Use engineer_analysis to explain why projects are similar
    # ...
```

---

### Step 3: Test Each Wave Independently

**Create test script:** `backend/test_3_wave_execution.py`

```python
import asyncio
from agents.orchestrator_v2 import OrchestratorV2

async def test_wave_execution():
    orchestrator = OrchestratorV2(use_vector_embeddings=False)

    print("Testing 3-wave parallel execution...")
    print("=" * 60)

    import time
    start = time.time()

    result = await orchestrator.analyze(
        feature_name="Smart Branch Connect",
        feature_description="Hybrid banking experience connecting digital and in-branch",
        target_user="PNC customers",
        business_goal="Maximize ROI on $2B branch expansion",
        industry="banking"
    )

    elapsed = time.time() - start

    print("=" * 60)
    print(f"✓ Analysis complete in {elapsed:.1f} seconds")
    print(f"  Target: 10-15 seconds")
    print(f"  Status: {'PASS' if elapsed < 20 else 'NEEDS OPTIMIZATION'}")

    # Verify all results exist
    assert 'engineer_analysis' in result
    assert 'competitor_analysis' in result
    assert 'market_intelligence' in result
    assert 'roi_scenarios' in result
    assert 'similar_features' in result
    assert 'implementation_plan' in result

    print("✓ All agents completed successfully")

if __name__ == "__main__":
    asyncio.run(test_wave_execution())
```

**Run test:**
```bash
cd backend
python test_3_wave_execution.py
```

**Expected output:**
```
[Orchestrator] Wave 1: Running independent agents...
[Orchestrator] Wave 1 complete: Engineer ($864000), Competitors (5), Market ($47300000000)
[Orchestrator] Wave 2: Running dependent agents...
[Orchestrator] Wave 2 complete: ROI (640%), Similar Features (3)
[Orchestrator] Wave 3: Running final agent...
[Orchestrator] Wave 3 complete: 3 search patterns, 12 tasks
============================================================
✓ Analysis complete in 14.2 seconds
  Target: 10-15 seconds
  Status: PASS
✓ All agents completed successfully
```

---

## Validation Checklist

### Before merging:
- [ ] All 6 agents still return correct data structure
- [ ] Total execution time < 20 seconds (ideally 10-15s)
- [ ] Wave 1 agents don't depend on each other
- [ ] Wave 2 agents correctly use engineer_result
- [ ] Wave 3 agent receives all 5 previous results
- [ ] Existing tests still pass: `python backend/test_merged_schema.py`
- [ ] New test passes: `python backend/test_3_wave_execution.py`
- [ ] FastAPI endpoints still work: `POST /api/analyze-complete`

---

## Debugging Tips

### If agents fail:
1. **Check error logs** - Which wave failed?
2. **Verify data passing** - Is engineer_result structure correct?
3. **Test agents individually** - Do they work standalone?
4. **Check asyncio syntax** - await/async correct?

### Common issues:
- **"AttributeError: 'dict' object has no attribute 'X'"**
  - Agent expecting object but receiving dict
  - Fix: Access via `result['key']` not `result.key`

- **"All agents fail in Wave 2"**
  - Engineer result structure might be wrong
  - Add debug: `print(engineer_result.keys())`

- **"Slower than sequential"**
  - Agents not actually running in parallel
  - Check: Are you using `await asyncio.gather()`?

---

## Performance Targets

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Total Time | 30-45s | 10-15s | **2-3x faster** |
| Wave 1 | 24s (sequential) | 8s (parallel) | 3x faster |
| Wave 2 | 8s (sequential) | 4s (parallel) | 2x faster |
| Wave 3 | 3s | 3s | No change |

---

## Questions? Issues?

**Contact:** Lead developer (person who built this)
**Files to modify:** `backend/agents/orchestrator_v2.py` (main file)
**Files to potentially update:** `roi_calculator_agent.py`, `similar_features_agent.py`
**Test file:** Create `backend/test_3_wave_execution.py`

**Good luck! This will make the demo significantly more impressive.**

---

*Generated by ULTRATHINK for Viably Product Sandbox War Game*
