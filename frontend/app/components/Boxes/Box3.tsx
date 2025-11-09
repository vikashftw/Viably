import React from 'react';

export interface BacklogItem {
  id: string;
  summary: string;
  status: string;
}

export const Box3 = ({ backlog }: { backlog: BacklogItem[] }) => {
  // Filter out issues with status 'Done'
  const filteredBacklog = backlog
    ? backlog.filter(issue => issue.status !== 'Done')
    : [];

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 h-full shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:border-slate-600 flex flex-col">
      <h2 className="text-lg font-semibold text-white mb-4 flex-shrink-0">Jira Backlog</h2>
      <div className="overflow-y-auto h-[26.5rem]">
        <div className="space-y-2">
          {filteredBacklog && filteredBacklog.length > 0 ? (
            filteredBacklog.map((issue: any) => (
              <div key={issue.id} className="bg-slate-700/50 p-3 rounded-md w-full text-left text-sm text-slate-300 hover:bg-slate-700 transition-colors h-16 flex flex-col justify-center">
                <p className="font-medium text-white truncate">{issue.summary || 'No summary'}</p>
                <p className="text-xs text-slate-400">{issue.id}</p>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-400">No backlog items found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
