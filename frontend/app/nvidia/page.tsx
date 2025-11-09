'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import AgentOrchestrationDashboard, { type AgentGroup } from './components/AgentOrchestrationDashboard';
import AgentReasoningPanel from './components/AgentReasoningPanel';
import { useSharedAnalysis } from '../hooks/useSharedAnalysis';

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
    label: 'Intelligence Gathering',
    codename: 'DISCOVERY WAVE',
    description: 'Parallel reconnaissance across cost estimation, competitive landscape, and market dynamics.',
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
    label: 'Financial Synthesis',
    codename: 'ANALYSIS WAVE',
    description: 'Data fusion layer combining engineering estimates with ROI modeling and historical validation.',
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
    label: 'Execution Planning',
    codename: 'ORCHESTRATION WAVE',
    description: 'Strategic consolidation of all intelligence streams into actionable implementation roadmap.',
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

const PROGRESS_RING_CIRCUMFERENCE = 2 * Math.PI * 54;

export default function NVIDIATechnicalView() {
  const [agentStates, setAgentStates] = useState<Record<string, AgentState>>({});
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [waveTimings, setWaveTimings] = useState<WaveTimings>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activityLog, setActivityLog] = useState<Array<{ ts: number; message: string }>>([]);
  const [lastEventTs, setLastEventTs] = useState<number | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Use shared analysis hook for broadcasting
  const { events, latestEvent, startAnalysis: triggerSharedAnalysis, isRunning: sharedIsRunning } = useSharedAnalysis();

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

  const pushActivity = (message: string) => {
    setActivityLog(prev => {
      const next = [...prev, { ts: Date.now(), message }];
      return next.slice(-8);
    });
    setLastEventTs(Date.now());
  };

  // Process shared analysis events
  useEffect(() => {
    if (!latestEvent) return;

    const data = latestEvent;

    switch (data.type) {
      case 'start':
        console.log('Analysis started');
        setIsAnalyzing(true);
        setAgentStates({});
        setWaveTimings({});
        setActivityLog([]);
        pushActivity('orchestration initiated · launching agents');
        break;

      case 'agent_start':
        const startName = AGENT_LABELS[data.agent || ''] || data.agent;
        pushActivity(`${startName} · spinning up`);
        setAgentStates(prev => ({
          ...prev,
          [data.agent!]: {
            status: 'running',
            progress: 5,
            reasoning: ['Initializing agent systems...'],
            confidence: 0,
            tool_calls: [],
            elapsed_ms: 0,
            group_id: data.wave ? `wave-0${data.wave}` : undefined
          }
        }));
        break;

      case 'agent_complete':
        const agentName = AGENT_LABELS[data.agent || ''] || data.agent;
        const elapsedSec = ((data.result?.elapsed_ms || 0) / 1000).toFixed(1);
        pushActivity(`${agentName} · sealed in ${elapsedSec}s`);

        // Immediately set to completed state (skip animation for speed)
        const reasoning = data.result?.reasoning || [];

        setAgentStates(prev => ({
          ...prev,
          [data.agent!]: {
            status: 'completed',
            progress: 100,
            reasoning: reasoning,
            confidence: data.result?.confidence || 0.7,
            tool_calls: data.result?.tool_calls || [],
            elapsed_ms: data.result?.elapsed_ms || 0,
            result: data.result,
            group_id: prev[data.agent!]?.group_id
          }
        }));
        break;

      case 'wave_complete':
        const waveDuration = ((data.duration_ms || 0) / 1000).toFixed(1);
        pushActivity(`wave ${data.wave} · complete in ${waveDuration}s`);
        setWaveTimings(prev => ({
          ...prev,
          [`wave${data.wave}_ms`]: data.duration_ms
        }));
        break;

      case 'complete':
        pushActivity('MISSION COMPLETE');
        setIsAnalyzing(false);
        setWaveTimings(data.wave_timings || {});
        break;

      case 'error':
        pushActivity(`ERROR: ${data.message}`);
        setIsAnalyzing(false);
        break;
    }
  }, [latestEvent]);

  const startAnalysis = () => {
    // Use the shared analysis hook instead of local EventSource
    triggerSharedAnalysis(
      'Smart Branch Connect',
      'Hybrid banking experience connecting digital and in-branch services'
    );
  };

  // Keep old local EventSource logic below for reference (can be deleted later)
  const startAnalysisOLD = () => {
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

    eventSource.onopen = () => {
      console.log('SSE Connection established');
      pushActivity('telemetry stream locked · agents ready');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('SSE Event:', data);

        switch (data.type) {
          case 'start':
            console.log('Analysis started');
            pushActivity('orchestration initiated · launching agents');
            break;

          case 'agent_start':
            const startName = AGENT_LABELS[data.agent] || data.agent;
            pushActivity(`${startName} · spinning up`);
            setAgentStates(prev => ({
              ...prev,
              [data.agent]: {
                status: 'running',
                progress: 5,
                reasoning: ['Initializing agent systems...'],
                confidence: 0,
                tool_calls: [],
                elapsed_ms: 0,
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
            const agentName = AGENT_LABELS[data.agent] || data.agent;
            const elapsedSec = ((data.result?.elapsed_ms || 0) / 1000).toFixed(1);
            pushActivity(`${agentName} · sealed in ${elapsedSec}s`);

            // Animate reasoning steps for real-time feel
            const reasoning = data.result?.reasoning || [];
            let currentStep = 0;

            const animateReasoning = () => {
              if (currentStep < reasoning.length) {
                setAgentStates(prev => ({
                  ...prev,
                  [data.agent]: {
                    status: 'running',
                    progress: Math.min(99, 20 + ((currentStep + 1) / reasoning.length) * 79),
                    reasoning: reasoning.slice(0, currentStep + 1),
                    confidence: data.result?.confidence || 0.7,
                    tool_calls: data.result?.tool_calls || [],
                    elapsed_ms: data.result?.elapsed_ms || 0,
                    result: data.result,
                    group_id: prev[data.agent]?.group_id
                  }
                }));
                currentStep++;
                setTimeout(animateReasoning, 200); // 200ms per step
              } else {
                // Final completed state
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
              }
            };

            animateReasoning();
            break;

          case 'wave_complete':
            const waveNames = { 1: 'Discovery', 2: 'Analysis', 3: 'Orchestration' };
            const waveName = waveNames[data.wave as keyof typeof waveNames] || `Wave ${data.wave}`;
            pushActivity(`${waveName} complete · ${(data.duration_ms / 1000).toFixed(1)}s elapsed`);
            setWaveTimings(prev => ({
              ...prev,
              [`wave${data.wave}_ms`]: data.duration_ms
            }));
            break;

          case 'complete':
            pushActivity(`full analysis sealed · ${(data.total_duration_ms / 1000).toFixed(1)}s total`);
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
            pushActivity(`error · ${data.message}`);
            setIsAnalyzing(false);
            eventSource.close();
            eventSourceRef.current = null;
            break;
        }
      } catch (err) {
        console.error('Failed to parse SSE event:', err);
      }
    };

    eventSource.onerror = () => {
      // Check connection state
      if (eventSource.readyState === EventSource.CLOSED) {
        pushActivity('connection lost · backend offline on port 8000');
        setIsAnalyzing(false);
        eventSource.close();
        eventSourceRef.current = null;
      } else if (eventSource.readyState === EventSource.CONNECTING) {
        pushActivity('reconnecting to telemetry stream...');
      }
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
          telemetry stream idle · press launch to begin
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

  return (
    <div className="h-screen w-full overflow-hidden bg-[#03050a] text-white">
      <div className="grid h-full gap-6 p-4 lg:grid-cols-[360px_minmax(0,1fr)] lg:p-6">
        <section className="flex h-full flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.5em] text-cyan-200/70">Viably Ops · NVIDIA Nemotron</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-white">
              Multi-Agent War Room
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Real-time orchestration of {totalAgents} specialized AI agents across {AGENT_GROUPS.length} parallel execution waves.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={startAnalysis}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-3 rounded-full border border-cyan-400/40 bg-cyan-500/20 px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-cyan-400/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAnalyzing ? 'Live Analysis Running' : 'Launch Analysis'}
                <span className="h-2 w-2 rounded-full bg-cyan-300 animate-pulse" />
              </button>
              <div className="rounded-full border border-white/10 px-4 py-2 text-[0.6rem] uppercase tracking-[0.4em] text-slate-300">
                {isAnalyzing ? 'Active' : 'Standby'}
              </div>
            </div>
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
              <p className="text-[0.6rem] uppercase tracking-[0.4em] text-slate-400">Discovery Wave</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {waveTimings.wave1_ms ? `${(waveTimings.wave1_ms / 1000).toFixed(1)}s` : '---'}
              </p>
              <p className="text-xs text-slate-400">Intelligence Gathering</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[0.6rem] uppercase tracking-[0.4em] text-slate-400">Analysis Wave</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {waveTimings.wave2_ms ? `${(waveTimings.wave2_ms / 1000).toFixed(1)}s` : '---'}
              </p>
              <p className="text-xs text-slate-400">Financial Synthesis</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[0.6rem] uppercase tracking-[0.4em] text-slate-400">Orchestration Wave</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {waveTimings.wave3_ms ? `${(waveTimings.wave3_ms / 1000).toFixed(1)}s` : '---'}
              </p>
              <p className="text-xs text-slate-400">Execution Planning</p>
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
