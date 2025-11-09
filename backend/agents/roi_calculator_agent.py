"""
ROI Calculator Agent - Multi-scenario financial projections.
"""

import os
import json
import logging
import asyncio
from datetime import datetime
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class ROICalculatorAgent:
    """
    ROI Calculator Agent providing multi-scenario financial projections.
    """

    def __init__(self):
        """Initialize ROI Calculator Agent."""
        self.data_dir = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "data",
            "analysis_history"
        )
        os.makedirs(self.data_dir, exist_ok=True)
        logger.info("ROI Calculator Agent initialized")

    async def calculate(
        self,
        feature_name: str,
        engineer_analysis: Dict[str, Any],
        similar_features: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Calculate ROI with multiple scenarios based on engineer and similar feature analysis.
        
        Args:
            feature_name: Name of feature
            engineer_analysis: Output from Engineer Agent (contains cost, sprints, engineers)
            similar_features: Optional output from Similar Features Agent
        """
        cost = engineer_analysis.get('estimated_cost_usd', 0)
        sprints = engineer_analysis.get('estimated_sprints', 0)
        
        # For standalone testing, industry might be passed in kwargs
        industry = 'banking'
        target_users = None

        logger.info(f"Calculating ROI for: {feature_name}")
        logger.info(f"Cost: ${cost:,} ({sprints} sprints)")

        similar_projects = (similar_features or {}).get('similar_projects', [])

        if similar_projects:
            adoption_rates = [p.get("adoption_rate", 0.0) for p in similar_projects if p.get("adoption_rate", 0.0) > 0]
        else:
            adoption_rates = []

        if not adoption_rates:
            logger.warning("No adoption rates from similar projects, using industry averages")
            adoption_rates = [0.25, 0.35, 0.45]

        worst_case = self._calculate_scenario(cost, min(adoption_rates) * 0.70, "worst_case", target_users, industry)
        base_case = self._calculate_scenario(cost, sum(adoption_rates) / len(adoption_rates), "base_case", target_users, industry)
        best_case = self._calculate_scenario(cost, max(adoption_rates) * 1.20, "best_case", target_users, industry)

        result = {
            "feature_name": feature_name,
            "cost": cost,
            "timestamp": datetime.now().isoformat(),
            "base_case": base_case, # Flatten for easier access
            "worst_case": worst_case,
            "best_case": best_case,
            "recommended_scenario": "base_case",
            "calculation_basis": self._document_calculation_basis(similar_projects, adoption_rates),
            "explicit_assumptions": self._document_assumptions(industry, target_users),
            "data_sources": self._document_data_sources(similar_projects)
        }

        self._save_results(result)
        logger.info(f"ROI calculation complete. Base case ROI: {base_case['roi_percent']:.1f}%")
        return result

    def _calculate_scenario(self, cost: int, adoption_rate: float, scenario_name: str, target_users: Optional[int], industry: str) -> Dict[str, Any]:
        adoption_rate = min(0.95, max(0.01, adoption_rate))
        if target_users is None:
            target_users = 6_000_000 if industry.lower() in ['banking', 'fintech'] else 1_000_000
        
        revenue_per_user_per_year = 3
        projected_users = int(target_users * adoption_rate)
        timeframe_months = 18
        total_revenue = projected_users * revenue_per_user_per_year * (timeframe_months / 12)

        if cost > 0:
            roi_percent = ((total_revenue - cost) / cost) * 100
            payback_period_months = (cost / (total_revenue / timeframe_months)) if total_revenue > 0 else 999
        else:
            roi_percent = 0
            payback_period_months = 999

        return {
            "scenario": scenario_name,
            "roi_percent": round(roi_percent, 1),
            "payback_period_months": round(payback_period_months, 1),
            "projected_revenue_18mo": int(total_revenue),
            "projected_users": projected_users,
            "adoption_rate": round(adoption_rate, 3),
            "revenue_per_user_year": revenue_per_user_per_year,
            "assumptions": f"Adoption: {adoption_rate:.1%}, Revenue: ${revenue_per_user_per_year}/user/year",
            "calculation": f"({projected_users:,} users × ${revenue_per_user_per_year}/yr × 1.5 yr) - ${cost:,} = ${int(total_revenue - cost):,}"
        }

    def _document_calculation_basis(self, similar_projects: List[Dict[str, Any]], adoption_rates: List[float]) -> str:
        if similar_projects:
            project_names = [p.get("name", "Unknown") for p in similar_projects[:3]]
            return f"Based on adoption rates from similar projects: {', '.join(project_names)}"
        return "Based on industry average adoption rates (conservative estimates)"

    def _document_assumptions(self, industry: str, target_users: Optional[int]) -> List[str]:
        assumptions = [
            "Revenue model: $3/user/year INCREMENTAL revenue (increased engagement, cross-sell, churn reduction)",
            "Timeframe: 18 months post-launch",
            "Adoption rates derived from similar PNC projects or industry averages",
            "Cost includes development, testing, deployment (from Engineer Agent estimate)"
        ]
        if target_users:
            assumptions.append(f"Market size: {target_users:,} target users")
        elif industry.lower() in ['banking', 'fintech']:
            assumptions.append("Market size: 10% of PNC customer base (~6M target users)")
        else:
            assumptions.append("Market size: 1M target users (industry standard)")
        return assumptions

    def _document_data_sources(self, similar_projects: List[Dict[str, Any]]) -> List[str]:
        sources = []
        if similar_projects:
            for project in similar_projects:
                name = project.get("name", "Unknown")
                adoption = project.get("adoption_rate", 0.0)
                if adoption > 0:
                    sources.append(f"{name} (adoption: {adoption:.0%}) - PNC historical data")
        if not sources:
            sources.append("Industry averages for banking feature adoption")
        sources.append("PNC 2024 customer metrics (60M+ customers)")
        sources.append("Banking industry revenue-per-user benchmarks")
        return sources

    def _save_results(self, results: Dict[str, Any]) -> None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"roi_{timestamp}.json"
        filepath = os.path.join(self.data_dir, filename)
        try:
            with open(filepath, 'w') as f:
                json.dump(results, f, indent=2)
            logger.info(f"ROI results saved to: {filepath}")
        except Exception as e:
            logger.error(f"Failed to save results: {str(e)}")

async def main():
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    print("=" * 70)
    print("ROI CALCULATOR AGENT - STANDALONE TEST")
    print("=" * 70)
    
    agent = ROICalculatorAgent()

    mock_engineer_analysis = {
        "estimated_cost_usd": 864000,
        "estimated_sprints": 6
    }
    mock_similar_features = {
        "similar_projects": [
            {"name": "Mobile Accept", "adoption_rate": 0.42, "cost": 384000},
            {"name": "Virtual Wallet", "adoption_rate": 0.38, "cost": 720000},
            {"name": "PINACLE Connect", "adoption_rate": 0.35, "cost": 576000}
        ]
    }

    print("TEST: Smart Branch Connect ROI")
    print("-" * 70)

    result = await agent.calculate(
        feature_name="Smart Branch Connect",
        engineer_analysis=mock_engineer_analysis,
        similar_features=mock_similar_features,
        target_users=6_000_000,
        industry="banking"
    )

    print(f"Feature: {result['feature_name']}")
    print(f"Cost: ${result['cost']:,}")
    print("\n📊 ROI SCENARIOS:\n")

    for scenario_name in ["base_case", "worst_case", "best_case"]:
        scenario = result[scenario_name]
        print(f"  {scenario_name.upper().replace('_', ' ')}:")
        print(f"    ROI: {scenario['roi_percent']:.1f}%")
        print(f"    Payback Period: {scenario['payback_period_months']:.1f} months")
        print(f"    Projected Revenue (18mo): ${scenario['projected_revenue_18mo']:,}")
        print()

    print("📋 ASSUMPTIONS:")
    for assumption in result['explicit_assumptions']:
        print(f"  - {assumption}")
    print()

    print("=" * 70)
    print("TEST COMPLETE!")
    print(f"Results saved to: {agent.data_dir}")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(main())
