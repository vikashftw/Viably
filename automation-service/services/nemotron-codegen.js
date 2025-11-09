/**
 * NVIDIA Nemotron Code Generation Service
 * Generates detailed implementation plans from Viably analysis data
 * Uses NVIDIA NIM API for code generation
 */

const NVIDIA_API_BASE = 'https://integrate.api.nvidia.com/v1';
const NEMOTRON_MODEL = process.env.NEMOTRON_MODEL || 'nvidia/llama-3.1-nemotron-nano-8b-v1';
const TEMPERATURE = 0.2; // Lower for faster, more focused responses
const MAX_TOKENS = 2048; // Reduced for faster response while maintaining quality

/**
 * Generate implementation plan from Viably analysis and codebase search
 */
export async function generateImplementation(viablyAnalysis, searchResults) {
  try {
    console.log('[Nemotron] Generating implementation plan...');

    const prompt = buildImplementationPrompt(viablyAnalysis, searchResults);

    const response = await fetch(`${NVIDIA_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: NEMOTRON_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert software architect at PNC Bank creating detailed implementation plans. Generate structured JSON responses for feature development.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: TEMPERATURE,
        max_tokens: MAX_TOKENS
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[Nemotron] API Error Response:', errorBody);
      throw new Error(`NVIDIA API error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    console.log('[Nemotron] API Response:', JSON.stringify(data, null, 2));

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('[Nemotron] Invalid response structure:', data);
      throw new Error('Invalid response structure from NVIDIA API');
    }

    const responseText = data.choices[0].message.content;

    console.log('[Nemotron] Received response, parsing...');

    const implementation = parseNemotronResponse(responseText);

    // Generate PR description
    implementation.pr_description = generatePRDescription(viablyAnalysis, implementation);

    console.log('[Nemotron] Implementation plan generated successfully');
    return implementation;

  } catch (error) {
    console.error('[Nemotron] Error generating implementation:', error);

    // Return fallback structure on error
    return {
      file_structure: [
        {
          path: `src/features/${sanitizeFeatureName(viablyAnalysis.feature_name)}/index.tsx`,
          type: 'component',
          purpose: 'Main feature component',
          estimated_lines: 200
        }
      ],
      tasks: [
        {
          id: 'task_001',
          title: 'Implement feature',
          description: 'Error generating plan - manual planning required',
          skills_required: ['frontend'],
          estimated_hours: 40,
          priority: 'high'
        }
      ],
      pr_description: `# ${viablyAnalysis.feature_name}\n\nError: ${error.message}`,
      error: error.message
    };
  }
}

/**
 * Build comprehensive prompt for NVIDIA Nemotron
 */
function buildImplementationPrompt(viablyAnalysis, searchResults) {
  const {
    feature_name,
    engineer_analysis = {},
    competitor_analysis = {},
    similar_features = {},
    roi_scenarios = {},
    overall_recommendation = {}
  } = viablyAnalysis;

  const {
    estimated_cost_usd = 0,
    estimated_sprints = 0,
    estimated_engineers = 0,
    key_risks = []
  } = engineer_analysis;

  const similarProjects = similar_features?.similar_projects || [];
  const baseCase = roi_scenarios?.base_case || {};
  const { files_found = [], is_new_feature = true } = searchResults;

  const featureSlug = sanitizeFeatureName(feature_name);

  return `Create implementation plan for: ${feature_name}

SCOPE: $${estimated_cost_usd.toLocaleString()}, ${estimated_sprints} sprints, ${estimated_engineers} engineers
${is_new_feature ? 'NEW feature' : `Related: ${files_found.slice(0, 3).join(', ')}`}

Generate JSON (no markdown):
{
  "file_structure": [
    {"path": "src/features/${featureSlug}/SmartComponent.tsx", "type": "component", "purpose": "Main UI", "estimated_lines": 200},
    {"path": "src/features/${featureSlug}/service.ts", "type": "service", "purpose": "Business logic", "estimated_lines": 150},
    {"path": "src/features/${featureSlug}/api.ts", "type": "api", "purpose": "Backend calls", "estimated_lines": 100},
    {"path": "src/features/${featureSlug}/__tests__/component.test.tsx", "type": "test", "purpose": "Tests", "estimated_lines": 80}
  ],
  "tasks": [{"id": "task_001", "title": "Build X", "description": "Detailed steps", "skills_required": ["mobile"], "estimated_hours": 16, "priority": "high", "dependencies": []}]
}

IMPORTANT: Use specific file names (not "File.tsx"). Base names on feature: "${feature_name}".
Generate 5-8 files, 8-10 tasks. Return ONLY valid JSON.`;
}

/**
 * Parse Nemotron response into structured data
 */
function parseNemotronResponse(responseText) {
  try {
    let cleanedText = responseText.trim();

    // Remove markdown code blocks
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.slice(7);
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.slice(3);
    }

    if (cleanedText.endsWith('```')) {
      cleanedText = cleanedText.slice(0, -3);
    }

    cleanedText = cleanedText.trim();

    const parsed = JSON.parse(cleanedText);

    if (!parsed.file_structure || !Array.isArray(parsed.file_structure)) {
      throw new Error('Invalid file_structure');
    }

    if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
      throw new Error('Invalid tasks');
    }

    return parsed;

  } catch (error) {
    console.error('[Nemotron] Parse error:', error);

    return {
      file_structure: [
        {
          path: 'src/features/new-feature/index.tsx',
          type: 'component',
          purpose: 'Main component',
          estimated_lines: 200
        }
      ],
      tasks: [
        {
          id: 'task_001',
          title: 'Implement feature',
          description: 'Parse error - manual planning required',
          skills_required: ['frontend'],
          estimated_hours: 40,
          priority: 'high',
          dependencies: []
        }
      ],
      parse_error: error.message
    };
  }
}

/**
 * Generate PR description with ROI data
 */
function generatePRDescription(viablyAnalysis, implementation) {
  const {
    feature_name,
    engineer_analysis = {},
    roi_projections = {},
    overall_recommendation = {},
    competitor_analysis = {}
  } = viablyAnalysis;

  // Debug logging to trace data issues
  console.log('[Nemotron] PR Debug - ROI Data:', JSON.stringify(roi_projections, null, 2));
  console.log('[Nemotron] PR Debug - Competitor Data:', JSON.stringify(competitor_analysis, null, 2));
  console.log('[Nemotron] PR Debug - Engineer Data:', JSON.stringify(engineer_analysis, null, 2));

  // Extract ROI data with correct nested structure
  const baseCase = roi_projections?.scenarios?.base_case || {};
  const roiPercent = baseCase.roi_percent || baseCase.roi_percentage || baseCase.roi || 0;
  const paybackMonths = baseCase.payback_period_months || baseCase.payback_months || baseCase.payback_period || 'N/A';
  const projectedRevenue = baseCase.projected_revenue_18mo || baseCase.revenue_18mo || baseCase.projected_revenue || 0;

  // Calculate realistic total effort (team capacity, not just task hours)
  const sprintsCount = engineer_analysis.estimated_sprints || 4;
  const engineersCount = engineer_analysis.estimated_engineers || 5;
  const totalHours = sprintsCount * engineersCount * 80; // 80 hours per engineer per sprint
  const taskHours = implementation.tasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0);

  const totalCost = engineer_analysis.estimated_cost_usd || 0;

  // Extract response time with fallbacks
  const responseTimeSprints = competitor_analysis.expected_response_time_sprints ||
                               competitor_analysis.response_time_sprints ||
                               4;

  return `# ${feature_name}

## Executive Summary
${overall_recommendation.summary || 'Feature implementation recommended'}

**Cost:** $${totalCost.toLocaleString()}
**Duration:** ${sprintsCount} sprints (${sprintsCount * 2} weeks)
**Team Size:** ${engineersCount} engineers
**Total Effort:** ${totalHours} hours (${engineersCount} engineers × ${sprintsCount} sprints)

## ROI Analysis

### Base Case
- **ROI:** ${roiPercent}%
- **Payback Period:** ${paybackMonths} months
- **Projected Revenue (18mo):** $${projectedRevenue.toLocaleString()}

## Competitive Analysis
**Risk Level:** ${competitor_analysis.competitive_risk_level || 'UNKNOWN'}
**Key Competitors:** ${competitor_analysis.key_competitors?.join(', ') || 'None'}
**Expected Response Time:** ${responseTimeSprints} sprints (${responseTimeSprints * 2} weeks)

## Implementation Overview

### Files Created (${implementation.file_structure.length})
${implementation.file_structure.slice(0, 8).map(file =>
  `- \`${file.path}\` (${file.type}): ${file.purpose}`
).join('\n')}

### Key Tasks (${implementation.tasks.length})
${implementation.tasks.slice(0, 5).map((task, i) =>
  `${i + 1}. **${task.title}** (${task.estimated_hours}h, ${task.priority})`
).join('\n')}

## Risks
${engineer_analysis.key_risks?.map(risk => `- ${risk}`).join('\n') || '- No major risks identified'}

---

Generated by **Viably AI** - Product Sandbox War Game
Powered by **NVIDIA Nemotron** for intelligent code generation
`;
}

function sanitizeFeatureName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default { generateImplementation };
