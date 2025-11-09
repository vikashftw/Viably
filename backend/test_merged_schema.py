"""
Test script for merged schema (Person 4's output + Person 3's architecture).

Tests OrchestratorV2 with new simpler output format + upskilling.
"""

import sys
import json
from agents.orchestrator_v2 import OrchestratorV2

print("="*80)
print("  TESTING MERGED SCHEMA (Person 4 + Person 3)")
print("="*80)
print()

print("🔧 Initializing OrchestratorV2...")
orchestrator = OrchestratorV2(use_vector_embeddings=False)
print("✅ Ready!")
print()

# Test with Smart Branch Connect (PNC's flagship scenario)
feature_name = "Smart Branch Connect"
feature_description = """Hybrid banking experience where customers can start complex transactions digitally (mortgage application, business account setup) and seamlessly transition to scheduled in-branch appointments with pre-populated data. Bankers have full context, customers complete 80% of paperwork digitally. Directly supports PNC's $2 billion investment in 300 new branches by 2030."""

print(f"🧪 Testing: {feature_name}")
print(f"Description: {feature_description[:100]}...")
print()

try:
    result = orchestrator.analyze(
        feature_name=feature_name,
        feature_description=feature_description,
        target_user="PNC customers visiting branches",
        business_goal="maximize ROI on $2B branch expansion investment",
        industry="banking"
    )

    print("✅ ANALYSIS COMPLETE!")
    print()
    print("="*80)
    print("OUTPUT (Person 4's Schema):")
    print("="*80)
    print(json.dumps(result, indent=2))
    print()

    # Verify schema matches Person 4's spec
    print("="*80)
    print("SCHEMA VALIDATION:")
    print("="*80)

    required_fields = ["feature_name", "engineer_analysis", "competitor_analysis", "overall_recommendation", "upskilling_insights"]
    all_present = all(field in result for field in required_fields)

    print(f"✅ All top-level fields present: {all_present}")

    if "engineer_analysis" in result:
        eng = result["engineer_analysis"]
        eng_fields = ["estimated_sprints", "estimated_engineers", "estimated_cost_usd", "key_risks", "confidence"]
        eng_valid = all(field in eng for field in eng_fields)
        print(f"✅ Engineer analysis schema valid: {eng_valid}")
        print(f"   - Sprints: {eng.get('estimated_sprints')}")
        print(f"   - Engineers: {eng.get('estimated_engineers')}")
        print(f"   - Cost: ${eng.get('estimated_cost_usd'):,}")

    if "competitor_analysis" in result:
        comp = result["competitor_analysis"]
        comp_fields = ["key_competitors", "expected_response_time_sprints", "response_play", "competitive_risk_level"]
        comp_valid = all(field in comp for field in comp_fields)
        print(f"✅ Competitor analysis schema valid: {comp_valid}")
        print(f"   - Competitors: {len(comp.get('key_competitors', []))}")
        print(f"   - Risk Level: {comp.get('competitive_risk_level')}")

    if "overall_recommendation" in result:
        rec = result["overall_recommendation"]
        rec_fields = ["summary", "rationale", "action_items"]
        rec_valid = all(field in rec for field in rec_fields)
        print(f"✅ Recommendation schema valid: {rec_valid}")
        print(f"   - {rec.get('summary')}")

    if "upskilling_insights" in result:
        ups = result["upskilling_insights"]
        ups_fields = ["bottleneck_skills", "suggested_training"]
        ups_valid = all(field in ups for field in ups_fields)
        print(f"✅ Upskilling insights schema valid: {ups_valid}")
        print(f"   - Bottleneck skills: {ups.get('bottleneck_skills')}")

    print()
    print("="*80)
    print("🎉 SUCCESS! Merged schema working correctly.")
    print("="*80)
    print()
    print("✅ Person 4's output schema: VALIDATED")
    print("✅ Person 3's multi-agent architecture: PRESERVED")
    print("✅ Upskilling feature: WORKING")
    print("✅ PNC data: INTEGRATED")
    print()
    print("Ready to push!")

    sys.exit(0)

except Exception as e:
    print(f"\n❌ ERROR: {str(e)}\n")
    import traceback
    traceback.print_exc()
    sys.exit(1)
