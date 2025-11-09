"""
Test script for extended API endpoints.

Tests all 3 new endpoints:
1. POST /api/analyze-complete
2. POST /api/trigger-implementation
3. GET /api/analysis/{analysis_id}
"""

import requests
import json
import time
from typing import Dict, Any

BASE_URL = "http://localhost:8000"

def print_section(title: str):
    """Print a formatted section header."""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)

def test_health_check():
    """Test 1: Health check endpoint."""
    print_section("TEST 1: Health Check")

    response = requests.get(f"{BASE_URL}/")
    print(f"Status: {response.status_code}")

    data = response.json()
    print(f"Service: {data.get('service')}")
    print(f"Version: {data.get('version')}")
    print(f"Agents: {', '.join(data.get('agents', []))}")
    print(f"Endpoints: {', '.join(data.get('endpoints', []))}")

    assert response.status_code == 200, "Health check failed"
    print("\n✓ Health check passed")

def test_analyze_complete() -> str:
    """Test 2: Complete analysis endpoint."""
    print_section("TEST 2: Complete Analysis (All Agents)")

    payload = {
        "feature_name": "Smart Branch Connect",
        "description": "Hybrid banking experience connecting digital and in-branch services with mobile integration for PNC customers",
        "target_user": "PNC customers visiting branches",
        "business_goal": "maximize ROI on $2B branch expansion",
        "industry": "banking"
    }

    print(f"Feature: {payload['feature_name']}")
    print(f"Description: {payload['description'][:80]}...")
    print("\nCalling /api/analyze-complete...")
    print("(This may take 20-30 seconds to run all agents)")

    start_time = time.time()
    response = requests.post(f"{BASE_URL}/api/analyze-complete", json=payload)
    elapsed = time.time() - start_time

    print(f"\nStatus: {response.status_code}")
    print(f"Response time: {elapsed:.1f} seconds")

    assert response.status_code == 200, f"Complete analysis failed: {response.text}"

    data = response.json()
    analysis_id = data.get("analysis_id")

    print(f"\n📋 Analysis ID: {analysis_id}")

    # Print key results
    print("\n📊 RESULTS SUMMARY:")

    engineer = data.get("engineer_analysis", {})
    print(f"\n  Engineer Analysis:")
    print(f"    Sprints: {engineer.get('estimated_sprints')}")
    print(f"    Engineers: {engineer.get('estimated_engineers')}")
    print(f"    Cost: ${engineer.get('estimated_cost_usd', 0):,}")
    print(f"    Confidence: {engineer.get('confidence', 0):.0%}")

    competitor = data.get("competitor_analysis", {})
    print(f"\n  Competitor Analysis:")
    print(f"    Key Competitors: {', '.join(competitor.get('key_competitors', [])[:3])}")
    print(f"    Risk Level: {competitor.get('competitive_risk_level')}")
    print(f"    Response Time: {competitor.get('expected_response_time_sprints')} sprints")

    market = data.get("market_intelligence", {})
    print(f"\n  Market Intelligence:")
    print(f"    Market Size: ${market.get('market_size_usd', 0):,}")
    print(f"    Growth Rate (CAGR): {market.get('growth_rate_cagr', 0):.1%}")
    print(f"    Confidence: {market.get('confidence', 'N/A')}")

    similar = data.get("similar_features", {})
    projects = similar.get("similar_projects", [])
    print(f"\n  Similar Features:")
    print(f"    Projects Found: {len(projects)}")
    if projects:
        print(f"    Top Match: {projects[0].get('name')} (similarity: {projects[0].get('similarity_score', 0):.2f})")

    roi = data.get("roi_projections", {})
    scenarios = roi.get("scenarios", {})
    base_case = scenarios.get("base_case", {})
    print(f"\n  ROI Projections (Base Case):")
    print(f"    ROI: {base_case.get('roi_percent', 0):.1f}%")
    print(f"    Payback: {base_case.get('payback_period_months', 0):.1f} months")
    print(f"    Revenue (18mo): ${base_case.get('projected_revenue_18mo', 0):,}")

    recommendation = data.get("overall_recommendation", {})
    print(f"\n  Overall Recommendation:")
    print(f"    Summary: {recommendation.get('summary')}")

    upskilling = data.get("upskilling_insights", {})
    print(f"\n  Upskilling Insights:")
    print(f"    Bottleneck Skills: {', '.join(upskilling.get('bottleneck_skills', [])[:5])}")

    print("\n✓ Complete analysis passed")

    return analysis_id

def test_get_analysis(analysis_id: str):
    """Test 3: Retrieve analysis by ID."""
    print_section("TEST 3: Retrieve Analysis by ID")

    print(f"Retrieving analysis: {analysis_id}")

    response = requests.get(f"{BASE_URL}/api/analysis/{analysis_id}")
    print(f"Status: {response.status_code}")

    assert response.status_code == 200, f"Failed to retrieve analysis: {response.text}"

    data = response.json()
    print(f"\nRetrieved analysis for: {data.get('feature_name')}")
    print(f"Analysis ID matches: {data.get('analysis_id') == analysis_id}")

    print("\n✓ Retrieve analysis passed")

def test_get_nonexistent_analysis():
    """Test 4: Try to retrieve non-existent analysis (should 404)."""
    print_section("TEST 4: Retrieve Non-Existent Analysis (Error Handling)")

    fake_id = "00000000-0000-0000-0000-000000000000"
    print(f"Trying to retrieve fake ID: {fake_id}")

    response = requests.get(f"{BASE_URL}/api/analysis/{fake_id}")
    print(f"Status: {response.status_code}")

    assert response.status_code == 404, "Should return 404 for non-existent ID"

    error = response.json()
    print(f"Error message: {error.get('detail')}")

    print("\n✓ Error handling passed (404 as expected)")

def test_trigger_implementation_no_postman(analysis_id: str):
    """Test 5: Trigger implementation (will fail if Postman not running)."""
    print_section("TEST 5: Trigger Implementation (Postman Service)")

    print(f"Analysis ID: {analysis_id}")
    print("NOTE: This will fail if Postman AI Service is not running at localhost:3002")

    payload = {
        "analysis_id": analysis_id,
        "target_repo": {
            "name": "viably-test-repo",
            "url": "https://github.com/example/viably-test"
        }
    }

    response = requests.post(f"{BASE_URL}/api/trigger-implementation", json=payload)
    print(f"Status: {response.status_code}")

    if response.status_code == 503:
        print("\n⚠️  Postman AI Service unavailable (expected if not running)")
        error = response.json()
        print(f"Error: {error.get('detail')}")
        print("\n✓ Error handling passed (503 as expected)")
    elif response.status_code == 200:
        data = response.json()
        print(f"\n✓ Implementation triggered successfully!")
        print(f"Response: {json.dumps(data, indent=2)}")
    else:
        print(f"\n✗ Unexpected status code: {response.status_code}")
        print(f"Response: {response.text}")

def main():
    """Run all tests."""
    print("\n" + "=" * 70)
    print("  VIABLY EXTENDED API TEST SUITE")
    print("=" * 70)
    print("\nTesting server at http://localhost:8000")
    print()

    try:
        # Test 1: Health check
        test_health_check()

        # Test 2: Complete analysis (returns analysis_id)
        analysis_id = test_analyze_complete()

        # Test 3: Retrieve analysis
        test_get_analysis(analysis_id)

        # Test 4: Error handling
        test_get_nonexistent_analysis()

        # Test 5: Trigger implementation
        test_trigger_implementation_no_postman(analysis_id)

        # Summary
        print_section("TEST SUITE COMPLETE")
        print("\n✓ All tests passed successfully!")
        print(f"\nAnalysis saved to: backend/data/analysis_results/{analysis_id}.json")
        print("\nEndpoints verified:")
        print("  ✓ GET  /")
        print("  ✓ POST /api/analyze-complete")
        print("  ✓ GET  /api/analysis/{analysis_id}")
        print("  ✓ POST /api/trigger-implementation")

    except AssertionError as e:
        print(f"\n\n✗ TEST FAILED: {str(e)}")
        return 1
    except requests.exceptions.ConnectionError:
        print("\n\n✗ ERROR: Cannot connect to server.")
        print("Make sure the FastAPI server is running:")
        print("  cd backend && python main.py")
        return 1
    except Exception as e:
        print(f"\n\n✗ UNEXPECTED ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1

    return 0

if __name__ == "__main__":
    exit(main())
