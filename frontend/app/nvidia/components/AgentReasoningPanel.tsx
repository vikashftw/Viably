interface AgentState {
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  reasoning?: string[];
  confidence?: number;
  tool_calls?: Array<{ tool: string; action: string }>;
  elapsed_ms?: number;
  result?: Record<string, unknown> | null;
}

interface Props {
  agent: string;
  data: AgentState;
  onClose: () => void;
}

export default function AgentReasoningPanel({ agent, data, onClose }: Props) {
  const agentIcons: Record<string, string> = {
    engineer: '🔧',
    competitor: '🏆',
    market_intelligence: '📊',
    roi_calculator: '💰',
    similar_features: '🔍',
    implementation_planner: '📋'
  };

  const agentNames: Record<string, string> = {
    engineer: 'Engineer',
    competitor: 'Competitor',
    market_intelligence: 'Market Intelligence',
    roi_calculator: 'ROI Calculator',
    similar_features: 'Similar Features',
    implementation_planner: 'Implementation Planner'
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-gray-900 border-2 border-green-500 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-green-500/20 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span>{agentIcons[agent] || '🤖'}</span>
              {agentNames[agent] || agent} Agent Reasoning
            </h2>
            <p className="text-gray-400 mt-1">
              Completed in {((data.elapsed_ms || 0) / 1000).toFixed(2)}s •
              Confidence: {((data.confidence || 0) * 100).toFixed(0)}%
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Reasoning Steps */}
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-green-400">🧠</span>
              Reasoning Process
            </h3>
            <ol className="space-y-3">
              {data.reasoning && data.reasoning.map((step, idx) => (
                <li key={idx} className="flex gap-3 text-gray-300">
                  <span className="text-green-400 font-bold">{idx + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Tool Calls */}
          {data.tool_calls && data.tool_calls.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <span className="text-green-400">🔧</span>
                Tool Calls & Integrations
              </h3>
              <div className="space-y-2">
                {data.tool_calls.map((call, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-gray-800 rounded-lg border border-green-500/20"
                  >
                    <div className="flex items-center gap-3">
                      {/* NVIDIA Logo Badge */}
                      {call.tool.includes('NVIDIA') && (
                        <div className="px-3 py-1 bg-green-500/20 border border-green-500 rounded text-green-400 text-xs font-bold">
                          NVIDIA
                        </div>
                      )}
                      <div>
                        <p className="text-white font-semibold">{call.tool}</p>
                        <p className="text-gray-400 text-sm">{call.action}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confidence Breakdown */}
          <div>
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-green-400">📊</span>
              Confidence Analysis
            </h3>
            <div className="p-4 bg-gray-800 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-4 mb-3">
                <div className="text-4xl font-bold text-green-400">
                  {((data.confidence || 0) * 100).toFixed(0)}%
                </div>
                <div className="flex-1">
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${(data.confidence || 0) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <p className="text-gray-300 text-sm">
                {(data.confidence || 0) >= 0.8
                  ? '✅ High confidence - Strong data match'
                  : (data.confidence || 0) >= 0.6
                  ? '⚠️ Medium confidence - Limited historical data'
                  : '❌ Low confidence - Sparse data, proceed with caution'}
              </p>
            </div>
          </div>

          {/* Raw Result Data (optional, expandable) */}
          {data.result && (
            <details className="bg-gray-800 rounded-lg border border-green-500/20">
              <summary className="p-4 cursor-pointer text-white font-semibold hover:bg-gray-700/50">
                🔍 View Raw Result Data
              </summary>
              <pre className="p-4 text-xs text-gray-300 overflow-x-auto">
                {JSON.stringify(data.result, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
