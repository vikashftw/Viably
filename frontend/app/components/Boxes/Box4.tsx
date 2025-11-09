'use client';

import React from 'react';
import { Globe, TrendingUp, ExternalLink, Shield } from 'lucide-react';
import { useAnalysisData } from '../AnalysisProvider';
import { LoadingStateCard, ErrorStateCard } from './BoxState';

const formatBillions = (value?: number) => {
  if (typeof value !== 'number') return '—';
  return `${(value / 1_000_000_000).toFixed(1)}B`;
};

export const Box4 = () => {
  const { data, loading, error, refetch } = useAnalysisData();
  const market = data?.market_intelligence;

  if (loading) {
    return <LoadingStateCard title="Market intelligence" />;
  }

  if (error || !market) {
    return (
      <ErrorStateCard
        title="Market intelligence"
        message={error ?? 'Market insights unavailable'}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 h-full shadow-lg text-white flex flex-col">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Globe className="w-5 h-5 text-emerald-300" />
          Market Intelligence
        </h2>
        {market.confidence && (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 border border-slate-700">
            {market.confidence} confidence
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-xs uppercase text-slate-400 mb-1">TAM</p>
          <p className="text-3xl font-bold">
            {formatBillions(market.market_size_usd)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Total addressable market
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-xs uppercase text-slate-400 mb-1">Growth (CAGR)</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">
              {typeof market.growth_rate_cagr === 'number'
                ? (market.growth_rate_cagr * 100).toFixed(1)
                : '—'}
            </span>
            <span className="text-sm text-slate-400">%</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">YoY growth</p>
        </div>
      </div>

      {market.note && (
        <div className="mt-6 bg-slate-800/70 border border-slate-700 rounded-lg p-4 text-sm text-slate-300 flex gap-3">
          <Shield className="w-5 h-5 text-amber-300 flex-shrink-0" />
          <p>{market.note}</p>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          <span>{data?.industry ?? 'Banking'} outlook</span>
        </div>
        {market.source_url && (
          <a
            href={market.source_url}
            target="_blank"
            className="inline-flex items-center gap-1 text-emerald-300 hover:text-emerald-200"
            rel="noreferrer"
          >
            View source
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
};
