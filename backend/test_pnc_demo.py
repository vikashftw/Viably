"""
PNC-SPECIFIC DEMO TEST SCRIPT

Tests the agent system with real PNC-relevant scenarios for hackathon demo.
Based on actual PNC initiatives and strategic priorities.
"""

import sys
import logging
from agents.orchestrator import Orchestrator

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


def print_header(text):
    """Print formatted header."""
    print("\n" + "="*80)
    print(f"  {text}")
    print("="*80 + "\n")


def print_section(title, data):
    """Print formatted section."""
    print(f"\n{'─'*80}")
    print(f"  {title}")
    print(f"{'─'*80}")
    for key, value in data.items():
        if isinstance(value, list):
            print(f"  {key}: {', '.join(str(v) for v in value[:3])}{'...' if len(value) > 3 else ''}")
        elif isinstance(value, dict):
            print(f"  {key}: {{...}}")
        else:
            print(f"  {key}: {value}")


def test_pnc_scenario(orchestrator, scenario_name, feature_name, description):
    """Test a PNC demo scenario."""
    print_header(f"PNC DEMO: {scenario_name}")

    print(f"Feature: {feature_name}")
    print(f"Description: {description[:120]}...")
    print()

    try:
        result = orchestrator.analyze(
            feature_name=feature_name,
            feature_description=description,
            industry="banking"
        )

        # Cost Estimate
        cost = result.get('cost_estimate', {})
        print_section("💰 COST ESTIMATE", {
            "Total Cost": f"${cost.get('cost', 0):,}",
            "Hours": f"{cost.get('hours', 0):,}",
            "Duration": f"{cost.get('duration_weeks', 0)} weeks",
            "Team Size": f"{cost.get('team_size', 0)} engineers",
            "Complexity": cost.get('complexity', 'unknown'),
            "Confidence": f"{cost.get('confidence', 0):.0%}",
            "Skills Required": cost.get('skills_required', [])
        })

        # Competitive Analysis
        comp = result.get('competitive_analysis', {})
        competitors = comp.get('competitors', [])
        print_section("🏆 COMPETITIVE ANALYSIS", {
            "Risk Score": f"{comp.get('risk_score', 0)}/10",
            "Market Maturity": comp.get('market_maturity', 'unknown'),
            "Time to Replicate": comp.get('time_to_replicate', 'unknown'),
            "Competitors Found": len(competitors),
            "Top Competitors": [c.get('name', 'Unknown') for c in competitors[:3]],
            "Strategic Rec": comp.get('strategic_recommendation', 'unknown')
        })

        # Recommendation
        rec = result.get('recommendation', {})
        print_section("📊 STRATEGIC RECOMMENDATION", {
            "Decision": rec.get('decision', 'unknown').upper(),
            "Priority": rec.get('priority', 'unknown').upper(),
            "ROI Timeline": rec.get('estimated_roi_months', 'unknown'),
            "Rationale": rec.get('rationale', 'N/A')[:120] + "..."
        })

        print_section("✅ PNC-SPECIFIC INSIGHTS", {
            "Similar PNC Projects": cost.get('similar_projects_found', 0),
            "RAG Mode": cost.get('rag_mode', 'unknown'),
            "Search Performed": "Yes" if comp.get('search_performed') else "No"
        })

        print(f"\n{'='*80}\n")
        return True

    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}\n")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run PNC demo scenarios."""
    print_header("PNC HACKATHON DEMO TEST")
    print("Testing multi-agent system with real PNC scenarios")
    print("Based on actual PNC initiatives: Mobile Accept, PINACLE Connect, Branch Expansion")
    print()

    # Initialize orchestrator
    print("🔧 Initializing orchestrator (keyword matching for speed)...")
    orchestrator = Orchestrator(use_vector_embeddings=False)
    print("✅ Ready!\n")

    # Demo scenarios
    scenarios = [
        {
            "name": "🏢 FLAGSHIP: Smart Branch Connect (Aligns with $2B Branch Strategy)",
            "feature": "Smart Branch Connect",
            "description": """Hybrid banking experience where customers can start complex transactions digitally (mortgage application, business account setup, investment planning) and seamlessly transition to scheduled in-branch appointments with pre-populated data. Bankers have full context before meeting, customers can complete 80% of paperwork digitally, and appointments are optimized based on banker expertise and customer needs. Includes virtual queue management and real-time branch capacity visibility. This directly supports PNC's $2 billion investment in opening 300 new branches by 2030 while maximizing digital efficiency."""
        },
        {
            "name": "💼 Corporate: AI Treasury Forecasting (Builds on PINACLE Success)",
            "feature": "AI Treasury Forecasting Platform",
            "description": """Real-time cash flow forecasting for corporate treasury teams using AI to predict receivables, payables, and liquidity needs based on historical patterns, invoice data, and market conditions. Integrates with PINACLE Connect and Workday ERP (recent PNC partnership). Provides automated scenario planning, working capital optimization recommendations, and fraud anomaly detection. Targets mid-market and enterprise clients using PNC's corporate banking services."""
        },
        {
            "name": "📱 Mobile: Gig Economy Banking Hub (Extends Mobile Accept)",
            "feature": "Gig Economy Banking Hub",
            "description": """Dedicated mobile banking experience for gig workers (Uber, DoorDash, Instacart, freelancers) with instant earnings deposits, automated tax withholding, expense categorization by gig platform, income smoothing features, and integrated payment acceptance for side hustles. Includes API partnerships with major gig platforms for real-time earnings visibility and cash flow management. Natural extension of PNC Mobile Accept's micro-business focus."""
        }
    ]

    passed = 0
    failed = 0

    for scenario in scenarios:
        success = test_pnc_scenario(
            orchestrator,
            scenario["name"],
            scenario["feature"],
            scenario["description"]
        )

        if success:
            passed += 1
        else:
            failed += 1

        # Pause between scenarios
        if scenario != scenarios[-1]:
            input("Press Enter to continue to next scenario...\n")

    # Summary
    print_header("DEMO TEST SUMMARY")
    print(f"✅ Passed: {passed}/{len(scenarios)}")
    print(f"❌ Failed: {failed}/{len(scenarios)}")
    print()

    if failed == 0:
        print("🎉 ALL PNC DEMO SCENARIOS WORKING!")
        print()
        print("💡 DEMO RECOMMENDATION:")
        print("   Use 'Smart Branch Connect' as your PRIMARY demo")
        print("   - Directly aligns with PNC's announced $2B branch investment")
        print("   - Shows you understand their strategic priorities")
        print("   - Most impressive to judges")
        print()
    else:
        print("⚠️  Some tests failed. Check errors above.")

    print("="*80 + "\n")

    return failed == 0


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
