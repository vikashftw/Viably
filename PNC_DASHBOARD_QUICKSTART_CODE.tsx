/**
 * PNC DASHBOARD - QUICK START CODE
 *
 * This file contains ready-to-use code snippets for building the PNC Dashboard.
 * Copy-paste these into your Box components to get started immediately.
 *
 * SETUP INSTRUCTIONS:
 * 1. Make sure backend is running: cd backend && python main.py
 * 2. Copy the code snippet you need
 * 3. Paste into the appropriate Box file (e.g., Box1.tsx, Box2.tsx)
 * 4. Install dependencies if needed: npm install lucide-react
 */

// ═══════════════════════════════════════════════════════════════════════
// BOX 1: ROI SUMMARY CARD (Recommended for first implementation)
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Clock, CheckCircle } from 'lucide-react';

interface ROIScenario {
  roi_percent: number;
  payback_period_months: number;
  projected_revenue_18mo: number;
}

export const Box1_ROI_Summary = () => {
  const [loading, setLoading] = useState(false);
  const [roiData, setRoiData] = useState<{
    worst: ROIScenario;
    base: ROIScenario;
    best: ROIScenario;
    decision: string;
  } | null>(null);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/analyze-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature_name: 'Smart Branch Connect',
          description: 'Hybrid banking experience connecting digital and in-branch services',
        })
      });

      const data = await response.json();
      const scenarios = data.roi_projections.scenarios;

      setRoiData({
        worst: scenarios.worst_case,
        base: scenarios.base_case,
        best: scenarios.best_case,
        decision: data.overall_recommendation.decision
      });
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg p-6 h-full flex items-center justify-center">
        <div className="text-white text-lg">Analyzing ROI...</div>
      </div>
    );
  }

  if (!roiData) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 h-full">
        <button
          onClick={fetchAnalysis}
          className="w-full h-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 rounded text-white font-bold"
        >
          Run Analysis
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 rounded-lg p-6 h-full shadow-xl border border-blue-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          ROI Projection
        </h2>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
          roiData.decision === 'proceed'
            ? 'bg-green-500 text-white'
            : 'bg-yellow-500 text-black'
        }`}>
          {roiData.decision.toUpperCase()}
        </div>
      </div>

      {/* Scenarios */}
      <div className="space-y-3 mb-4">
        {/* Worst Case */}
        <div className="bg-white/5 rounded-lg p-3 border border-red-500/30">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Worst Case</div>
          <div className="text-2xl font-bold text-red-400">
            {roiData.worst.roi_percent.toFixed(0)}% ROI
          </div>
          <div className="text-xs text-gray-400">
            ${(roiData.worst.projected_revenue_18mo / 1000000).toFixed(1)}M revenue
          </div>
        </div>

        {/* Base Case - Highlighted */}
        <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-lg p-4 border-2 border-green-400">
          <div className="text-xs text-gray-300 uppercase tracking-wide flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Base Case (Recommended)
          </div>
          <div className="text-4xl font-bold text-green-400">
            {roiData.base.roi_percent.toFixed(0)}% ROI
          </div>
          <div className="text-sm text-gray-300 mt-1">
            ${(roiData.base.projected_revenue_18mo / 1000000).toFixed(1)}M revenue in 18 months
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            Payback: {roiData.base.payback_period_months.toFixed(1)} months
          </div>
        </div>

        {/* Best Case */}
        <div className="bg-white/5 rounded-lg p-3 border border-blue-500/30">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Best Case</div>
          <div className="text-2xl font-bold text-blue-400">
            {roiData.best.roi_percent.toFixed(0)}% ROI
          </div>
          <div className="text-xs text-gray-400">
            ${(roiData.best.projected_revenue_18mo / 1000000).toFixed(1)}M revenue
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="text-xs text-gray-400 text-center pt-3 border-t border-white/10">
        Based on historical PNC project adoption rates
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// BOX 2: COST ESTIMATE
// ═══════════════════════════════════════════════════════════════════════

export const Box2_Cost_Estimate = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/analyze-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feature_name: 'Smart Branch Connect',
        description: 'Hybrid banking...',
      })
    })
      .then(res => res.json())
      .then(json => setData(json.engineer_analysis));
  }, []);

  if (!data) return <div className="bg-slate-800 rounded-lg p-6 h-full">Loading...</div>;

  return (
    <div className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-lg p-6 h-full shadow-xl">
      <h2 className="text-xl font-bold text-white mb-4">Cost Estimate</h2>

      <div className="text-center mb-4">
        <div className="text-4xl font-bold text-purple-300">
          ${(data.estimated_cost_usd / 1000).toFixed(0)}K
        </div>
        <div className="text-xs text-gray-400">Total Engineering Cost</div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-white/10 rounded p-2">
          <div className="text-gray-400 text-xs">Sprints</div>
          <div className="text-2xl font-bold text-white">{data.estimated_sprints}</div>
        </div>
        <div className="bg-white/10 rounded p-2">
          <div className="text-gray-400 text-xs">Engineers</div>
          <div className="text-2xl font-bold text-white">{data.estimated_engineers}</div>
        </div>
      </div>

      <div className="mt-3 text-xs">
        <div className="text-gray-400 mb-1">Confidence</div>
        <div className="w-full bg-gray-700 rounded h-2">
          <div
            className="bg-green-500 h-2 rounded"
            style={{ width: `${data.confidence * 100}%` }}
          />
        </div>
        <div className="text-right text-gray-400 mt-1">{(data.confidence * 100).toFixed(0)}%</div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// BOX 3: COMPETITOR ANALYSIS
// ═══════════════════════════════════════════════════════════════════════

export const Box3_Competitors = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/analyze-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feature_name: 'Smart Branch Connect',
        description: 'Hybrid banking...',
      })
    })
      .then(res => res.json())
      .then(json => setData(json.competitor_analysis));
  }, []);

  if (!data) return <div className="bg-slate-800 rounded-lg p-6 h-full">Loading...</div>;

  const riskColor = {
    LOW: 'bg-green-500',
    MEDIUM: 'bg-yellow-500',
    HIGH: 'bg-red-500'
  }[data.competitive_risk_level] || 'bg-gray-500';

  return (
    <div className="bg-gradient-to-br from-red-900 to-red-800 rounded-lg p-6 h-full shadow-xl overflow-y-auto">
      <h2 className="text-xl font-bold text-white mb-4">Competitive Landscape</h2>

      {/* Risk Badge */}
      <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 ${riskColor}`}>
        {data.competitive_risk_level} RISK
      </div>

      {/* Competitors List */}
      <div className="space-y-2 mb-4">
        <div className="text-xs text-gray-400 uppercase">Key Competitors</div>
        {data.key_competitors.slice(0, 5).map((competitor: string, i: number) => (
          <div key={i} className="bg-white/10 rounded px-3 py-2 text-sm text-white">
            {i + 1}. {competitor}
          </div>
        ))}
      </div>

      {/* Response Time */}
      <div className="bg-white/10 rounded p-3">
        <div className="text-xs text-gray-400">Expected Response Time</div>
        <div className="text-2xl font-bold text-white">
          {data.expected_response_time_sprints} sprints
        </div>
        <div className="text-xs text-gray-400">
          (~{data.expected_response_time_sprints * 2} weeks)
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// BOX 4: MARKET INTELLIGENCE
// ═══════════════════════════════════════════════════════════════════════

export const Box4_Market = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/analyze-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feature_name: 'Smart Branch Connect',
        description: 'Hybrid banking...',
      })
    })
      .then(res => res.json())
      .then(json => setData(json.market_intelligence));
  }, []);

  if (!data) return <div className="bg-slate-800 rounded-lg p-6 h-full">Loading...</div>;

  return (
    <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-lg p-6 h-full shadow-xl">
      <h2 className="text-xl font-bold text-white mb-4">Market Size</h2>

      <div className="text-center mb-4">
        <div className="text-4xl font-bold text-green-300">
          ${(data.market_size_usd / 1000000000).toFixed(0)}B
        </div>
        <div className="text-xs text-gray-400">Total Addressable Market</div>
      </div>

      <div className="bg-white/10 rounded p-3">
        <div className="text-xs text-gray-400 mb-1">Annual Growth (CAGR)</div>
        <div className="text-3xl font-bold text-white">
          {(data.growth_rate_cagr * 100).toFixed(0)}%
        </div>
      </div>

      {data.source_url && (
        <a
          href={data.source_url}
          target="_blank"
          className="text-xs text-blue-400 hover:text-blue-300 underline mt-3 block truncate"
        >
          View Source →
        </a>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// BOX 5: RECOMMENDATION
// ═══════════════════════════════════════════════════════════════════════

export const Box5_Recommendation = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/analyze-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feature_name: 'Smart Branch Connect',
        description: 'Hybrid banking...',
      })
    })
      .then(res => res.json())
      .then(json => setData(json.overall_recommendation));
  }, []);

  if (!data) return <div className="bg-slate-800 rounded-lg p-6 h-full">Loading...</div>;

  const decisionColor = {
    proceed: 'from-green-600 to-green-700',
    proceed_with_caution: 'from-yellow-600 to-yellow-700',
    delay: 'from-orange-600 to-orange-700',
    avoid: 'from-red-600 to-red-700'
  }[data.decision] || 'from-gray-600 to-gray-700';

  return (
    <div className={`bg-gradient-to-br ${decisionColor} rounded-lg p-6 h-full shadow-xl`}>
      <h2 className="text-xl font-bold text-white mb-4">Final Decision</h2>

      <div className="text-center mb-4">
        <div className="text-3xl font-bold text-white uppercase">
          {data.decision.replace('_', ' ')}
        </div>
        <div className="text-sm text-white/80 mt-2">
          Confidence: {(data.confidence * 100).toFixed(0)}%
        </div>
      </div>

      <div className="bg-white/20 rounded p-3 text-sm text-white">
        <div className="font-semibold mb-2">Key Reasoning:</div>
        <ul className="space-y-1 text-xs">
          {data.reasoning.slice(0, 3).map((reason: string, i: number) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-white/60">•</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// BOX 6: SIMILAR FEATURES TABLE
// ═══════════════════════════════════════════════════════════════════════

export const Box6_Similar_Features = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/analyze-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feature_name: 'Smart Branch Connect',
        description: 'Hybrid banking...',
      })
    })
      .then(res => res.json())
      .then(json => setData(json.similar_features.similar_projects));
  }, []);

  if (!data) return <div className="bg-slate-800 rounded-lg p-6 h-full">Loading...</div>;

  return (
    <div className="bg-slate-800 rounded-lg p-6 h-full shadow-xl overflow-auto">
      <h2 className="text-xl font-bold text-white mb-4">Similar PNC Projects</h2>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left py-2 text-gray-400">Project</th>
            <th className="text-left py-2 text-gray-400">Similarity</th>
            <th className="text-left py-2 text-gray-400">Cost</th>
            <th className="text-left py-2 text-gray-400">Adoption</th>
            <th className="text-left py-2 text-gray-400">Outcome</th>
          </tr>
        </thead>
        <tbody>
          {data.map((project: any, i: number) => (
            <tr key={i} className="border-b border-gray-700/50">
              <td className="py-3 text-white">{project.name}</td>
              <td className="py-3">
                <div className="flex items-center gap-2">
                  <div className="w-12 bg-gray-700 rounded h-2">
                    <div
                      className="bg-blue-500 h-2 rounded"
                      style={{ width: `${project.similarity_score * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">
                    {(project.similarity_score * 100).toFixed(0)}%
                  </span>
                </div>
              </td>
              <td className="py-3 text-gray-300">
                ${(project.cost_usd / 1000).toFixed(0)}K
              </td>
              <td className="py-3 text-gray-300">
                {(project.adoption_rate * 100).toFixed(0)}%
              </td>
              <td className="py-3">
                <span className={`px-2 py-1 rounded text-xs ${
                  project.outcome === 'success'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {project.outcome}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// BONUS: SHARED STATE PATTERN (Context Provider)
// ═══════════════════════════════════════════════════════════════════════

/**
 * To avoid fetching data 6 times (once per box), use this shared context.
 *
 * SETUP:
 * 1. Wrap BentoGrid with this provider
 * 2. All boxes use useAnalysisData() hook to access shared data
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AnalysisContextType {
  data: any;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export const AnalysisProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/api/analyze-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature_name: 'Smart Branch Connect',
          description: 'Hybrid banking experience...',
        })
      });

      if (!response.ok) throw new Error('API request failed');

      const json = await response.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <AnalysisContext.Provider value={{ data, loading, error, refetch: fetchData }}>
      {children}
    </AnalysisContext.Provider>
  );
};

export const useAnalysisData = () => {
  const context = useContext(AnalysisContext);
  if (!context) throw new Error('useAnalysisData must be used within AnalysisProvider');
  return context;
};

/**
 * USAGE IN BENTOGRID:
 *
 * export const BentoGrid = () => {
 *   return (
 *     <AnalysisProvider>
 *       <div className="grid grid-cols-3 grid-rows-3 gap-4 h-full">
 *         <Box1 />
 *         <Box2 />
 *         ...
 *       </div>
 *     </AnalysisProvider>
 *   );
 * };
 *
 * Then in each box:
 *
 * export const Box1 = () => {
 *   const { data, loading } = useAnalysisData();
 *
 *   if (loading) return <div>Loading...</div>;
 *
 *   const roi = data.roi_projections.scenarios.base_case;
 *   return <div>{roi.roi_percent}%</div>;
 * };
 */
