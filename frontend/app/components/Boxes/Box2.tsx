'use client';

import React from 'react';
import { Hammer, Users, Activity, AlertTriangle } from 'lucide-react';
import { useAnalysisData } from '../AnalysisProvider';
import { LoadingStateCard, ErrorStateCard } from './BoxState';

const formatUsd = (value?: number) => {
  if (typeof value !== 'number') return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};

export const Box2 = () => {
  const { data, loading, error, refetch } = useAnalysisData();
  const engineer = data?.engineer_analysis;

  if (loading) {
    return <LoadingStateCard title="Engineering estimate" />;
  }

  if (error) {
    return (
      <ErrorStateCard
        title="Engineering estimate"
        message={error}
        onRetry={refetch}
      />
    );
  }

  if (!engineer) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 h-full flex flex-col items-center justify-center text-center">
        <Hammer className="w-12 h-12 text-slate-600 mb-3" />
        <h3 className="text-lg font-semibold text-slate-400 mb-1">Build Plan</h3>
        <p className="text-sm text-slate-500">Run Market Research to get cost and timeline estimates</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 h-full shadow-lg text-white flex flex-col">
      <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
        <Hammer className="w-5 h-5 text-sky-300" />
        Build Plan
      </h2>
      <p className="text-sm text-slate-400 mb-6">
        Live estimate from Engineer Agent
      </p>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
          <div className="text-xs uppercase text-slate-400 mb-1">Total cost</div>
          <div className="text-2xl font-bold">{formatUsd(engineer.estimated_cost_usd)}</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
          <div className="text-xs uppercase text-slate-400 mb-1">Confidence</div>
          <div className="text-2xl font-bold">
            {(engineer.confidence * 100).toFixed(0)}%
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center gap-3">
          <Users className="w-5 h-5 text-emerald-300" />
          <div>
            <p className="text-2xl font-bold">{engineer.estimated_engineers}</p>
            <p className="text-xs uppercase text-slate-400">Engineers</p>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center gap-3">
          <Activity className="w-5 h-5 text-amber-300" />
          <div>
            <p className="text-2xl font-bold">{engineer.estimated_sprints}</p>
            <p className="text-xs uppercase text-slate-400">Sprints</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Confidence</span>
          <span>{(engineer.confidence * 100).toFixed(0)}%</span>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-sky-400"
            style={{ width: `${Math.min(100, engineer.confidence * 100)}%` }}
          />
        </div>
      </div>

      {engineer.key_risks?.length ? (
        <div className="mt-6">
          <p className="text-xs uppercase text-slate-400 mb-2">
            Top build risks
          </p>
          <ul className="space-y-2 text-sm">
            {engineer.key_risks.slice(0, 3).map((risk, index) => (
              <li
                key={risk}
                className="flex items-start gap-2 bg-slate-800/70 border border-slate-700 rounded-lg p-3"
              >
                <AlertTriangle className="w-4 h-4 text-amber-300 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">
                    Risk {index + 1}
                  </p>
                  <p className="text-slate-300">{risk}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
};
