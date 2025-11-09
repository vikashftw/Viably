import asyncio
import json
import time
from unittest.mock import AsyncMock
import types

from agents.orchestrator_v2 import OrchestratorV2


ENGINEER_SAMPLE = {
    "agent": "engineer_v1",
    "feature_name": "Smart Branch Connect",
    "estimated_sprints": 12,
    "estimated_engineers": 6,
    "estimated_cost_usd": 864000,
    "team_profile": [
        "2x React/React Native engineers",
        "2x Python/FastAPI backend engineers",
        "1x DevOps/SRE (Docker, CI/CD, monitoring)",
        "1x Security/Compliance engineer (PNC/banking-grade)"
    ],
    "implementation_complexity": "HIGH",
    "integration_points": [
        "Core banking APIs",
        "Customer identity & SSO",
        "Branch directory & scheduling systems",
        "Observability & audit logging stack"
    ],
    "key_risks": [
        "Cross-channel integration across mobile, web, and legacy branch systems",
        "High availability requirements for in-branch operations",
        "Regulatory & audit constraints impacting design and rollout speed"
    ],
    "assumptions": {
        "sprint_length_weeks": 2,
        "currency": "USD",
        "avg_engineer_monthly_cost_usd": 24000,
        "uses_existing_PNC_platforms": True
    },
    "confidence": 0.8
}

COMPETITOR_SAMPLE = {
    "agent": "competitor_v1",
    "feature_name": "Smart Branch Connect",
    "key_competitors": [
        "Large US retail banks with omnichannel branch tooling",
        "Regional banks investing in smart branches"
    ],
    "expected_response_time_sprints": 4,
    "competitive_risk_level": "MEDIUM",
    "likely_response_strategies": [
        "Launch similar appointment and queue features using existing digital stack",
        "Bundle with premium relationship banking to retain high-value customers"
    ],
    "differentiation_factors": [
        "Depth of PNC integration across channels and analytics",
        "Ability to tie branch interactions to PNC product recommendations"
    ],
    "pricing_pressure_risk": "LOW",
    "substitution_risk": "MEDIUM"
}

MARKET_SAMPLE = {
    "agent": "market_intel_v1",
    "feature_name": "Smart Branch Connect",
    "focus_region": "US",
    "primary_customer_segments": [
        "Retail checking & savings customers",
        "Small business owners using branch services"
    ],
    "estimated_market_size_usd": 4_000_000_000,
    "growth_rate_percent": 8,
    "adoption_readiness": "HIGH",
    "regulatory_impact": "HIGH",
    "operational_impact": "HIGH",
    "adoption_drivers": [
        "Customers expect seamless digital-to-branch experiences",
        "PNC can use structured appointments to drive targeted product conversations"
    ],
    "adoption_barriers": [
        "Change management for branch staff",
        "Data/privacy reviews for in-branch analytics"
    ]
}

SIMILAR_PROJECTS = [
    {
        "feature_name": "In-Branch Scheduler",
        "project_id": "proj_branch_sched",
        "description": "Scheduling and lobby queue management across branch + mobile",
        "cost_usd": 780000,
        "duration_weeks": 26,
        "adoption_rate": 0.38,
        "skills_required": ["frontend", "backend", "api"],
        "domain": "branch-experience"
    },
    {
        "feature_name": "Digital Concierge",
        "project_id": "proj_concierge",
        "description": "Guided in-branch experience with personalized insights",
        "cost_usd": 920000,
        "duration_weeks": 30,
        "adoption_rate": 0.42,
        "skills_required": ["mobile", "data", "security"],
        "domain": "customer-engagement"
    }
]

SAMPLE_PLAN = {
    "search_patterns": ["BranchConnect", "QueueService", "CustomerProfile"],
    "file_types": ["tsx", "py", "ts"],
    "suggested_directories": [
        "frontend/app/smart-branch",
        "frontend/components/smart-branch",
        "backend/api/smart-branch"
    ],
    "tasks": [
        {
            "title": "Build unified branch appointment API",
            "description": "Create FastAPI service for booking, queue status, and agent assignment.",
            "skills_required": ["python", "api", "security"],
            "estimated_hours": 32,
            "priority": "high"
        },
        {
            "title": "Implement mobile lobby interface",
            "description": "React Native screen for lobby check-in with analytics instrumentation.",
            "skills_required": ["mobile", "frontend"],
            "estimated_hours": 28,
            "priority": "medium"
        }
    ],
    "suggested_file_structure": {
        "directories": [
            "frontend/app/smart-branch",
            "frontend/components/smart-branch/widgets",
            "backend/services/branch_connect"
        ],
        "files": [
            {
                "path": "frontend/app/smart-branch/page.tsx",
                "type": "tsx",
                "purpose": "Entry point for Smart Branch Connect UI"
            },
            {
                "path": "backend/services/branch_connect/scheduler.py",
                "type": "py",
                "purpose": "Core scheduling logic and SLA enforcement"
            }
        ]
    },
    "implementation_context": "Focus on mobile-branch orchestration with strong observability hooks."
}


def _patch_wave_one_agents(orchestrator: OrchestratorV2) -> None:
    """Replace Wave 1 agents with async mocks using canned data."""
    orchestrator.engineer_agent.analyze = AsyncMock(return_value=ENGINEER_SAMPLE)
    orchestrator.competitor_agent.analyze = AsyncMock(return_value=COMPETITOR_SAMPLE)
    orchestrator.market_intel_agent.analyze = AsyncMock(return_value=MARKET_SAMPLE)


def _patch_wave_two(orchestrator: OrchestratorV2) -> None:
    """Stub RAG lookups and file I/O for Similar + ROI agents."""
    orchestrator.similar_features_agent.rag.find_similar_projects = lambda *args, **kwargs: SIMILAR_PROJECTS
    orchestrator.similar_features_agent._save_results = lambda *args, **kwargs: None
    orchestrator.roi_calculator._save_results = lambda *args, **kwargs: None


def _patch_wave_three(orchestrator: OrchestratorV2) -> None:
    """Prevent network/file operations inside Implementation Planner."""

    def fake_llm(self, **kwargs):
        return json.dumps(SAMPLE_PLAN)

    orchestrator.implementation_planner._call_llm = types.MethodType(
        fake_llm,
        orchestrator.implementation_planner
    )
    orchestrator.implementation_planner._save_result = lambda *args, **kwargs: None


async def test_wave_execution() -> None:
    orchestrator = OrchestratorV2(use_vector_embeddings=False)
    _patch_wave_one_agents(orchestrator)
    _patch_wave_two(orchestrator)
    _patch_wave_three(orchestrator)

    print("Testing 3-wave parallel execution...")
    print("=" * 60)
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
    print("  Target: 10-15 seconds")
    print(f"  Status: {'PASS' if elapsed < 1 else 'NEEDS OPTIMIZATION'}")

    # Verify no top-level error
    if "error" in result:
        raise AssertionError(f"Orchestrator returned top-level error: {result['error']}")

    expected_keys = [
        "engineer_analysis",
        "competitor_analysis",
        "market_intelligence",
        "roi_scenarios",
        "similar_features",
        "implementation_plan"
    ]
    for key in expected_keys:
        assert key in result, f"Missing '{key}' in orchestrator output"

    # Verify no error in implementation plan
    implementation_plan = result.get("implementation_plan", {})
    if "error" in implementation_plan:
        raise AssertionError(f"Implementation planner returned an error: {implementation_plan['error']}")

    assert "tasks" in implementation_plan and implementation_plan["tasks"], "Implementation plan should have tasks"

    print("✓ All agents completed successfully")


if __name__ == "__main__":
    asyncio.run(test_wave_execution())
