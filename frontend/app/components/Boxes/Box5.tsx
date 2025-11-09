'use client';

import React from 'react';
import { Award, AlertTriangle } from 'lucide-react';
import { useAnalysisData } from '../AnalysisProvider';
import { LoadingStateCard, ErrorStateCard } from './BoxState';

const decisionStyles: Record<
  string,
  { gradient: string; label: string; badge: string }
> = {
  proceed: {
    gradient: 'from-emerald-600 via-emerald-600 to-emerald-700',
    label: 'Proceed',
    badge: 'bg-emerald-500/20 text-emerald-100',
  },
  proceed_with_caution: {
    gradient: 'from-amber-600 via-amber-600 to-amber-700',
    label: 'Proceed w/ Caution',
    badge: 'bg-amber-500/20 text-amber-100',
  },
  delay: {
    gradient: 'from-orange-600 via-orange-600 to-orange-700',
    label: 'Delay',
    badge: 'bg-orange-500/20 text-orange-100',
  },
  avoid: {
    gradient: 'from-red-600 via-red-600 to-red-700',
    label: 'Avoid',
    badge: 'bg-red-500/20 text-red-100',
  },
};

export const Box5 = () => {
  const { data, loading, error, refetch } = useAnalysisData();
  const recommendation = data?.overall_recommendation;

  if (loading) {
    return <LoadingStateCard title="Recommendation" />;
  }

  if (error || !recommendation) {
    return (
      <ErrorStateCard
        title="Recommendation"
        message={error ?? 'Recommendation unavailable'}
        onRetry={refetch}
      />
    );
  }

  const styles =
    decisionStyles[recommendation.decision] ?? decisionStyles.proceed_with_caution;

  return (
    <div
      className={`bg-gradient-to-br ${styles.gradient} rounded-lg p-6 h-full shadow-xl text-white flex flex-col`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Award className="w-5 h-5" />
          Recommendation
        </h2>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${styles.badge}`}>
          Confidence {(recommendation.confidence * 100).toFixed(0)}%
        </span>
      </div>

      <div className="mt-6 text-center">
        <p className="text-3xl font-bold uppercase tracking-wide">
          {styles.label}
        </p>
        {recommendation.success_probability !== undefined && (
          <p className="text-sm text-white/80 mt-2">
            Success probability {(recommendation.success_probability * 100).toFixed(0)}%
          </p>
        )}
      </div>

      {recommendation.reasoning?.length ? (
        <div className="mt-6 bg-white/15 rounded-lg p-4">
          <p className="text-xs uppercase text-white/80 mb-2">Rationale</p>
          <ul className="space-y-2 text-sm text-white/90">
            {recommendation.reasoning.slice(0, 3).map((reason, idx) => (
              <li key={reason} className="flex gap-2">
                <span className="text-base leading-tight">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {recommendation.key_concerns?.length ? (
        <div className="mt-4 bg-black/20 rounded-lg p-4 text-sm text-white/90 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide">
            <AlertTriangle className="w-4 h-4" />
            Key concerns
          </div>
          <ul className="space-y-1">
            {recommendation.key_concerns.slice(0, 2).map((concern) => (
              <li key={concern}>• {concern}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
};
