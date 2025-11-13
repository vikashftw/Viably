

## The Problem

In today's competitive market, a significant number of product features fail to gain traction, leading to wasted resources and missed opportunities. For large organizations, the cost of building the wrong feature can run into millions. Viably was built to address this challenge by providing a rapid, data-driven approach to feature validation.

## What is Viably?

Viably is an AI-powered system that takes a product idea, in the form of a user story, and performs a comprehensive analysis in under a minute. It leverages a team of AI agents to evaluate the idea from multiple perspectives, including engineering effort, market competition, and potential ROI.

The result is a detailed analysis dashboard and a ready-to-review GitHub Pull Request containing scaffolded code for the proposed feature. This allows product managers and development teams to make informed decisions and accelerate the development lifecycle.

## Key Features

- **Multi-Agent Analysis:** Six specialized AI agents work in parallel to analyze your feature idea, covering:
    - **Engineer Agent:** Estimates cost, timeline, and potential risks.
    - **Competitor Agent:** Identifies key competitors and assesses market risk.
    - **Market Intelligence Agent:** Provides market size and growth projections.
    - **Similar Feature Agent:** Finds related past projects to leverage existing knowledge.
    - **ROI Calculator Agent:** Projects potential revenue and payback period.
    - **Implementation Planner Agent:** Creates a detailed implementation plan.
- **Automated Code Scaffolding:** Generates the initial file structure and code for the new feature, including components, services, and tests.
- **GitHub Integration:** Automatically creates a feature branch and opens a Pull Request with the analysis summary and scaffolded code.
- **Team Assignment:** Suggests team members based on the required skills for the project and identifies any skill gaps.
- **Extensible & Modular:** Built with a microservices architecture, making it easy to add new agents or customize the analysis process.

## Tech Stack

Viably is built with a modern, robust tech stack:

- **Backend:** Python & FastAPI
- **Frontend:** Next.js & React
- **Automation Service:** Node.js & Express
- **AI Agents:** NVIDIA Nemotron
- **Database:** RAG for similarity search

## Getting Started

To get Viably up and running on your local machine, follow these steps:

### Prerequisites

- Python 3.9+
- Node.js 18+
- `npm`

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/viably.git
cd viably
```

### 2. Configure Environment Variables

You'll need to set up API keys for the various services Viably uses.

**Backend (`backend/.env`):**
```bash
NVIDIA_API_KEY=nvapi-xxxx
SERPER_API_KEY=xxxx
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NEMOTRON_MODEL=nvidia/llama-3.1-nemotron-nano-8b-v1
EMBEDDINGS_MODEL=nvidia/nv-embedqa-e5-v5
```

**Automation Service (`automation-service/.env`):
```bash
NVIDIA_API_KEY=nvapi-xxxx
GITHUB_TOKEN=ghp_xxxx
RIPGREP_API_URL=http://localhost:3001
VIABLY_BACKEND_URL=http://localhost:8000
```

**Frontend (`frontend/.env.local`):**
```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### 3. Install Dependencies & Run

**Terminal 1: Backend**
```bash
cd backend
pip install -r requirements.txt
python main.py
```

**Terminal 2: Automation Service**
```bash
cd automation-service
npm install
npm start
```

**Terminal 3: Frontend**
```bash
cd frontend
npm install
npm run dev
```

Once all services are running, you can access the Viably dashboard at `http://localhost:3000`.

## Demo Flow

1.  **Select a Jira Story:** From the main dashboard, choose a user story to analyze.
2.  **Initiate Analysis:** Click "Analyze" to kick off the multi-agent analysis.
3.  **Review Insights:** Within seconds, the dashboard will populate with detailed insights on cost, ROI, competition, and more.
4.  **Generate Implementation:** Click "Generate Implementation" to have Viably create the scaffolded code and open a GitHub PR.
5.  **Review the PR:** A link to the newly created Pull Request will be provided. The PR will contain the analysis summary, a list of generated files, and the initial code.

## Project Structure

The Viably repository is organized into three main services:

-   `backend/`: The core analysis engine, built with Python and FastAPI. This is where the AI agents live.
-   `automation-service/`: A Node.js service that handles code generation and GitHub integration.
-   `frontend/`: The user interface, built with Next.js and React.

For a more detailed breakdown of the architecture and file structure, please see the [Project Map](PROJECT_MAP.md).

## Contributing

We welcome contributions to Viably! If you're interested in helping, please check out our contributing guidelines (coming soon).
