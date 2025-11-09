'use client';

import React from 'react';
import { ClipboardList, AlertCircle, CheckCircle, ListTodo } from 'lucide-react';
import { useAnalysisData } from '../AnalysisProvider';

export interface BacklogItem {
  id: string;
  summary: string;
  status: string;
}

export const Box3 = ({ backlog }: { backlog: BacklogItem[] }) => {
  const { data } = useAnalysisData();

  // Filter out issues with status 'Done'
  const filteredBacklog = backlog
    ? backlog.filter(issue => issue.status !== 'Done')
    : [];

  // Get engineer analysis for build tasks
  const engineer = data?.engineer_analysis;
  const sprints = engineer?.estimated_sprints || 0;
  const engineers = engineer?.estimated_engineers || 0;
  const risks = engineer?.key_risks || [];

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-lg p-4 h-full shadow-lg text-white flex flex-col overflow-hidden">
      <div className="flex-shrink-0 mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-2">
          <ClipboardList className="w-5 h-5 text-blue-300" />
          Overall Backlog
        </h2>
        <p className="text-xs text-slate-400">
          Combined Jira backlog + AI analysis
        </p>
      </div>

      {/* Summary Stats */}
      <div className="flex-shrink-0 grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white/5 rounded-lg p-2 border border-white/10">
          <div className="text-xs text-slate-400">Jira Items</div>
          <div className="text-xl font-bold">{filteredBacklog.length}</div>
        </div>
        <div className="bg-white/5 rounded-lg p-2 border border-white/10">
          <div className="text-xs text-slate-400">Sprints</div>
          <div className="text-xl font-bold">{sprints}</div>
        </div>
        <div className="bg-white/5 rounded-lg p-2 border border-white/10">
          <div className="text-xs text-slate-400">Team Size</div>
          <div className="text-xl font-bold">{engineers}</div>
        </div>
      </div>

      {/* Risks Section */}
      {risks.length > 0 && (
        <div className="flex-shrink-0 mb-4">
          <div className="text-xs uppercase text-slate-400 mb-2 flex items-center gap-2">
            <AlertCircle className="w-3 h-3" />
            Top Build Risks
          </div>
          <div className="space-y-2">
            {risks.slice(0, 2).map((risk: string, i: number) => (
              <div
                key={i}
                className="bg-red-500/10 border border-red-500/30 rounded-lg px-2 py-2 text-xs"
              >
                <span className="text-red-300">⚠</span> {risk}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Jira Backlog Items */}
      <div className="flex-1 overflow-y-auto">
        <div className="text-xs uppercase text-slate-400 mb-2 flex items-center gap-2">
          <ListTodo className="w-3 h-3" />
          Active Jira Items
        </div>
        <div className="space-y-2">
          {filteredBacklog && filteredBacklog.length > 0 ? (
            filteredBacklog.map((issue: any) => (
              <div
                key={issue.id}
                onClick={() => {
                  console.log('🎯 Backlog item clicked:', {
                    id: issue.id,
                    summary: issue.summary,
                    status: issue.status,
                    timestamp: new Date().toISOString()
                  });
                }}
                className="bg-slate-700/50 border border-slate-600/50 p-2 rounded-md text-sm hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-xs truncate">
                      {issue.summary || 'No summary'}
                    </p>
                    <p className="text-xs text-slate-400">{issue.id}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-20 bg-slate-800/50 rounded-lg border border-dashed border-slate-600">
              <p className="text-slate-400 text-sm">No Jira items found</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 mt-3 pt-3 border-t border-slate-700">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Live sync with Jira</span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Connected
          </span>
        </div>
      </div>
    </div>
  );
};
