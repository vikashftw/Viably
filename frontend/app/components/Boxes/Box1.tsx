'use client';

import React from 'react';
import { Shield, AlertTriangle, Clock, TrendingUp, RefreshCcw } from 'lucide-react';
import { useAnalysisData } from '../AnalysisProvider';
import { LoadingStateCard, ErrorStateCard } from './BoxState';

const riskStyles: Record<string, { bg: string; text: string; badge: string }> = {
  LOW: {
    bg: 'from-emerald-900 to-emerald-800',
    text: 'text-emerald-300',
    badge: 'bg-emerald-500/20 text-emerald-100 border-emerald-500/50',
  },
  MEDIUM: {
    bg: 'from-amber-900 to-amber-800',
    text: 'text-amber-300',
    badge: 'bg-amber-500/20 text-amber-100 border-amber-500/50',
  },
  HIGH: {
    bg: 'from-red-900 to-red-800',
    text: 'text-red-300',
    badge: 'bg-red-500/20 text-red-100 border-red-500/50',
  },
};

export const Box1 = ({ analysisData }: { analysisData?: any }) => {
  const { data: fallbackData, loading, error, refetch } = useAnalysisData();

  // Use shared analysis data if available, otherwise fall back to context
  const data = analysisData || fallbackData;
  const competitor = data?.competitor || data?.competitor_analysis;

  if (loading) {
    return <LoadingStateCard title="Competitor Intelligence" />;
  }

  if (error) {
    return (
      <ErrorStateCard
        title="Competitor Intelligence"
        message={error}
        onRetry={refetch}
      />
    );
  }

  if (!competitor) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 h-full flex flex-col items-center justify-center text-center">
        <Shield className="w-12 h-12 text-slate-600 mb-3" />
        <h3 className="text-lg font-semibold text-slate-400 mb-1">Competitor Intelligence</h3>
        <p className="text-sm text-slate-500">Select a JIRA item and run Market Research to analyze competitors</p>
      </div>
    );
  }

  const riskLevel = competitor.competitive_risk_level || 'MEDIUM';
  const styles = riskStyles[riskLevel] || riskStyles.MEDIUM;

  return (
    <div className={`bg-gradient-to-br ${styles.bg} border border-slate-700 rounded-lg p-6 h-full shadow-lg text-white flex flex-col overflow-hidden`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
            <Shield className={`w-5 h-5 ${styles.text}`} />
            Competitor Report
          </h2>
          <p className="text-sm text-slate-300">
            Real-time competitive intelligence
          </p>
        </div>
        <button
          onClick={refetch}
          className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
        >
          <RefreshCcw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      {/* Risk Level Badge */}
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${styles.badge} mb-4 w-fit`}>
        <AlertTriangle className="w-4 h-4" />
        <span className="text-sm font-semibold">{riskLevel} RISK</span>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/10 rounded-lg p-3 border border-white/20">
          <div className="text-xs uppercase text-slate-300 mb-1">Competitors</div>
          <div className="text-2xl font-bold">
            {competitor.key_competitors?.length || 0}
          </div>
          <p className="text-xs text-slate-400 mt-1">Active threats</p>
        </div>
        <div className="bg-white/10 rounded-lg p-3 border border-white/20">
          <div className="text-xs uppercase text-slate-300 mb-1">Response Time</div>
          <div className="text-2xl font-bold flex items-baseline gap-1">
            {competitor.expected_response_time_sprints || '—'}
            <span className="text-sm font-normal">sprints</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            ~{(competitor.expected_response_time_sprints || 0) * 2} weeks
          </p>
        </div>
      </div>

      {/* Top Competitors List */}
      <div className="flex-1 overflow-y-auto">
        <div className="text-xs uppercase text-slate-300 mb-2 flex items-center gap-2">
          <TrendingUp className="w-3 h-3" />
          Key Competitors
        </div>
        <div className="space-y-2">
          {competitor.key_competitors?.slice(0, 5).map((comp: string, i: number) => (
            <div
              key={i}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{comp}</span>
                <span className="text-xs text-slate-400">#{i + 1}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Response Strategy */}
      {competitor.response_play && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="text-xs uppercase text-slate-300 mb-2">
            Expected Response
          </div>
          <p className="text-sm text-slate-200 leading-relaxed">
            {competitor.response_play}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-white/10 text-xs text-slate-400 flex items-center gap-2">
        <Clock className="w-3 h-3" />
        <span>Updated in real-time via Serper API</span>
      </div>
    </div>
  );
};
