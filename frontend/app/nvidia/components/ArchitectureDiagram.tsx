export default function ArchitectureDiagram() {
  return (
    <div className="p-6 bg-gray-800/50 border-b border-green-500/20">
      <h2 className="text-xl font-bold text-white mb-4 text-center">
        Multi-Agent Orchestration Architecture
      </h2>

      <div className="max-w-5xl mx-auto">
        {/* Simple visual representation */}
        <div className="flex flex-col items-center space-y-6 text-white">
          {/* User Input */}
          <div className="px-6 py-3 bg-blue-500/20 border-2 border-blue-500 rounded-lg">
            User Input: Feature Idea
          </div>

          <div className="text-green-400 text-2xl">↓</div>

          {/* Orchestrator */}
          <div className="px-6 py-3 bg-purple-500/20 border-2 border-purple-500 rounded-lg">
            OrchestratorV2 (Coordinates 3 Waves)
          </div>

          <div className="text-green-400 text-2xl">↓</div>

          {/* 3 Waves */}
          <div className="w-full space-y-8">
            {/* Wave 1 */}
            <div className="border-2 border-green-500/30 rounded-lg p-4 bg-green-500/5">
              <p className="text-green-400 font-bold mb-3">Wave 1: Parallel (8s)</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-gray-800 rounded border border-green-500/50 text-center">
                  🔧 Engineer<br />
                  <span className="text-xs text-gray-400">RAG + Nemotron</span>
                </div>
                <div className="p-3 bg-gray-800 rounded border border-green-500/50 text-center">
                  🏆 Competitor<br />
                  <span className="text-xs text-gray-400">Web Search</span>
                </div>
                <div className="p-3 bg-gray-800 rounded border border-green-500/50 text-center">
                  📊 Market<br />
                  <span className="text-xs text-gray-400">API Fetch</span>
                </div>
              </div>
            </div>

            {/* Wave 2 */}
            <div className="border-2 border-yellow-500/30 rounded-lg p-4 bg-yellow-500/5">
              <p className="text-yellow-400 font-bold mb-3">Wave 2: Dependent (4s)</p>
              <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                <div className="p-3 bg-gray-800 rounded border border-yellow-500/50 text-center">
                  💰 ROI<br />
                  <span className="text-xs text-gray-400">Uses Engineer data</span>
                </div>
                <div className="p-3 bg-gray-800 rounded border border-yellow-500/50 text-center">
                  🔍 Similar<br />
                  <span className="text-xs text-gray-400">RAG validation</span>
                </div>
              </div>
            </div>

            {/* Wave 3 */}
            <div className="border-2 border-purple-500/30 rounded-lg p-4 bg-purple-500/5">
              <p className="text-purple-400 font-bold mb-3">Wave 3: Synthesis (3s)</p>
              <div className="max-w-sm mx-auto">
                <div className="p-3 bg-gray-800 rounded border border-purple-500/50 text-center">
                  📋 Planner<br />
                  <span className="text-xs text-gray-400">Merges all insights</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-green-400 text-2xl">↓</div>

          {/* Output */}
          <div className="px-6 py-3 bg-green-500/20 border-2 border-green-500 rounded-lg">
            Strategic Recommendation + Implementation Plan
          </div>
        </div>

        {/* Tech Stack Badge */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500 rounded-full">
            <span className="text-green-400 font-bold">Powered by</span>
            <span className="text-white font-bold">NVIDIA Nemotron</span>
          </div>
        </div>
      </div>
    </div>
  );
}
