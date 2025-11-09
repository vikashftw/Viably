"""
Test script for Implementation Planner Agent.

Tests the agent with the "Smart Branch Connect" scenario to ensure:
- Valid output format
- Search patterns generated
- Tasks created with estimates
- File structure suggested
- Results saved to JSON
"""

import sys
import os
import json
import logging

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.implementation_planner_agent import ImplementationPlannerAgent

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def test_smart_branch_connect():
    """
    Test Implementation Planner Agent with Smart Branch Connect scenario.
    """
    print("\n" + "="*80)
    print("TESTING IMPLEMENTATION PLANNER AGENT")
    print("Scenario: Smart Branch Connect (PNC Demo)")
    print("="*80 + "\n")

    # Initialize agent
    agent = ImplementationPlannerAgent()

    # Input data (simulating output from other agents)
    feature_name = "Smart Branch Connect"
    feature_description = """Hybrid banking experience connecting digital and in-branch services.
    Customers can start mortgage applications, business account setup, or investment consultations
    in the PNC Mobile app, then seamlessly transition to in-branch appointments with pre-populated
    data. Branch staff receive full context and customer history. Supports PNC's $2B investment
    in 300 new branches by maximizing ROI on physical infrastructure."""

    # Simulated Engineer Analysis (from Engineer Agent)
    engineer_analysis = {
        "estimated_sprints": 12,
        "estimated_engineers": 8,
        "estimated_cost_usd": 1152000,
        "duration_weeks": 24,
        "team_size": 8,
        "skills_required": ["mobile", "backend", "frontend", "security", "integration"],
        "confidence": 0.75,
        "key_risks": [
            "Integration with existing banking systems",
            "Data synchronization between mobile and branch systems",
            "Security and compliance for customer data sharing"
        ]
    }

    # Simulated Similar Features (from Similar Feature Agent / RAG)
    similar_features = [
        {
            "name": "PNC Mobile Accept",
            "similarity_score": 0.87,
            "cost": 384000,
            "duration_weeks": 16,
            "team_size": 8,
            "skills_required": ["mobile", "payments", "backend", "security"],
            "domain": "payments",
            "complexity": "high"
        },
        {
            "name": "PINACLE Connect",
            "similarity_score": 0.82,
            "cost": 576000,
            "duration_weeks": 20,
            "team_size": 9,
            "skills_required": ["api", "backend", "security", "integration"],
            "domain": "corporate-banking",
            "complexity": "high"
        },
        {
            "name": "Virtual Wallet",
            "similarity_score": 0.78,
            "cost": 720000,
            "duration_weeks": 24,
            "team_size": 10,
            "skills_required": ["frontend", "backend", "mobile", "data-visualization"],
            "domain": "savings",
            "complexity": "high"
        }
    ]

    # Simulated Market Intelligence (optional)
    market_intelligence = {
        "industry_trends": [
            {
                "trend": "Hybrid banking experiences growing 32% YoY",
                "source": "McKinsey Banking Report 2024"
            },
            {
                "trend": "Branch digitization reduces operational costs by 40%",
                "source": "Deloitte Financial Services Study"
            }
        ]
    }

    # Run analysis
    print("Running Implementation Planner Agent...\n")
    result = agent.analyze(
        feature_name=feature_name,
        feature_description=feature_description,
        engineer_analysis=engineer_analysis,
        similar_features=similar_features,
        market_intelligence=market_intelligence
    )

    # Display results
    print("\n" + "-"*80)
    print("IMPLEMENTATION PLAN RESULTS")
    print("-"*80 + "\n")

    print(f"Feature: {feature_name}")
    print(f"Total Estimated Hours: {result.get('total_estimated_hours', 0):,}")
    print(f"High Priority Tasks: {result.get('high_priority_tasks', 0)}")
    print()

    # Search Patterns
    print("SEARCH PATTERNS:")
    search_patterns = result.get('search_patterns', [])
    print(f"  Count: {len(search_patterns)}")
    print(f"  Patterns: {', '.join(search_patterns[:10])}")
    if len(search_patterns) > 10:
        print(f"  ... and {len(search_patterns) - 10} more")
    print()

    # File Types
    print("FILE TYPES TO EXAMINE:")
    file_types = result.get('file_types', [])
    print(f"  {', '.join(file_types)}")
    print()

    # Suggested Directories
    print("SUGGESTED DIRECTORIES:")
    directories = result.get('suggested_directories', [])
    for i, directory in enumerate(directories[:5], 1):
        print(f"  {i}. {directory}")
    if len(directories) > 5:
        print(f"  ... and {len(directories) - 5} more")
    print()

    # Tasks Breakdown
    print("TASK BREAKDOWN:")
    tasks = result.get('tasks', [])
    print(f"  Total Tasks: {len(tasks)}")
    print()

    # Show first 5 tasks
    for i, task in enumerate(tasks[:5], 1):
        print(f"  Task {i}: {task.get('title', 'Untitled')}")
        print(f"    Priority: {task.get('priority', 'unknown').upper()}")
        print(f"    Hours: {task.get('estimated_hours', 0)}")
        print(f"    Skills: {', '.join(task.get('skills_required', []))}")
        print(f"    Description: {task.get('description', 'No description')[:80]}...")
        print()

    if len(tasks) > 5:
        print(f"  ... and {len(tasks) - 5} more tasks")
        print()

    # File Structure
    print("SUGGESTED FILE STRUCTURE:")
    file_structure = result.get('suggested_file_structure', {})
    directories_to_create = file_structure.get('directories', [])
    files_to_create = file_structure.get('files', [])
    print(f"  Directories: {len(directories_to_create)}")
    for directory in directories_to_create[:3]:
        print(f"    - {directory}")
    print(f"  Files: {len(files_to_create)}")
    for file_info in files_to_create[:3]:
        print(f"    - {file_info.get('path', 'unknown')}: {file_info.get('purpose', 'No purpose')}")
    print()

    # Implementation Context
    print("IMPLEMENTATION CONTEXT:")
    context = result.get('implementation_context', '')
    if context:
        # Print first 300 characters
        print(f"  {context[:300]}...")
    else:
        print("  No context provided")
    print()

    # Validation
    print("\n" + "-"*80)
    print("VALIDATION CHECKS")
    print("-"*80 + "\n")

    checks = {
        "Search patterns exist": len(search_patterns) >= 5,
        "File types specified": len(file_types) >= 3,
        "Tasks created": len(tasks) >= 5,
        "Task structure valid": all('title' in t and 'estimated_hours' in t for t in tasks),
        "File structure suggested": len(directories_to_create) > 0 or len(files_to_create) > 0,
        "Implementation context provided": len(context) > 100,
        "Total hours reasonable": 100 <= result.get('total_estimated_hours', 0) <= 20000
    }

    passed = 0
    failed = 0
    for check_name, check_result in checks.items():
        status = "✓ PASS" if check_result else "✗ FAIL"
        print(f"{status}: {check_name}")
        if check_result:
            passed += 1
        else:
            failed += 1

    print(f"\nValidation Summary: {passed}/{len(checks)} checks passed")

    # Check if JSON was saved
    print("\n" + "-"*80)
    print("FILE PERSISTENCE CHECK")
    print("-"*80 + "\n")

    analysis_dir = os.path.join(
        os.path.dirname(__file__),
        "..",
        "data",
        "analysis_history"
    )

    # Find most recent implementation_plan file
    if os.path.exists(analysis_dir):
        files = [f for f in os.listdir(analysis_dir) if f.startswith("implementation_plan_")]
        if files:
            latest_file = sorted(files)[-1]
            filepath = os.path.join(analysis_dir, latest_file)
            file_size = os.path.getsize(filepath)
            print(f"✓ Results saved to: {latest_file}")
            print(f"  File size: {file_size:,} bytes")

            # Verify file is valid JSON
            try:
                with open(filepath, 'r') as f:
                    saved_data = json.load(f)
                print(f"  ✓ Valid JSON structure")
                print(f"  Feature: {saved_data.get('feature_name', 'unknown')}")
            except Exception as e:
                print(f"  ✗ JSON validation failed: {str(e)}")
        else:
            print("✗ No implementation plan files found")
    else:
        print(f"✗ Analysis directory does not exist: {analysis_dir}")

    # Final summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80 + "\n")

    if failed == 0:
        print("✓ ALL TESTS PASSED")
        print(f"\nImplementation Planner Agent successfully generated:")
        print(f"  - {len(search_patterns)} search patterns")
        print(f"  - {len(tasks)} tasks totaling {result.get('total_estimated_hours', 0):,} hours")
        print(f"  - File structure with {len(directories_to_create)} directories and {len(files_to_create)} files")
        print(f"  - Implementation context ({len(context)} characters)")
        return True
    else:
        print(f"✗ {failed} TESTS FAILED")
        print("\nSome validation checks did not pass. Review output above.")
        return False


if __name__ == "__main__":
    try:
        success = test_smart_branch_connect()
        exit_code = 0 if success else 1
        sys.exit(exit_code)
    except Exception as e:
        logger.error(f"Test failed with exception: {str(e)}", exc_info=True)
        print(f"\n✗ TEST FAILED WITH EXCEPTION: {str(e)}")
        sys.exit(1)
