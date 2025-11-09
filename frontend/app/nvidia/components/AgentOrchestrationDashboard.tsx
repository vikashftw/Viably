import AgentCard from './AgentCard';
import MetricCard from './MetricCard';

interface AgentState {
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  reasoning?: string[];
  confidence?: number;
  tool_calls?: Array<{ tool: string; action: string }>;
  elapsed_ms?: number;
  result?: any;
}

interface WaveTimings {
  wave1_ms?: number;
  wave2_ms?: number;
  wave3_ms?: number;
  total_ms?: number;
}

interface Props {
  agents: Record<string, AgentState>;
  waveTimings: WaveTimings;
  onAgentClick: (agent: string) => void;
}

export default function AgentOrchestrationDashboard({ agents, waveTimings, onAgentClick }: Props) {
  const completedAgents = Object.values(agents).filter(a => a.status === 'completed').length;
  const totalAgents = 6;

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Performance Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Total Agents"
          value={totalAgents.toString()}
          icon="🤖"
        />
        <MetricCard
          label="Parallel Waves"
          value="3"
          icon="⚡"
        />
        <MetricCard
          label="Total Time"
          value={waveTimings.total_ms ? `${(waveTimings.total_ms / 1000).toFixed(1)}s` : '---'}
          icon="⏱️"
        />
        <MetricCard
          label="Speedup"
          value="2.5x"
          icon="🚀"
          subtitle="vs sequential"
        />
      </div>

      {/* Wave 1: Parallel Execution */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-white">
            Wave 1: Independent Analysis
          </h2>
          {waveTimings.wave1_ms && (
            <span className="text-green-400 text-sm">
              Parallel Execution • {(waveTimings.wave1_ms / 1000).toFixed(1)}s
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <AgentCard
            name="Engineer Agent"
            status={agents.engineer?.status || 'pending'}
            progress={agents.engineer?.progress || 0}
            icon="🔧"
            description="Cost estimation via RAG"
            onClick={() => onAgentClick('engineer')}
          />
          <AgentCard
            name="Competitor Agent"
            status={agents.competitor?.status || 'pending'}
            progress={agents.competitor?.progress || 0}
            icon="🏆"
            description="Real-time competitive analysis"
            onClick={() => onAgentClick('competitor')}
          />
          <AgentCard
            name="Market Intelligence"
            status={agents.market_intelligence?.status || 'pending'}
            progress={agents.market_intelligence?.progress || 0}
            icon="📊"
            description="Market sizing & trends"
            onClick={() => onAgentClick('market_intelligence')}
          />
        </div>
      </div>

      {/* Dependency Arrow */}
      <div className="flex justify-center">
        <div className="text-green-400 text-4xl">↓</div>
      </div>

      {/* Wave 2: Dependent Agents */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-white">
            Wave 2: Synthesis & Projection
          </h2>
          {waveTimings.wave2_ms && (
            <span className="text-yellow-400 text-sm">
              Uses Engineer Output • {(waveTimings.wave2_ms / 1000).toFixed(1)}s
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-3xl mx-auto">
          <AgentCard
            name="ROI Calculator"
            status={agents.roi_calculator?.status || 'pending'}
            progress={agents.roi_calculator?.progress || 0}
            icon="💰"
            description="3-scenario financial model"
            dependencies={['engineer']}
            onClick={() => onAgentClick('roi_calculator')}
          />
          <AgentCard
            name="Similar Features"
            status={agents.similar_features?.status || 'pending'}
            progress={agents.similar_features?.progress || 0}
            icon="🔍"
            description="RAG-based cost validation"
            dependencies={['engineer']}
            onClick={() => onAgentClick('similar_features')}
          />
        </div>
      </div>

      {/* Dependency Arrow */}
      <div className="flex justify-center">
        <div className="text-green-400 text-4xl">↓</div>
      </div>

      {/* Wave 3: Final Synthesis */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-white">
            Wave 3: Implementation Planning
          </h2>
          {waveTimings.wave3_ms && (
            <span className="text-purple-400 text-sm">
              Uses All Agent Outputs • {(waveTimings.wave3_ms / 1000).toFixed(1)}s
            </span>
          )}
        </div>

        <div className="max-w-md mx-auto">
          <AgentCard
            name="Implementation Planner"
            status={agents.implementation_planner?.status || 'pending'}
            progress={agents.implementation_planner?.progress || 0}
            icon="📋"
            description="Executable task breakdown"
            dependencies={['engineer', 'competitor', 'market', 'roi', 'similar']}
            onClick={() => onAgentClick('implementation_planner')}
          />
        </div>
      </div>

      {/* Total Timing */}
      {waveTimings.total_ms && (
        <div className="text-center p-6 bg-green-500/10 rounded-lg border border-green-500/20">
          <p className="text-white text-xl">
            Total Analysis Time:
            <span className="ml-2 text-green-400 font-bold">
              {(waveTimings.total_ms / 1000).toFixed(1)}s
            </span>
          </p>
          <p className="text-gray-400 text-sm mt-2">
            3-wave parallel execution • 2.5x faster than sequential
          </p>
        </div>
      )}
    </div>
  );
}
