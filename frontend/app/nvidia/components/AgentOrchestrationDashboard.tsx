import { useMemo, useState } from 'react';

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
  const [activeAgents, setActiveAgents] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    groups.forEach(group => {
      if (group.agents[0]) {
        initial[group.id] = group.agents[0].id;
      }
    });
    return initial;
  });

  const totalAgents = groups.reduce((count, group) => count + group.agents.length, 0);

  const averageProgress = useMemo(() => {
    if (!totalAgents) return 0;
    const aggregate = groups.reduce((sum, group) => {
      const groupSum = group.agents.reduce((inner, agent) => inner + (agents[agent.id]?.progress ?? 0), 0);
      return sum + groupSum;
    }, 0);
    return Math.round(aggregate / totalAgents);
  }, [agents, groups, totalAgents]);

  const handleAgentSelect = (groupId: string, agentId: string) => {
    setActiveAgents(prev => ({
      ...prev,
      [groupId]: agentId
    }));
  };

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
          const selectedAgentId = activeAgents[group.id] || group.agents[0]?.id || '';
          const selectedMeta = group.agents.find(agent => agent.id === selectedAgentId) || group.agents[0];
          const selectedState = selectedAgentId ? agents[selectedAgentId] : undefined;
          const reasoningLines = (selectedState?.reasoning ?? []).slice(-5);
          const latestToolCall =
            selectedState?.tool_calls && selectedState.tool_calls.length > 0
              ? selectedState.tool_calls[selectedState.tool_calls.length - 1]
              : undefined;

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
                  <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-[#090d18]/70 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={selectedAgentId}
                        onChange={event => handleAgentSelect(group.id, event.target.value)}
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                      >
                        {group.agents.map(agent => (
                          <option key={agent.id} value={agent.id} className="bg-[#05070d] text-white">
                            {agent.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => selectedAgentId && onAgentClick(selectedAgentId)}
                        disabled={!selectedAgentId}
                        className="rounded-xl border border-cyan-400/40 px-3 py-2 text-xs uppercase tracking-[0.3em] text-cyan-200 transition hover:border-cyan-200 disabled:opacity-40"
                      >
                        Inspect
                      </button>
                    </div>

                    <div className="rounded-2xl border border-white/5 bg-black/50 p-3">
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span className="font-semibold">{selectedMeta?.role || 'Agent'}</span>
                        <span className="text-[0.6rem] uppercase tracking-[0.4em] text-slate-500">
                          {selectedState?.status || 'pending'}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-violet-300 to-amber-200 transition-all duration-500"
                          style={{ width: `${selectedState?.progress ?? 0}%` }}
                        />
                      </div>
                      <p className="mt-2 text-[0.6rem] uppercase tracking-[0.4em] text-cyan-200/80">
                        {selectedMeta?.signal || 'Signal stream'}
                      </p>
                      <div className="mt-2 max-h-36 overflow-y-auto rounded-xl bg-[#05060c] p-3 font-mono text-[0.65rem] leading-relaxed text-cyan-100">
                        {reasoningLines.length > 0 ? (
                          reasoningLines.map((line, idx) => (
                            <p key={`${selectedAgentId}-log-${idx}`} className="flex gap-2">
                              <span className="text-cyan-400/70">{`${idx + 1}`.padStart(2, '0')}▕</span>
                              <span className="flex-1">{line}</span>
                            </p>
                          ))
                        ) : (
                          <p className="text-slate-400">awaiting reasoning packets...</p>
                        )}
                        <div className="mt-2 border-t border-white/5 pt-2 text-[0.6rem] text-slate-400">
                          <div>progress ▷ {selectedState?.progress ?? 0}%</div>
                          <div>
                            tool ▷ {latestToolCall ? `${latestToolCall.tool} · ${latestToolCall.action}` : 'pending'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
