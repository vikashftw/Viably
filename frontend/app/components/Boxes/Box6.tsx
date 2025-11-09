'use client';

import React from 'react';
import { Layers3, Percent, DollarSign } from 'lucide-react';
import { useAnalysisData } from '../AnalysisProvider';
import { LoadingStateCard, ErrorStateCard } from './BoxState';

const formatUsd = (value?: number) => {
  if (typeof value !== 'number') return '—';
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  return `$${(value / 1_000).toFixed(0)}K`;
};

export const Box6 = () => {
  const { data, loading, error, refetch } = useAnalysisData();
  const similarProjects = data?.similar_features?.similar_projects ?? [];
  const basis = data?.similar_features?.cost_estimate_basis;

  if (loading) {
    return <LoadingStateCard title="Similar projects" />;
  }

  if (error) {
    return (
      <ErrorStateCard
        title="Similar projects"
        message={error}
        onRetry={refetch}
      />
    );
  }

  if (!similarProjects.length) {
    return (
      <ErrorStateCard
        title="Similar projects"
        message="No matching projects found"
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 h-full shadow-lg text-white flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Layers3 className="w-5 h-5 text-sky-300" />
          Similar PNC Projects
        </h2>
        {basis?.most_similar_project && (
          <span className="text-xs text-slate-300">
            Basis: {basis.most_similar_project} (
            {(basis.similarity_score * 100).toFixed(0)}%)
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-800/70 text-slate-400 text-xs uppercase">
            <tr>
              <th className="py-3 px-3 text-left font-semibold">Project</th>
              <th className="py-3 px-3 text-left font-semibold">Similarity</th>
              <th className="py-3 px-3 text-left font-semibold">Cost</th>
              <th className="py-3 px-3 text-left font-semibold">Adoption</th>
              <th className="py-3 px-3 text-left font-semibold">Outcome</th>
            </tr>
          </thead>
          <tbody>
            {similarProjects.slice(0, 5).map((project) => (
              <tr
                key={project.name}
                className="border-t border-slate-800/80 text-slate-200"
              >
                <td className="py-3 px-3 font-semibold">{project.name}</td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Percent className="w-3 h-3" />
                      {(project.similarity_score * 100).toFixed(0)}%
                    </div>
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-400"
                        style={{
                          width: `${Math.min(
                            100,
                            project.similarity_score * 100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-emerald-300" />
                    {formatUsd(project.cost_usd)}
                  </div>
                </td>
                <td className="py-3 px-3">
                  {(project.adoption_rate * 100).toFixed(0)}%
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      project.outcome === 'success'
                        ? 'bg-emerald-500/20 text-emerald-200'
                        : 'bg-amber-500/20 text-amber-100'
                    }`}
                  >
                    {project.outcome.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
