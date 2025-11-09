# Implementation Flow - Architecture Diagram

## User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  USER JOURNEY                                                    │
└─────────────────────────────────────────────────────────────────┘

1. User analyzes "Smart Branch Connect" feature
   │
   ↓
2. Analysis results displayed (Engineer, Competitor, Recommendation)
   │
   ↓
3. User clicks "Start Implementation" button
   │
   ↓
4. Navigates to /implementation/smart-branch-20250108-143022
   │
   ↓
5. Implementation Flow component loads
   │
   ↓
6. Watches 4 steps animate:
   [●] Search → [●] Generate → [●] PR → [●] Assign
   │
   ↓
7. Views results:
   - GitHub PR link
   - Team assignments
   - Training recommendations
   │
   ↓
8. Clicks "View PR on GitHub" to verify real code
```

## Component Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js)                                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  /implementation/[id]/page.tsx                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  - Extracts analysis ID from URL                           │ │
│  │  - Renders ImplementationFlow component                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                         │                                         │
│                         ↓                                         │
│  components/ImplementationFlow.tsx                               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  STATE MANAGEMENT                                          │ │
│  │  - steps: FlowStep[]                                       │ │
│  │  - result: ImplementationResult | null                     │ │
│  │  - error: string | null                                    │ │
│  │                                                             │ │
│  │  LIFECYCLE                                                  │ │
│  │  useEffect(() => {                                         │ │
│  │    executeFlow()  ←── Triggers on mount                   │ │
│  │  }, [])                                                     │ │
│  │                                                             │ │
│  │  FLOW EXECUTION                                             │ │
│  │  1. Update step 1 → in_progress                           │ │
│  │  2. Call POST /api/implementation                          │ │
│  │  3. Simulate progress bars while waiting                  │ │
│  │  4. On response: Update steps → completed                 │ │
│  │  5. Display results                                        │ │
│  │                                                             │ │
│  │  RENDER                                                     │ │
│  │  - StepIndicator (for each step)                          │ │
│  │  - Results (PR card, files, team, training)               │ │
│  │  - Error banner (if error)                                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                         │                                         │
│                         ↓ POST /api/implementation                │
│  api/implementation/route.ts                                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  export async function POST(request) {                     │ │
│  │    const { analysis_id, target_repo } = request.json()    │ │
│  │    fetch(backend + '/api/trigger-implementation')          │ │
│  │    return response                                         │ │
│  │  }                                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                            ↓ POST /api/trigger-implementation
┌──────────────────────────────────────────────────────────────────┐
│  BACKEND (FastAPI)                                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  @app.post("/api/trigger-implementation")                        │
│  async def trigger_implementation(request: dict):                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  STEP 1: SEARCH CODEBASE                                   │ │
│  │  - Use Ripgrep to find related files                       │ │
│  │  - Search for similar patterns/components                  │ │
│  │  - Identify integration points                             │ │
│  │                                                             │ │
│  │  STEP 2: GENERATE IMPLEMENTATION                           │ │
│  │  - Claude AI analyzes similar code                         │ │
│  │  - Generates file structure                                │ │
│  │  - Creates scaffolded code                                 │ │
│  │                                                             │ │
│  │  STEP 3: CREATE GITHUB PR                                  │ │
│  │  - Initialize git branch                                   │ │
│  │  - Write generated files                                   │ │
│  │  - Commit with description                                 │ │
│  │  - Push to GitHub                                          │ │
│  │  - Open pull request via GitHub API                        │ │
│  │                                                             │ │
│  │  STEP 4: ASSIGN TEAM                                       │ │
│  │  - Match required skills to engineers                      │ │
│  │  - Assign files based on expertise                         │ │
│  │  - Identify skill gaps → training needs                    │ │
│  │                                                             │ │
│  │  RETURN:                                                    │ │
│  │  {                                                          │ │
│  │    pr_url, pr_number, branch_name,                         │ │
│  │    files_created, team_assignments,                        │ │
│  │    training_recommendations                                │ │
│  │  }                                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## Step-by-Step Flow

```
TIME: 0s
┌──────────────────────────────────────────────────────────────┐
│ STEP 1: SEARCHING CODEBASE                                   │
│ [◐] Using Ripgrep to find related files...                  │
│ [▓▓▓▓▓░░░░░░] 40%                                           │
└──────────────────────────────────────────────────────────────┘

TIME: 0.5s
┌──────────────────────────────────────────────────────────────┐
│ STEP 1: SEARCHING CODEBASE                      ✓ 0.5s      │
│ [●] Using Ripgrep to find related files...                  │
│                                                               │
│ STEP 2: GENERATING IMPLEMENTATION                            │
│ [◐] Claude AI creating file structure...                    │
│ [▓▓▓▓▓▓▓░░░░░] 60%                                          │
└──────────────────────────────────────────────────────────────┘

TIME: 2.3s
┌──────────────────────────────────────────────────────────────┐
│ STEP 1: SEARCHING CODEBASE                      ✓ 0.5s      │
│ STEP 2: GENERATING IMPLEMENTATION                ✓ 1.8s      │
│                                                               │
│ STEP 3: CREATING GITHUB PR                                   │
│ [◐] Scaffolding code and opening PR...                      │
│ [▓▓▓░░░░░░░░] 25%                                           │
└──────────────────────────────────────────────────────────────┘

TIME: 3.5s
┌──────────────────────────────────────────────────────────────┐
│ STEP 1: SEARCHING CODEBASE                      ✓ 0.5s      │
│ STEP 2: GENERATING IMPLEMENTATION                ✓ 1.8s      │
│ STEP 3: CREATING GITHUB PR                      ✓ 1.2s      │
│                                                               │
│ STEP 4: ASSIGNING TEAM MEMBERS                               │
│ [◐] Matching skills to engineers...                         │
│ [▓▓▓▓▓▓▓▓▓░░░] 75%                                          │
└──────────────────────────────────────────────────────────────┘

TIME: 4.2s
┌──────────────────────────────────────────────────────────────┐
│ ✓ IMPLEMENTATION COMPLETE                                    │
│   Completed in 4.2s                                          │
│                                                               │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ PULL REQUEST CREATED                                   │  │
│ │ PR #42: feature/smart-branch-connect                   │  │
│ │ [View on GitHub →]                                     │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                               │
│ FILES CREATED (3)                                             │
│ + src/features/smart-branch/index.ts                         │
│ + src/features/smart-branch/components/BranchConnector.tsx   │
│ + src/features/smart-branch/api/branch-api.ts                │
│                                                               │
│ TEAM ASSIGNMENTS (2)                                          │
│ ┌──────────────────────┐  ┌──────────────────────┐          │
│ │ Sarah Chen           │  │ Mike Rodriguez       │          │
│ │ [React] [TypeScript] │  │ [API] [Backend]      │          │
│ │ 2 files assigned     │  │ 1 file assigned      │          │
│ └──────────────────────┘  └──────────────────────┘          │
│                                                               │
│ TRAINING RECOMMENDATIONS (1)                                  │
│ ⚠ Security - OWASP Top 10 for Banking Apps                  │
│   Feature involves sensitive customer data                   │
└──────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. User navigates to /implementation/smart-branch-20250108
       ↓
┌─────────────────────────────────────────┐
│  ImplementationFlow Component           │
│  - analysisId: "smart-branch-20250108"  │
│  - targetRepo: {owner, repo, branch}    │
└──────┬──────────────────────────────────┘
       │
       │ 2. useEffect triggers executeFlow()
       ↓
┌─────────────────────────────────────────┐
│  executeFlow() {                        │
│    updateStep('search', in_progress)    │
│    ↓                                    │
│    fetch('/api/implementation', {       │
│      analysis_id,                       │
│      target_repo                        │
│    })                                   │
│    ↓                                    │
│    response.json()                      │
│    ↓                                    │
│    setResult(data)                      │
│  }                                      │
└──────┬──────────────────────────────────┘
       │
       │ 3. POST /api/implementation
       ↓
┌─────────────────────────────────────────┐
│  Next.js API Route                      │
│  /app/api/implementation/route.ts       │
└──────┬──────────────────────────────────┘
       │
       │ 4. POST http://localhost:8000/api/trigger-implementation
       ↓
┌─────────────────────────────────────────┐
│  FastAPI Backend                        │
│  - Search codebase (Ripgrep)            │
│  - Generate code (Claude)               │
│  - Create PR (GitHub API)               │
│  - Assign team (skill matching)         │
└──────┬──────────────────────────────────┘
       │
       │ 5. Return ImplementationResult
       ↓
┌─────────────────────────────────────────┐
│  {                                      │
│    pr_url: "github.com/...",            │
│    pr_number: 42,                       │
│    branch_name: "feature/...",          │
│    files_created: [...],                │
│    team_assignments: [...],             │
│    training_recommendations: [...]      │
│  }                                      │
└──────┬──────────────────────────────────┘
       │
       │ 6. Display results in browser
       ↓
┌─────────────────────────────────────────┐
│  User sees:                             │
│  ✓ PR card with link                   │
│  ✓ Files created                        │
│  ✓ Team assignments                     │
│  ✓ Training recommendations             │
└─────────────────────────────────────────┘
```

## State Management

```
FlowStep State Machine:
┌─────────┐
│ PENDING │ ──(start)──> ┌────────────┐
└─────────┘              │ IN_PROGRESS│
                         └────────────┘
                               │
                               │ (success)
                               ↓
                         ┌───────────┐
                         │ COMPLETED │
                         └───────────┘
                               │
                         (error)│
                               ↓
                          ┌────────┐
                          │ FAILED │
                          └────────┘

Step Updates:
steps.map(step =>
  step.id === 'search'
    ? { ...step, status: 'in_progress', startTime: Date.now() }
    : step
)
```

## Visual Components

```
StepIndicator Component:
┌────────────────────────────────────────────────────┐
│  [●] 1. Searching Codebase              ✓ 0.5s   │
│      Using Ripgrep to find related files...       │
│      [▓▓▓▓▓▓▓▓▓▓] 100%                           │
└────────────────────────────────────────────────────┘
  ↑    ↑                                    ↑
  Icon Title                            Duration
       └── Status-based color:
           Gray (pending), Blue (in_progress),
           Green (completed), Red (failed)

PR Card:
┌────────────────────────────────────────────────────┐
│  [PR Icon] Pull Request Created                   │
│            PR #42 on branch feature/smart-branch   │
│            [View on GitHub →]                      │
└────────────────────────────────────────────────────┘

Team Assignment Card:
┌────────────────────────────────────────────────────┐
│  [User Icon]  Sarah Chen                          │
│               [React] [TypeScript]                │
│               Files: 2                            │
│               - BranchConnector.tsx               │
│               - index.ts                          │
└────────────────────────────────────────────────────┘

Training Recommendation:
┌────────────────────────────────────────────────────┐
│  [Book Icon] [Security]                           │
│              OWASP Top 10 for Banking Apps        │
│              Feature handles sensitive data       │
└────────────────────────────────────────────────────┘
```

## Integration Points

```
Frontend Files:
├── app/
│   ├── components/
│   │   └── ImplementationFlow.tsx ←── Main component
│   ├── api/
│   │   └── implementation/
│   │       └── route.ts           ←── API proxy
│   └── implementation/
│       └── [id]/
│           └── page.tsx            ←── Dynamic route

Backend Endpoint (TO BE IMPLEMENTED):
POST /api/trigger-implementation
├── Input:  { analysis_id, target_repo }
└── Output: ImplementationResult

GitHub API (used by backend):
POST /repos/{owner}/{repo}/pulls
├── Creates pull request
└── Returns PR URL and number
```

## Error Handling Flow

```
Try:
  executeFlow()
  ├── fetch('/api/implementation')
  │   └── Success: setResult(data)
  │   └── Error: throw new Error(...)
  └── Catch: setError(message)
          ↓
      Display error banner
          ↓
      Mark current step as 'failed'
          ↓
      Show "Return to Dashboard" button
```

## Technology Stack

```
┌─────────────────────────────────────────────────┐
│  FRONTEND                                        │
├─────────────────────────────────────────────────┤
│  React 19          - UI framework               │
│  Next.js 15        - App Router, API routes     │
│  TypeScript        - Type safety                │
│  Tailwind CSS      - Styling                    │
│  Lucide React      - Icons                      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  BACKEND (to be implemented)                     │
├─────────────────────────────────────────────────┤
│  FastAPI           - REST API                   │
│  Ripgrep           - Codebase search            │
│  Claude API        - Code generation            │
│  GitHub API        - PR creation                │
│  Skill Matching    - Team assignment            │
└─────────────────────────────────────────────────┘
```

This architecture provides a seamless, visually impressive flow from feature analysis to GitHub PR creation with automatic team assignment and training recommendations.
