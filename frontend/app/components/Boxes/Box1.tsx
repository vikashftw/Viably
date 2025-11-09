'use client';

import React from 'react';
import { TrendingUp, DollarSign, Clock, RefreshCcw } from 'lucide-react';
import { useAnalysisData } from '../AnalysisProvider';
import { LoadingStateCard, ErrorStateCard } from './BoxState';

const scenarioLabels = {
  worst_case: 'Worst Case',
  base_case: 'Base Case',
  best_case: 'Best Case',
} as const;

const scenarioOrder = ['worst_case', 'base_case', 'best_case'] as const;

const formatCurrency = (value?: number) => {
  if (typeof value !== 'number') return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};

export const Box1 = () => {
  const { data, loading, error, refetch } = useAnalysisData();
  const scenarios = data?.roi_projections?.scenarios;
  const recommendedKey = data?.roi_projections?.recommended_scenario;
  const recommendedScenario = recommendedKey
    ? scenarios?.[recommendedKey]
    : null;

  if (loading) {
    return <LoadingStateCard title="ROI projections" />;
  }

  if (error || !scenarios) {
    return (
      <ErrorStateCard
        title="ROI projections"
        message={error ?? 'ROI data unavailable'}
        onRetry={refetch}
      />
    );
  }

  const successProbability =
    data?.overall_recommendation?.success_probability ?? null;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-700 rounded-lg p-6 h-full shadow-lg text-white flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold mb-1 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-300" />
            ROI Projection
          </h2>
          <p className="text-sm text-slate-400">
            {data?.feature_name ?? 'Feature analysis'}
          </p>
        </div>
        <button
          onClick={refetch}
          className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 border border-slate-600 hover:bg-slate-700 transition-colors"
        >
          <RefreshCcw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      {recommendedScenario && (
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="text-xs uppercase text-slate-400 mb-1">
              Recommended
            </div>
            <div className="text-3xl font-bold">
              {recommendedScenario.roi_percent.toFixed(0)}%
            </div>
            <p className="text-xs text-slate-400 mt-1">ROI ({scenarioLabels[recommendedScenario.scenario] ?? 'Scenario'})</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="text-xs uppercase text-slate-400 mb-1">
              Payback
            </div>
            <div className="text-3xl font-bold">
              {recommendedScenario.payback_period_months.toFixed(1)}
            </div>
            <p className="text-xs text-slate-400 mt-1">Months to payback</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="text-xs uppercase text-slate-400 mb-1">
              Revenue (18mo)
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(recommendedScenario.projected_revenue_18mo)}
            </div>
            <p className="text-xs text-slate-400 mt-1">Projected gross</p>
          </div>
        </div>
      )}

      {successProbability !== null && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Success probability</span>
            <span>{(successProbability * 100).toFixed(0)}%</span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400"
              style={{ width: `${Math.min(100, successProbability * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-6 space-y-3 flex-1">
        {scenarioOrder.map((key) => {
          const scenario = scenarios[key];
          if (!scenario) return null;
          return (
            <div
              key={key}
              className="bg-slate-800/60 border border-slate-700 rounded-lg p-3 text-sm"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>{scenarioLabels[key]}</span>
                <span>
                  {typeof scenario.adoption_rate === 'number'
                    ? `${(scenario.adoption_rate * 100).toFixed(0)}% adoption`
                    : ''}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-300" />
                  <span className="font-semibold">
                    {scenario.roi_percent.toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-300" />
                  <span>{scenario.payback_period_months.toFixed(1)} mo</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-300" />
                  <span>{formatCurrency(scenario.projected_revenue_18mo)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
