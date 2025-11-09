import AgentCard from './AgentCard';

export interface AgentState {
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  reasoning?: string[];
  confidence?: number;
  tool_calls?: Array<{ tool: string; action: string }>;
  elapsed_ms?: number;
  result?: Record<string, unknown> | null;
}

export interface AgentMeta {
  id: string;
  name: string;
  role: string;
  signal: string;
  icon: string;
  dependencies?: string[];
}

export interface AgentGroup {
  id: string;
  wave: number;
  label: string;
  codename: string;
  description: string;
  accent: string;
  agents: AgentMeta[];
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
  groups: AgentGroup[];
  onAgentClick: (agent: string) => void;
}

type WaveTimingKey = keyof WaveTimings;
const waveKey = (wave: number): WaveTimingKey => `wave${wave}_ms` as WaveTimingKey;

export default function AgentOrchestrationDashboard({ agents, waveTimings, groups, onAgentClick }: Props) {
  const totalAgents = groups.reduce((count, group) => count + group.agents.length, 0);

  const averageProgress = totalAgents
    ? Math.round(
        groups.reduce((sum, group) => {
          const groupSum = group.agents.reduce((inner, agent) => inner + (agents[agent.id]?.progress ?? 0), 0);
          return sum + groupSum;
        }, 0) / totalAgents
      )
    : 0;

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Wave Telemetry</p>
            <h2 className="text-xl font-semibold text-white">Live Group Status</h2>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Avg Progress</p>
            <p className="text-2xl font-semibold text-white">{averageProgress}%</p>
            <p className="text-xs text-slate-500">
              {waveTimings.total_ms ? `${(waveTimings.total_ms / 1000).toFixed(1)}s total` : 'Awaiting runtime'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
        {groups.map(group => {
          const groupProgress = group.agents.length
            ? Math.round(
                group.agents.reduce((sum, agent) => sum + (agents[agent.id]?.progress ?? 0), 0) /
                  group.agents.length
              )
            : 0;
          const completedAgents = group.agents.filter(agent => agents[agent.id]?.status === 'completed').length;
          const waveDurationMs = waveTimings[waveKey(group.wave)];

          return (
            <div
              key={group.id}
              className="relative flex flex-col rounded-2xl border border-white/10 bg-gradient-to-br from-[#070911] via-[#05060c] to-[#030408] p-4"
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${group.accent} opacity-50`} />
              <div className="relative z-10 flex flex-col gap-4">
                <div>
                  <p className="text-[0.65rem] uppercase tracking-[0.55em] text-slate-400">{group.codename}</p>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-white">{group.label}</h3>
                    <span className="text-xs text-slate-400">
                      {completedAgents}/{group.agents.length} ready
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{group.description}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[0.65rem] uppercase tracking-[0.4em] text-slate-500">
                    <span>Progress</span>
                    <span>{groupProgress}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-violet-300 to-amber-200 transition-all duration-500"
                      style={{ width: `${groupProgress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[0.65rem] uppercase tracking-[0.4em] text-slate-500">
                    {waveDurationMs ? `${(waveDurationMs / 1000).toFixed(1)}s elapsed` : 'waiting'}
                  </p>
                </div>

                <div className="grid gap-3">
                  {group.agents.map(agent => (
                    <AgentCard
                      key={agent.id}
                      name={agent.name}
                      status={agents[agent.id]?.status || 'pending'}
                      progress={agents[agent.id]?.progress || 0}
                      icon={agent.icon}
                      description={agent.role}
                      signal={agent.signal}
                      dependencies={agent.dependencies}
                      onClick={() => onAgentClick(agent.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
