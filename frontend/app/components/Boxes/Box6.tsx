'use client';

import React from 'react';
import { FileText, TrendingUp, DollarSign, Users, Calendar, Award, Shield, Globe } from 'lucide-react';
import { useAnalysisData } from '../AnalysisProvider';
import { LoadingStateCard, ErrorStateCard } from './BoxState';

const formatUsd = (value?: number) => {
  if (typeof value !== 'number') return '—';
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  return `$${(value / 1_000).toFixed(0)}K`;
};

export const Box6 = () => {
  const { data, loading, error, refetch } = useAnalysisData();

  if (loading) {
    return <LoadingStateCard title="Executive Summary" />;
  }

  if (error) {
    return (
      <ErrorStateCard
        title="Executive Summary"
        message={error}
        onRetry={refetch}
      />
    );
  }

  if (!data) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 h-full flex flex-col items-center justify-center text-center">
        <FileText className="w-12 h-12 text-slate-600 mb-3" />
        <h3 className="text-lg font-semibold text-slate-400 mb-1">Executive Summary</h3>
        <p className="text-sm text-slate-500">Complete analysis summary will appear here</p>
      </div>
    );
  }

  const engineer = data?.engineer_analysis;
  const roi = data?.roi_projections?.scenarios?.base_case;
  const competitor = data?.competitor_analysis;
  const market = data?.market_intelligence;
  const recommendation = data?.overall_recommendation;

  const decisionColors: Record<string, string> = {
    proceed: 'text-emerald-400',
    proceed_with_caution: 'text-amber-400',
    delay: 'text-orange-400',
    avoid: 'text-red-400',
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-700 rounded-lg p-6 h-full shadow-lg text-white flex flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-300" />
            Executive Summary
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {data.feature_name || 'Feature Analysis'}
          </p>
        </div>
        {recommendation?.decision && (
          <div className={`px-4 py-2 rounded-lg bg-white/5 border border-white/10`}>
            <div className="text-xs uppercase text-slate-400">Decision</div>
            <div className={`text-lg font-bold ${decisionColors[recommendation.decision] || 'text-white'}`}>
              {recommendation.decision?.replace('_', ' ')?.toUpperCase() || 'PENDING'}
            </div>
          </div>
        )}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {/* ROI */}
        {roi && (
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border border-emerald-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <div className="text-xs uppercase text-emerald-300">ROI</div>
            </div>
            <div className="text-2xl font-bold text-emerald-400">
              {roi.roi_percent.toFixed(0)}%
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {roi.payback_period_months.toFixed(1)} mo payback
            </div>
          </div>
        )}

        {/* Cost */}
        {engineer && (
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-blue-400" />
              <div className="text-xs uppercase text-blue-300">Cost</div>
            </div>
            <div className="text-2xl font-bold text-blue-400">
              {formatUsd(engineer.estimated_cost_usd)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {engineer.estimated_sprints} sprints
            </div>
          </div>
        )}

        {/* Team */}
        {engineer && (
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-purple-400" />
              <div className="text-xs uppercase text-purple-300">Team</div>
            </div>
            <div className="text-2xl font-bold text-purple-400">
              {engineer.estimated_engineers}
            </div>
            <div className="text-xs text-slate-400 mt-1">Engineers needed</div>
          </div>
        )}

        {/* Market */}
        {market && (
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border border-amber-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-4 h-4 text-amber-400" />
              <div className="text-xs uppercase text-amber-300">Market</div>
            </div>
            <div className="text-2xl font-bold text-amber-400">
              {formatUsd(market.market_size_usd)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {market.growth_rate_cagr ? (market.growth_rate_cagr * 100).toFixed(1) : '0'}% CAGR
            </div>
          </div>
        )}
      </div>

      {/* Key Insights */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-3">
          {/* Competitive Landscape */}
          {competitor && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-red-300" />
                <h3 className="text-sm font-semibold text-white">Competitive Landscape</h3>
              </div>
              <div className="text-xs text-slate-300">
                <span className={`font-semibold ${
                  competitor.competitive_risk_level === 'HIGH' ? 'text-red-400' :
                  competitor.competitive_risk_level === 'MEDIUM' ? 'text-amber-400' :
                  'text-emerald-400'
                }`}>
                  {competitor.competitive_risk_level} RISK
                </span>
                {' • '}
                {competitor.key_competitors?.length || 0} active competitors
                {' • '}
                {competitor.expected_response_time_sprints} sprints response time
              </div>
            </div>
          )}

          {/* Revenue Projection */}
          {roi && data?.roi_projections?.scenarios && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-emerald-300" />
                <h3 className="text-sm font-semibold text-white">Revenue Projection (18mo)</h3>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="text-slate-400">Worst</div>
                  <div className="text-red-300 font-semibold">
                    {formatUsd(data.roi_projections.scenarios.worst_case?.projected_revenue_18mo)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Base</div>
                  <div className="text-emerald-300 font-semibold">
                    {formatUsd(roi.projected_revenue_18mo)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Best</div>
                  <div className="text-blue-300 font-semibold">
                    {formatUsd(data.roi_projections.scenarios.best_case?.projected_revenue_18mo)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recommendation Rationale */}
          {recommendation?.reasoning && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-purple-300" />
                <h3 className="text-sm font-semibold text-white">Key Rationale</h3>
              </div>
              <ul className="space-y-1 text-xs text-slate-300">
                {recommendation.reasoning.slice(0, 3).map((reason: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-700 flex items-center justify-between text-xs">
        <div className="text-slate-400">
          Analyzed by {data.analysis_id ? '6 AI agents' : 'AI system'}
        </div>
        {recommendation && (
          <div className="text-slate-300">
            Confidence: <span className="font-semibold text-white">{(recommendation.confidence * 100).toFixed(0)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};
