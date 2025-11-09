"""
Orchestrator Agent V2: Phase-1 multi-agent orchestrator.

- Builds an enriched context from PM input + PNC-style assumptions
- Runs Engineer + Competitor + Market Intelligence agents
- Produces a stable `phase1_context` for downstream agents (ROI, Risk, Planner, etc.)
- Preserves overall_recommendation + upskilling_insights for the demo
"""

import logging
from typing import Dict, Any

from .base_agent import BaseAgent
from .engineer_agent import EngineerAgent
from .competitor_agent import CompetitorAgent
from .market_intelligence_agent import MarketIntelligenceAgent
from utils.upskilling import get_tracker

logger = logging.getLogger(__name__)


class OrchestratorV2(BaseAgent):
    """
    Orchestrator that coordinates Phase-1 agents and adds high-level synthesis.

    Public contract (what downstream code can rely on):

    {
        "phase1_context": {
            "meta": {...},
            "pnc_context": {...},
            "tech_context": {...},
            "engineering": {...},   # EngineerAgent output
            "competitor": {...},    # CompetitorAgent output
            "market": {...},        # MarketIntelAgent output
            "summary": {...}
        },
        "engineer_analysis": {...},
        "competitor_analysis": {...},
        "market_intelligence": {...},
        "overall_recommendation": {...},
        "upskilling_insights": {...}
    }
    """

    def __init__(self, use_vector_embeddings: bool = False):
        super().__init__()
        self.engineer = EngineerAgent(use_vector_embeddings=use_vector_embeddings)
        self.competitor = CompetitorAgent()
        self.market_intel = MarketIntelligenceAgent()
        self.upskilling_tracker = get_tracker()
        logger.info("OrchestratorV2 initialized")

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _build_initial_context(
        self,
        feature_name: str,
        feature_description: str,
        target_user: str,
        business_goal: str,
        industry: str,
    ) -> Dict[str, Any]:
        """
        Enrich raw PM input into a shared context used by Phase-1 agents.

        This is where we:
        - Inject PNC-style org profile
        - Inject mock repo / stack info
        - Inject prior project hints
        - Set global estimation assumptions
        """

        # Tech context: pretend we scanned a real Smart Branch repo
        tech_context = {
            "repo_url": "https://github.com/org/pnc-smart-branch-connect",
            "languages": ["TypeScript", "JavaScript", "Python", "SQL"],
            "frameworks": ["React Native", "React", "FastAPI"],
            "services": ["PostgreSQL", "Docker", "GitHub Actions"],
            "approx_loc": 18000,
        }

        # PNC-style org profile
        org_profile = {
            "name": "PNC-like Bank",
            "risk_appetite": "moderate",
            "constraints": [
                "regulated_financial_institution",
                "requires_strong_security",
                "requires_auditability",
            ],
            "regions": ["US"],
        }

        # Prior relevant projects (feeding Engineer + Similar Features etc)
        prior_projects = [
            {
                "similar_feature_name": "Branch Appointment Scheduler",
                "outcome": "success",
                "notes": "10 sprints, 5 engineers, strong adoption.",
            },
            {
                "similar_feature_name": "Legacy Systems Integration",
                "outcome": "delayed",
                "notes": "Integration complexity underestimated; raised delivery risk.",
            },
        ]

        # Global assumptions used across agents
        assumptions = {
            "currency": "USD",
            "sprint_length_weeks": 2,
            "avg_engineer_monthly_cost_usd": 24000,
        }

        # Seed facts for Market + Competitor agents
        seed_market_facts = [
            "Omnichannel branch engagement and digital queuing are key themes among large US banks."
        ]
        seed_competitor_facts = [
            "Several top-5 US banks publicly reference smart branch and appointment tooling."
        ]

        return {
            "feature_name": feature_name,
            "feature_description": feature_description,
            "target_user": target_user,
            "business_goal": business_goal,
            "industry": industry,
            "tech_context": tech_context,
            "org_profile": org_profile,
            "prior_projects": prior_projects,
            "assumptions": assumptions,
            "seed_market_facts": seed_market_facts,
            "seed_competitor_facts": seed_competitor_facts,
        }

    def _normalize_engineer_output(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "agent": raw.get("agent", "engineer_v1"),
            "feature_name": raw.get("feature_name"),
            "estimated_sprints": raw.get("estimated_sprints", 0),
            "estimated_engineers": raw.get("estimated_engineers", 0),
            "estimated_cost_usd": raw.get("estimated_cost_usd", 0),
            "team_profile": raw.get("team_profile", []),
            "implementation_complexity": raw.get("implementation_complexity", "MEDIUM"),
            "integration_points": raw.get("integration_points", []),
            "key_risks": raw.get("key_risks", []),
            "assumptions": raw.get("assumptions", {}),
            "confidence": raw.get("confidence", 0.7),
        }

    def _normalize_competitor_output(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "agent": raw.get("agent", "competitor_v1"),
            "feature_name": raw.get("feature_name"),
            "key_competitors": raw.get("key_competitors", []),
            "expected_response_time_sprints": raw.get(
                "expected_response_time_sprints", 0
            ),
            "competitive_risk_level": raw.get("competitive_risk_level", "MEDIUM"),
            "likely_response_strategies": raw.get("likely_response_strategies", []),
            "differentiation_factors": raw.get("differentiation_factors", []),
            "pricing_pressure_risk": raw.get("pricing_pressure_risk", None),
            "substitution_risk": raw.get("substitution_risk", None),
            "evidence_snippets": raw.get("evidence_snippets", []),
        }

    def _normalize_market_output(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "agent": raw.get("agent", "market_intel_v1"),
            "feature_name": raw.get("feature_name"),
            "focus_region": raw.get("focus_region", "US"),
            "primary_customer_segments": raw.get("primary_customer_segments", []),
            "estimated_market_size_usd": raw.get("estimated_market_size_usd", 0),
            "growth_rate_percent": raw.get("growth_rate_percent", 0),
            "adoption_readiness": raw.get("adoption_readiness", "MEDIUM"),
            "regulatory_impact": raw.get("regulatory_impact", "MEDIUM"),
            "operational_impact": raw.get("operational_impact", "MEDIUM"),
            "adoption_drivers": raw.get("adoption_drivers", []),
            "adoption_barriers": raw.get("adoption_barriers", []),
            "evidence_snippets": raw.get("evidence_snippets", []),
        }

    # ------------------------------------------------------------------
    # Main entrypoint
    # ------------------------------------------------------------------

    def analyze(
        self,
        feature_name: str,
        feature_description: str,
        target_user: str = "PNC customers",
        business_goal: str = "increase engagement and revenue",
        industry: str = "banking",
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """
        Run Phase-1 agents + synthesis.

        Note: currently synchronous for simplicity. The 3-wave parallel version
        can wrap these calls with asyncio.gather without changing the schema.
        """

        logger.info(f"=== ORCHESTRATOR V2: Starting analysis for '{feature_name}' ===")

        try:
            # ------------------------------------------------------------------
            # 1) Build enriched initial context (shared for all Phase-1 agents)
            # ------------------------------------------------------------------
            ctx = self._build_initial_context(
                feature_name=feature_name,
                feature_description=feature_description,
                target_user=target_user,
                business_goal=business_goal,
                industry=industry,
            )

            # ------------------------------------------------------------------
            # 2) Phase-1 agents (can be parallelized later)
            # ------------------------------------------------------------------
            logger.info("Wave 1: Engineer Agent...")
            eng_raw = self.engineer.analyze_with_context(ctx)

            logger.info("Wave 1: Competitor Agent...")
            comp_raw = self.competitor.analyze_with_context(ctx)

            logger.info("Wave 1: Market Intelligence Agent...")
            market_raw = self.market_intel.analyze_with_context(ctx)

            engineer_analysis = self._normalize_engineer_output(eng_raw)
            competitor_analysis = self._normalize_competitor_output(comp_raw)
            market_intelligence = self._normalize_market_output(market_raw)

            # ------------------------------------------------------------------
            # 3) Build Phase-1 context for downstream agents
            # ------------------------------------------------------------------
            phase1_context = {
                "meta": {
                    "feature_name": feature_name,
                    "feature_description": feature_description,
                    "industry": industry,
                },
                "pnc_context": {
                    "primary_segment": "Retail",
                    "secondary_segments": ["Small Business"],
                    "regulatory_sensitivity": "HIGH",
                },
                "tech_context": ctx["tech_context"],
                "engineering": engineer_analysis,
                "competitor": competitor_analysis,
                "market": market_intelligence,
                "summary": {
                    "cost_usd": engineer_analysis["estimated_cost_usd"],
                    "timeline_sprints": engineer_analysis["estimated_sprints"],
                    "competitive_risk": competitor_analysis["competitive_risk_level"],
                    "market_size_usd": market_intelligence["estimated_market_size_usd"],
                    "regulatory_sensitivity": "HIGH",
                },
            }

            # ------------------------------------------------------------------
            # 4) Existing high-level recommendation using Phase-1 outputs
            # ------------------------------------------------------------------
            recommendation = self._generate_recommendation(
                feature_name=feature_name,
                engineer_analysis=engineer_analysis,
                competitor_analysis=competitor_analysis,
                business_goal=business_goal,
            )

            # ------------------------------------------------------------------
            # 5) Upskilling insights (re-using your existing logic)
            # ------------------------------------------------------------------
            similar_projects_found = eng_raw.get("similar_projects_found", 0)
            if similar_projects_found > 0:
                inferred_skills = self._infer_skills_from_feature(feature_description)
                self.upskilling_tracker.track_skills(inferred_skills)

            upskilling_insights = self.upskilling_tracker.get_insights()

            logger.info("=== ORCHESTRATOR V2: Phase-1 analysis complete ===")

            return {
                "phase1_context": phase1_context,
                "engineer_analysis": engineer_analysis,
                "competitor_analysis": competitor_analysis,
                "market_intelligence": market_intelligence,
                "overall_recommendation": recommendation,
                "upskilling_insights": upskilling_insights,
            }

        except Exception as e:
            logger.error(f"OrchestratorV2 analysis failed: {str(e)}")
            return {
                "phase1_context": {},
                "engineer_analysis": {
                    "estimated_sprints": 0,
                    "estimated_engineers": 0,
                    "estimated_cost_usd": 0,
                    "key_risks": [f"Analysis failed: {str(e)}"],
                    "confidence": 0.0,
                },
                "competitor_analysis": {
                    "key_competitors": [],
                    "expected_response_time_sprints": 0,
                    "response_play": "Unknown",
                    "competitive_risk_level": "MEDIUM",
                },
                "market_intelligence": {},
                "overall_recommendation": {
                    "summary": "Unable to complete analysis",
                    "rationale": f"Error: {str(e)}",
                    "action_items": [
                        "Fix analysis errors",
                        "Retry with valid inputs",
                    ],
                },
                "upskilling_insights": {
                    "bottleneck_skills": [],
                    "suggested_training": [],
                },
                "error": str(e),
            }

    # ------------------------------------------------------------------
    # Existing helpers (unchanged)
    # ------------------------------------------------------------------

    def _generate_recommendation(
        self,
        feature_name: str,
        engineer_analysis: Dict[str, Any],
        competitor_analysis: Dict[str, Any],
        business_goal: str,
    ) -> Dict[str, Any]:
        cost = engineer_analysis.get("estimated_cost_usd", 0)
        sprints = engineer_analysis.get("estimated_sprints", 0)
        engineers = engineer_analysis.get("estimated_engineers", 0)
        confidence = engineer_analysis.get("confidence", 0.7)

        risk_level = competitor_analysis.get("competitive_risk_level", "MEDIUM")
        competitors = competitor_analysis.get("key_competitors", [])
        response_time = competitor_analysis.get(
            "expected_response_time_sprints", 0
        )

        action_items = []

        if cost > 500000 and risk_level == "HIGH":
            summary = "DEFER - High cost with high competitive risk"
            rationale = (
                f"${cost:,} investment with {len(competitors)} strong competitors "
                f"that can match in {response_time} sprints. Consider differentiation "
                f"or defer."
            )
            action_items = [
                "Identify unique differentiation angle",
                "Reduce scope to lower cost",
                "Wait for market maturity signals",
            ]
        elif risk_level == "LOW" and cost < 300000:
            summary = "PROCEED - Low competitive risk, manageable cost"
            rationale = (
                f"${cost:,} over {sprints} sprints is reasonable given "
                f"{risk_level.lower()} competitive risk. {business_goal.capitalize()} "
                f"aligns with expected ROI."
            )
            action_items = [
                "Assemble team and kick off discovery",
                "Create detailed technical spec",
                "Set up success metrics",
            ]
        elif risk_level == "MEDIUM" and cost < 500000:
            summary = "PROCEED WITH CAUTION - Balanced risk/reward"
            rationale = (
                f"{sprints} sprints with {engineers} engineers is feasible. "
                f"Medium competitive risk requires differentiation in execution."
            )
            action_items = [
                "Define clear differentiation vs competitors",
                "Plan phased rollout to validate assumptions",
                "Monitor competitor moves closely",
            ]
        elif confidence < 0.7:
            summary = "INVESTIGATE - Low estimation confidence"
            rationale = (
                f"Confidence only {confidence:.0%}. Need more discovery to refine "
                f"estimates and derisk assumptions."
            )
            action_items = [
                "Conduct technical spike/POC",
                "Interview target users",
                "Refine requirements and re-estimate",
            ]
        else:
            summary = "PROCEED - Acceptable risk/cost profile"
            rationale = (
                f"{sprints} sprints, ${cost:,}. Competitive positioning requires "
                f"strong execution but looks viable."
            )
            action_items = [
                "Finalize scope and technical approach",
                "Assemble cross-functional team",
                "Create project plan and milestones",
            ]

        return {
            "summary": summary,
            "rationale": rationale,
            "action_items": action_items,
        }

    def _infer_skills_from_feature(self, description: str) -> list:
        """
        Simple keyword-based skill inference (demo only).
        """
        text = description.lower()
        skills = []

        if any(w in text for w in ["mobile", "app", "ios", "android"]):
            skills.append("mobile")
        if any(w in text for w in ["api", "backend", "server", "database"]):
            skills.append("backend")
        if any(w in text for w in ["security", "auth", "encryption", "compliance"]):
            skills.append("security")
        if any(w in text for w in ["payment", "transaction", "checkout"]):
            skills.append("payments")
        if any(w in text for w in ["ai", "ml", "machine learning", "prediction"]):
            skills.append("ml")
        if any(w in text for w in ["frontend", "ui", "dashboard", "interface"]):
            skills.append("frontend")
        if any(w in text for w in ["data", "analytics", "insights"]):
            skills.append("data-science")
        if any(w in text for w in ["cloud", "aws", "azure", "infrastructure"]):
            skills.append("cloud")

        return skills or ["backend", "frontend"]
