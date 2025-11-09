import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateImplementation } from './services/nemotron-codegen.js';
import { createPullRequest } from './services/pr-automation.js';
import { assignTeam } from './services/team-matcher.js';
import { searchCodebase } from './services/codebase-search.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Viably Automation Service',
    version: '1.0.0'
  });
});

app.post('/api/implementation-flow', async (req, res) => {
  try {
    const { viably_analysis, target_repo, search_context } = req.body;

    if (!viably_analysis || !target_repo) {
      return res.status(400).json({ error: 'Missing required fields: viably_analysis, target_repo' });
    }

    console.log('\n=== IMPLEMENTATION FLOW STARTED ===');
    console.log(`Feature: ${viably_analysis.feature_name}`);

    // STEP 1: Search Codebase
    console.log('\n[STEP 1/4] Searching codebase...');
    const searchResults = await searchCodebase(search_context, target_repo);
    console.log(`Found ${searchResults.total_matches} matches in ${searchResults.files_found.length} files`);

    // STEP 2: Generate Implementation Plan with NVIDIA Nemotron
    console.log('\n[STEP 2/4] Generating implementation with NVIDIA Nemotron...');
    const implementation = await generateImplementation(viably_analysis, searchResults);
    console.log(`Generated ${implementation.file_structure?.length || 0} files, ${implementation.tasks?.length || 0} tasks`);

    // STEP 3: Assign Team
    console.log('\n[STEP 3/4] Assigning team members...');
    const teamAssignments = await assignTeam(
      implementation.tasks || [],
      viably_analysis.upskilling_insights
    );
    console.log(`Assigned ${teamAssignments.assignments.length} tasks to team`);

    // STEP 4: Create GitHub PR
    console.log('\n[STEP 4/4] Creating GitHub PR...');
    const prResult = await createPullRequest(
      target_repo,
      implementation,
      teamAssignments.assignments,
      viably_analysis
    );
    console.log(`PR created: ${prResult.url}`);

    console.log('\n=== IMPLEMENTATION FLOW COMPLETED ===\n');

    res.json({
      success: true,
      search_results: searchResults,
      implementation,
      team_assignments: teamAssignments.assignments,
      training_needed: teamAssignments.training_needed,
      pr_details: prResult
    });

  } catch (error) {
    console.error('\n=== IMPLEMENTATION FLOW FAILED ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);

    res.status(500).json({
      error: 'Implementation flow failed',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n✓ Viably Automation Service running on port ${PORT}`);
  console.log(`✓ Health check: http://localhost:${PORT}/health`);
  console.log(`✓ API endpoint: http://localhost:${PORT}/api/implementation-flow\n`);
});
