'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import AgentOrchestrationDashboard, { type AgentGroup } from './components/AgentOrchestrationDashboard';
import AgentReasoningPanel from './components/AgentReasoningPanel';

interface AgentState {
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  reasoning?: string[];
  confidence?: number;
  tool_calls?: Array<{ tool: string; action: string }>;
  elapsed_ms?: number;
  result?: Record<string, unknown> | null;
  group_id?: string;
}

interface WaveTimings {
  wave1_ms?: number;
  wave2_ms?: number;
  wave3_ms?: number;
  total_ms?: number;
}

const AGENT_GROUPS: AgentGroup[] = [
  {
    id: 'wave-01',
    wave: 1,
    label: 'Recon Thread',
    codename: 'WAVE 01',
    description: 'Independent scouts sweep cost, competitor, and market intelligence in parallel.',
    accent: 'from-cyan-500/30 via-transparent to-transparent',
    agents: [
      {
        id: 'engineer',
        name: 'Systems Engineer',
        role: 'Builds the RAG-driven cost lattice',
        signal: 'Cost Fabrication',
        icon: '⌁',
        dependencies: []
      },
      {
        id: 'competitor',
        name: 'Competitor Sentinel',
        role: 'Streams live rival moves & adjacencies',
        signal: 'Competitive Sweep',
        icon: '⚡',
        dependencies: []
      },
      {
        id: 'market_intelligence',
        name: 'Market Watchtower',
        role: 'Projects TAM, adoption arcs, and risks',
        signal: 'Market Pulse',
        icon: '✦',
        dependencies: []
      }
    ]
  },
  {
    id: 'wave-02',
    wave: 2,
    label: 'Fusion Thread',
    codename: 'WAVE 02',
    description: 'Dependent analysts remix engineer output into ROI narratives.',
    accent: 'from-violet-500/30 via-transparent to-transparent',
    agents: [
      {
        id: 'roi_calculator',
        name: 'ROI Architect',
        role: 'Generates multi-scenario models',
        signal: 'Financial Fabric',
        icon: '∞',
        dependencies: ['engineer']
      },
      {
        id: 'similar_features',
        name: 'Analog Finder',
        role: 'Validates costs via similar launches',
        signal: 'Analog Scan',
        icon: '◇',
        dependencies: ['engineer']
      }
    ]
  },
  {
    id: 'wave-03',
    wave: 3,
    label: 'Launch Thread',
    codename: 'WAVE 03',
    description: 'Final planner consolidates every upstream artifact into execution tracks.',
    accent: 'from-amber-400/30 via-transparent to-transparent',
    agents: [
      {
        id: 'implementation_planner',
        name: 'Deployment Maestro',
        role: 'Outputs the runnable implementation playbook',
        signal: 'Implementation Grid',
        icon: '◎',
        dependencies: ['engineer', 'competitor', 'market_intelligence', 'roi_calculator', 'similar_features']
      }
    ]
  }
];

const AGENT_LABELS = AGENT_GROUPS.reduce<Record<string, string>>((acc, group) => {
  group.agents.forEach(agent => {
    acc[agent.id] = agent.name;
  });
  return acc;
}, {});

const AGENT_METADATA = AGENT_GROUPS.reduce<
  Record<string, { wave: number; codename: string; groupLabel: string; signal: string }>
>((acc, group) => {
  group.agents.forEach(agent => {
    acc[agent.id] = {
      wave: group.wave,
      codename: group.codename,
      groupLabel: group.label,
      signal: agent.signal
    };
  });
  return acc;
}, {});

const PROGRESS_RING_CIRCUMFERENCE = 2 * Math.PI * 54;

export default function NVIDIATechnicalView() {
  const [agentStates, setAgentStates] = useState<Record<string, AgentState>>({});
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [waveTimings, setWaveTimings] = useState<WaveTimings>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activityLog, setActivityLog] = useState<Array<{ ts: number; message: string }>>([]);
  const [lastEventTs, setLastEventTs] = useState<number | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const totalAgents = useMemo(
    () => AGENT_GROUPS.reduce((count, group) => count + group.agents.length, 0),
    []
  );

  const averageProgress = useMemo(() => {
    if (!totalAgents) return 0;
    const aggregate = AGENT_GROUPS.reduce((sum, group) => {
      return (
        sum +
        group.agents.reduce(
          (inner, agent) => inner + (agentStates[agent.id]?.progress ?? 0),
          0
        )
      );
    }, 0);
    return Math.round(aggregate / totalAgents);
  }, [agentStates, totalAgents]);

  const completedAgents = useMemo(
    () => Object.values(agentStates).filter(a => a.status === 'completed').length,
    [agentStates]
  );

  const processingStream = useMemo(() => {
    const runningAgents = Object.entries(agentStates)
      .filter(([, state]) => state.status === 'running')
      .map(([id, state]) => ({
        id,
        label: AGENT_LABELS[id] || id,
        progress: state.progress,
        wave: AGENT_METADATA[id]?.wave,
        groupLabel: AGENT_METADATA[id]?.groupLabel,
        signal: AGENT_METADATA[id]?.signal || 'Processing'
      }));

    if (runningAgents.length > 0) {
      return runningAgents.slice(0, 4);
    }

    return activityLog
      .slice(-4)
      .reverse()
      .map((entry, idx) => ({
        id: `log-${entry.ts}-${idx}`,
        label: entry.message,
        progress: 100,
        wave: undefined,
        groupLabel: 'Telemetry',
        signal: 'Waiting'
      }));
  }, [activityLog, agentStates]);

  const pushActivity = (message: string) => {
    setActivityLog(prev => {
      const next = [...prev, { ts: Date.now(), message }];
      return next.slice(-8);
    });
    setLastEventTs(Date.now());
  };

  const startAnalysis = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setIsAnalyzing(true);
    setAgentStates({});
    setWaveTimings({});
    setActivityLog([]);
    setLastEventTs(null);

    // Connect to SSE endpoint
    const eventSource = new EventSource(
      `http://localhost:8000/api/analyze-stream?feature_name=Smart%20Branch%20Connect&description=Hybrid%20banking%20experience%20connecting%20digital%20and%20in-branch%20services`
    );
    eventSourceRef.current = eventSource;
    pushActivity('link ▶ acquiring live agent telemetry');

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('SSE Event:', data);

      switch (data.type) {
        case 'start':
          console.log('Analysis started');
          pushActivity('wave 01 primed · scouts awaiting go signal');
          break;

        case 'agent_start':
          pushActivity(`agent ${AGENT_LABELS[data.agent] || data.agent} spinning up`);
          setAgentStates(prev => ({
            ...prev,
            [data.agent]: {
              ...prev[data.agent],
              status: 'running',
              progress: 0,
              group_id: data.wave ? `wave-0${data.wave}` : undefined
            }
          }));
          break;

        case 'agent_progress':
          setAgentStates(prev => ({
            ...prev,
            [data.agent]: {
              ...(prev[data.agent] || { status: 'running', progress: 0 }),
              progress: data.progress
            }
          }));
          break;

        case 'agent_complete':
          pushActivity(`agent ${AGENT_LABELS[data.agent] || data.agent} sealed output`);
          setAgentStates(prev => ({
            ...prev,
            [data.agent]: {
              status: 'completed',
              progress: 100,
              reasoning: data.result?.reasoning || [],
              confidence: data.result?.confidence || 0.7,
              tool_calls: data.result?.tool_calls || [],
              elapsed_ms: data.result?.elapsed_ms || 0,
              result: data.result,
              group_id: prev[data.agent]?.group_id
            }
          }));
          break;

        case 'wave_complete':
          pushActivity(`wave ${data.wave} closed · ${(data.duration_ms / 1000).toFixed(1)}s`);
          setWaveTimings(prev => ({
            ...prev,
            [`wave${data.wave}_ms`]: data.duration_ms
          }));
          break;

        case 'complete':
          pushActivity('mission complete · orchestration closed');
          setWaveTimings(prev => ({
            ...prev,
            ...data.wave_timings,
            total_ms: data.total_duration_ms
          }));
          setIsAnalyzing(false);
          eventSource.close();
          eventSourceRef.current = null;
          break;

        case 'error':
          console.error('Analysis error:', data.message);
          pushActivity('telemetry feed error · link dropped');
          setIsAnalyzing(false);
          eventSource.close();
          eventSourceRef.current = null;
          break;
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      pushActivity('network fault · attempting graceful shutdown');
      setIsAnalyzing(false);
      eventSource.close();
      eventSourceRef.current = null;
    };
  };

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  const renderActivityLog = () => {
    if (activityLog.length === 0) {
      return (
        <div className="font-mono text-sm text-slate-400">
          awaiting live data · press initiate to light up the swarm
        </div>
      );
    }

    return activityLog
      .slice()
      .reverse()
      .map(entry => (
        <div key={entry.ts} className="flex justify-between font-mono text-xs text-slate-200/90">
          <span className="text-cyan-300/80">
            {new Date(entry.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <span className="text-right text-slate-200/90">{entry.message}</span>
        </div>
      ));
  };

  const liveStats = [
    { label: 'Parallel Waves', value: AGENT_GROUPS.length.toString(), hint: 'Recon · Fusion · Launch' },
    { label: 'Wave Speed', value: waveTimings.total_ms ? `${(waveTimings.total_ms / 1000).toFixed(1)}s` : '---', hint: 'Aggregate elapsed' },
    { label: 'Live Status', value: isAnalyzing ? 'Streaming' : 'Standby', hint: 'SSE telemetry' },
    { label: 'Completed', value: completedAgents.toString(), hint: 'Agents sealed' }
  ];

  return (
    <div className="h-screen w-full overflow-hidden bg-[#03050a] text-white">
      <div className="grid h-full gap-6 p-4 lg:grid-cols-[360px_minmax(0,1fr)] lg:p-6">
        <section className="flex h-full flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.5em] text-cyan-200/70">Viably Ops · NVIDIA Nemotron</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-white">
              Agent Swarm Command Console
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Monitor {totalAgents} specialized agents executing in {AGENT_GROUPS.length} synchronized waves with second-by-second telemetry.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={startAnalysis}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-3 rounded-full border border-cyan-400/40 bg-cyan-500/20 px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-cyan-400/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAnalyzing ? 'Streaming Live' : 'Initiate Live Stream'}
                <span className="h-2 w-2 rounded-full bg-cyan-300 animate-pulse" />
              </button>
              <div className="rounded-full border border-white/10 px-4 py-2 text-[0.6rem] uppercase tracking-[0.4em] text-slate-300">
                {isAnalyzing ? 'Link Locked' : 'Idle'}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.55rem] uppercase tracking-[0.4em] text-slate-400">Live Progress</p>
                <p className="mt-1 text-3xl font-semibold text-white">{averageProgress}%</p>
                <p className="text-xs text-slate-400">
                  {completedAgents}/{totalAgents} agents sealed
                </p>
              </div>
              <div className="relative h-20 w-20">
                <div className="absolute inset-0 rounded-full border border-white/10" />
                <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" stroke="rgba(255,255,255,0.15)" strokeWidth="8" fill="none" />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    stroke="url(#progressGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(PROGRESS_RING_CIRCUMFERENCE * averageProgress) / 100} ${PROGRESS_RING_CIRCUMFERENCE}`}
                    fill="none"
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#fbbf24" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-400">
              Agents online: {Object.keys(agentStates).length}/{totalAgents} · Last packet:{' '}
              {lastEventTs ? new Date(lastEventTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'pending'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
            {liveStats.map(stat => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/30 p-3">
                <p className="text-[0.6rem] uppercase tracking-[0.4em] text-slate-500">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.hint}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center justify-between text-[0.6rem] uppercase tracking-[0.4em] text-slate-400">
              <span>Real-time processing</span>
              <span>{processingStream.length ? 'Active agents' : 'Awaiting feed'}</span>
            </div>
            {processingStream.length === 0 ? (
              <p className="mt-4 text-xs text-slate-400">
                Awaiting telemetry handshake · tap initiate to watch the agents engage.
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-3">
                {processingStream.map(item => (
                  <div
                    key={item.id}
                    className="flex min-w-[140px] flex-1 flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-3"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-200">
                      <span className="font-semibold">{item.label}</span>
                      {item.wave && <span className="text-[0.6rem] uppercase tracking-[0.4em] text-slate-500">W{item.wave}</span>}
                    </div>
                    <p className="text-[0.65rem] uppercase tracking-[0.4em] text-cyan-200/80">{item.signal}</p>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-violet-300 to-amber-200 transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(5, item.progress))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center justify-between text-[0.6rem] uppercase tracking-[0.4em] text-slate-400">
              <span>Live traffic log</span>
              <span>{lastEventTs ? 'updated' : 'waiting'}</span>
            </div>
            <div className="mt-3 space-y-2">{renderActivityLog()}</div>
          </div>
        </section>

        <section className="flex h-full flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[0.6rem] uppercase tracking-[0.4em] text-slate-400">Total Agents</p>
              <p className="mt-2 text-3xl font-semibold text-white">{totalAgents}</p>
              <p className="text-xs text-slate-400">Grouped by orchestration wave</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[0.6rem] uppercase tracking-[0.4em] text-slate-400">Wave timings</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {waveTimings.wave1_ms ? `${(waveTimings.wave1_ms / 1000).toFixed(1)}s` : '---'}
              </p>
              <p className="text-xs text-slate-400">Wave 01 Recon</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[0.6rem] uppercase tracking-[0.4em] text-slate-400">Wave timings</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {waveTimings.wave2_ms ? `${(waveTimings.wave2_ms / 1000).toFixed(1)}s` : '---'}
              </p>
              <p className="text-xs text-slate-400">Wave 02 Fusion</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[0.6rem] uppercase tracking-[0.4em] text-slate-400">Wave timings</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {waveTimings.wave3_ms ? `${(waveTimings.wave3_ms / 1000).toFixed(1)}s` : '---'}
              </p>
              <p className="text-xs text-slate-400">Wave 03 Launch</p>
            </div>
          </div>

          <div className="flex-1 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4">
            <AgentOrchestrationDashboard
              agents={agentStates}
              waveTimings={waveTimings}
              groups={AGENT_GROUPS}
              onAgentClick={setSelectedAgent}
            />
          </div>
        </section>
      </div>

      {selectedAgent && agentStates[selectedAgent] && (
        <AgentReasoningPanel
          agent={selectedAgent}
          data={agentStates[selectedAgent]}
          onClose={() => setSelectedAgent(null)}
        />
      )}
    </div>
  );
}
