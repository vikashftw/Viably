"""
Test script for the multi-agent system.

Run this to verify all agents work correctly before integrating with FastAPI.

Usage:
    python test_agents.py [--embeddings]

Options:
    --embeddings    Use vector embeddings instead of keyword matching (requires NVIDIA API)
"""

import sys
import json
import logging
from agents.orchestrator import Orchestrator

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


def test_feature(orchestrator, feature_name: str, feature_description: str):
    """Test the orchestrator with a feature."""
    print("\n" + "="*80)
    print(f"TESTING: {feature_name}")
    print("="*80 + "\n")

    try:
        result = orchestrator.analyze(
            feature_name=feature_name,
            feature_description=feature_description,
            industry="fintech"
        )

        # Print executive summary
        print(result.get("summary", "No summary available"))
        print("\n")

        # Print cost details
        cost = result.get("cost_estimate", {})
        print("COST BREAKDOWN:")
        print(f"  Total: ${cost.get('cost', 0):,}")
        print(f"  Hours: {cost.get('hours', 0)}")
        print(f"  Duration: {cost.get('duration_weeks', 0)} weeks")
        print(f"  Team Size: {cost.get('team_size', 0)} engineers")
        print(f"  Skills: {', '.join(cost.get('skills_required', []))}")
        print(f"  Confidence: {cost.get('confidence', 0):.0%}")
        print("\n")

        # Print competitive analysis
        comp = result.get("competitive_analysis", {})
        print("COMPETITIVE ANALYSIS:")
        print(f"  Risk Score: {comp.get('risk_score', 0)}/10")
        print(f"  Market Maturity: {comp.get('market_maturity', 'unknown')}")
        print(f"  Time to Replicate: {comp.get('time_to_replicate', 'unknown')}")
        print(f"  Competitors: {len(comp.get('competitors', []))}")
        for i, competitor in enumerate(comp.get('competitors', [])[:3], 1):
            print(f"    {i}. {competitor.get('name', 'Unknown')} ({competitor.get('market_position', 'unknown')})")
        print("\n")

        # Print recommendation
        rec = result.get("recommendation", {})
        print("STRATEGIC RECOMMENDATION:")
        print(f"  Decision: {rec.get('decision', 'unknown').upper()}")
        print(f"  Priority: {rec.get('priority', 'unknown').upper()}")
        print(f"  Est. ROI: {rec.get('estimated_roi_months', 'unknown')}")
        print(f"  Key Risks:")
        for risk in rec.get('key_risks', []):
            print(f"    - {risk}")
        print("\n")

        return True

    except Exception as e:
        logger.error(f"Test failed for '{feature_name}': {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run test suite."""
    # Check for embeddings flag
    use_embeddings = "--embeddings" in sys.argv

    if use_embeddings:
        print("\n🔬 USING VECTOR EMBEDDINGS (requires NVIDIA API key)")
    else:
        print("\n🔍 USING KEYWORD MATCHING (no API key required)")

    # Initialize orchestrator
    print("\n Initializing agents...")
    orchestrator = Orchestrator(use_vector_embeddings=use_embeddings)

    # Test cases
    test_cases = [
        {
            "name": "Cryptocurrency Payment Integration",
            "description": "Add ability for customers to buy, sell, and hold cryptocurrency (Bitcoin, Ethereum) within the mobile banking app, with real-time price tracking and secure wallet management."
        },
        {
            "name": "Biometric Login with Fingerprint",
            "description": "Implement fingerprint authentication for mobile app login as an alternative to password, using device biometric sensors."
        },
        {
            "name": "AI-Powered Spending Insights",
            "description": "Automatically categorize transactions and provide monthly spending analysis with personalized budget recommendations using machine learning."
        },
        {
            "name": "Business Credit Line Application",
            "description": "Online application flow for small business lines of credit with automated underwriting, document upload, and instant pre-qualification decisions."
        },
        {
            "name": "Real-Time Fraud Detection Alerts",
            "description": "Push notifications for suspicious transactions identified by ML-based fraud detection system, with one-tap confirmation or dispute."
        }
    ]

    # Run tests
    print(f"\n🚀 Running {len(test_cases)} test cases...\n")

    passed = 0
    failed = 0

    for test_case in test_cases:
        success = test_feature(
            orchestrator,
            test_case["name"],
            test_case["description"]
        )
        if success:
            passed += 1
        else:
            failed += 1

        # Pause between tests
        if test_case != test_cases[-1]:
            input("\nPress Enter to continue to next test...\n")

    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    print(f"✅ Passed: {passed}/{len(test_cases)}")
    print(f"❌ Failed: {failed}/{len(test_cases)}")
    print("\n")

    if failed == 0:
        print("🎉 ALL TESTS PASSED! Agent system is working correctly.")
    else:
        print("⚠️  Some tests failed. Check logs above for details.")

    return failed == 0


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
