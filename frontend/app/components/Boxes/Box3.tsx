import React from 'react';
import { MoreVertical } from 'lucide-react';

export const Box3 = ({ backlog }: { backlog: any[] }) => {
  // Filter out issues with status 'Done'
  const filteredBacklog = backlog
    ? backlog.filter(issue => issue.status !== 'Done')
    : [];

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 h-full shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:border-slate-600 flex flex-col">
      <h2 className="text-lg font-semibold text-white mb-4 flex-shrink-0">Jira Backlog</h2>
      <div className="overflow-y-auto h-[30rem]">
        <div className="space-y-2">
          {filteredBacklog && filteredBacklog.length > 0 ? (
            filteredBacklog.map((issue: any) => (
              <div key={issue.id} className="bg-slate-700/50 px-3 py-2 rounded-md w-full text-left text-sm text-slate-300 hover:bg-slate-700 transition-colors h-[4.6rem] flex items-center justify-between">
                <div>
                  <p className="font-medium text-white truncate">{issue.summary || 'No summary'}</p>
                  <p className="text-xs text-slate-400">{issue.id}</p>
                </div>
                <button className="p-2 rounded-full hover:bg-slate-600 text-slate-400 hover:text-white">
                  <MoreVertical className="w-5 h-5" />
                </button>
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
