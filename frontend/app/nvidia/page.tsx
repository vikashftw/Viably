'use client';

import { useState, useEffect } from 'react';
import AgentOrchestrationDashboard from './components/AgentOrchestrationDashboard';
import AgentReasoningPanel from './components/AgentReasoningPanel';
import ArchitectureDiagram from './components/ArchitectureDiagram';

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

export default function NVIDIATechnicalView() {
  const [agentStates, setAgentStates] = useState<Record<string, AgentState>>({});
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [waveTimings, setWaveTimings] = useState<WaveTimings>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const startAnalysis = () => {
    setIsAnalyzing(true);
    setAgentStates({});
    setWaveTimings({});

    // Connect to SSE endpoint
    const eventSource = new EventSource(
      `http://localhost:8000/api/analyze-stream?feature_name=Smart%20Branch%20Connect&description=Hybrid%20banking%20experience%20connecting%20digital%20and%20in-branch%20services`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('SSE Event:', data);

      switch (data.type) {
        case 'start':
          console.log('Analysis started');
          break;

        case 'agent_start':
          setAgentStates(prev => ({
            ...prev,
            [data.agent]: {
              status: 'running',
              progress: 0
            }
          }));
          break;

        case 'agent_progress':
          setAgentStates(prev => ({
            ...prev,
            [data.agent]: {
              ...prev[data.agent],
              progress: data.progress
            }
          }));
          break;

        case 'agent_complete':
          setAgentStates(prev => ({
            ...prev,
            [data.agent]: {
              status: 'completed',
              progress: 100,
              reasoning: data.result?.reasoning || [],
              confidence: data.result?.confidence || 0.7,
              tool_calls: data.result?.tool_calls || [],
              elapsed_ms: data.result?.elapsed_ms || 0,
              result: data.result
            }
          }));
          break;

        case 'wave_complete':
          setWaveTimings(prev => ({
            ...prev,
            [`wave${data.wave}_ms`]: data.duration_ms
          }));
          break;

        case 'complete':
          setWaveTimings(prev => ({
            ...prev,
            ...data.wave_timings,
            total_ms: data.total_duration_ms
          }));
          setIsAnalyzing(false);
          eventSource.close();
          break;

        case 'error':
          console.error('Analysis error:', data.message);
          setIsAnalyzing(false);
          eventSource.close();
          break;
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      setIsAnalyzing(false);
      eventSource.close();
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900">
      {/* NVIDIA Branding Header */}
      <header className="p-6 border-b border-green-500/20">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white">
            VIABLY - Multi-Agent Orchestration
            <span className="ml-4 text-green-400">Powered by NVIDIA Nemotron</span>
          </h1>
          <p className="text-gray-400 mt-2">
            Real-time visualization of 6 AI agents orchestrating in 3 parallel waves
          </p>
        </div>
      </header>

      {/* Start Analysis Button */}
      {!isAnalyzing && Object.keys(agentStates).length === 0 && (
        <div className="p-6 max-w-7xl mx-auto">
          <button
            onClick={startAnalysis}
            className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-lg transition-colors"
          >
            🚀 Start Live Analysis
          </button>
        </div>
      )}

      {/* Architecture Diagram (static, shown first) */}
      {Object.keys(agentStates).length > 0 && <ArchitectureDiagram />}

      {/* Live Agent Dashboard */}
      {Object.keys(agentStates).length > 0 && (
        <AgentOrchestrationDashboard
          agents={agentStates}
          waveTimings={waveTimings}
          onAgentClick={setSelectedAgent}
        />
      )}

      {/* Reasoning Panel (modal/drawer) */}
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
