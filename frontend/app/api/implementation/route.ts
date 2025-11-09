import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { analysis_id, target_repo } = body;

    // Validate request
    if (!analysis_id) {
      return NextResponse.json(
        { error: 'Missing analysis_id', details: 'analysis_id is required' },
        { status: 400 }
      );
    }

    if (!target_repo || !target_repo.owner || !target_repo.repo || !target_repo.branch) {
      return NextResponse.json(
        { error: 'Invalid target_repo', details: 'target_repo must include owner, repo, and branch' },
        { status: 400 }
      );
    }

    // Get backend URL from environment or use default
    const viablyBackend = process.env.VIABLY_BACKEND_URL || 'http://localhost:8000';

    console.log(`[Implementation API] Triggering implementation for analysis ${analysis_id}`);
    console.log(`[Implementation API] Target repo: ${target_repo.owner}/${target_repo.repo}@${target_repo.branch}`);

    // Call backend implementation endpoint
    const response = await fetch(`${viablyBackend}/api/trigger-implementation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        analysis_id,
        target_repo
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Implementation API] Backend error: ${response.status} - ${errorText}`);

      return NextResponse.json(
        {
          error: 'Backend implementation trigger failed',
          details: `Backend returned ${response.status}: ${errorText}`
        },
        { status: response.status }
      );
    }

    const result = await response.json();

    console.log(`[Implementation API] Success - PR #${result.pr_number} created`);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[Implementation API] Error:', error);

    return NextResponse.json(
      {
        error: 'Implementation request failed',
        details: error.message || 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    endpoint: '/api/implementation',
    methods: ['POST']
  });
}
