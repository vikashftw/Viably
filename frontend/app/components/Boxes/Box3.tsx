import React, { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { useAnalysisData } from '../AnalysisProvider';

export const Box3 = ({ backlog }: { backlog: any[] }) => {
  const { triggerAnalysis, loading: analysisLoading, data: analysisData } = useAnalysisData();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isCreatingPR, setIsCreatingPR] = useState<string | null>(null);
  const [analyzingIssue, setAnalyzingIssue] = useState<string | null>(null);

  // Filter out issues with status 'Done'
  const filteredBacklog = backlog
    ? backlog.filter(issue => issue.status !== 'Done')
    : [];

  const handleMenuClick = (issueId: string) => {
    setActiveMenu(prev => (prev === issueId ? null : issueId));
  };

  const handleMarketResearch = async (issue: any) => {
    setAnalyzingIssue(issue.id);
    try {
      await triggerAnalysis(
        issue.summary || 'Feature Analysis',
        `Implementation for Jira issue: ${issue.id} - ${issue.summary || 'No description'}`
      );
    } catch (error) {
      console.error('Failed to run analysis:', error);
      alert(`Error running analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAnalyzingIssue(null);
    }
  };

  const handleCreatePR = async (issue: any) => {
    if (!analysisData) {
      alert('Please run Market Research first to analyze this feature');
      return;
    }

    setIsCreatingPR(issue.id);
    try {
      const viablyAnalysis = {
        feature_name: issue.summary,
        description: `Implementation for Jira issue: ${issue.id} - ${issue.summary}`,
        engineer_analysis: analysisData.engineer_analysis || {},
        competitor_analysis: analysisData.competitor_analysis || {},
        similar_features: analysisData.similar_features || {},
        roi_projections: analysisData.roi_projections || {},
        overall_recommendation: analysisData.overall_recommendation || {}
      };

      const response = await fetch('http://localhost:3002/api/implementation-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          viably_analysis: viablyAnalysis
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to create PR');
      }

      const result = await response.json();
      if (result.pr_details?.url) {
        window.open(result.pr_details.url, '_blank');
      }
    } catch (error) {
      console.error('Failed to create PR:', error);
      alert(`Error creating PR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreatingPR(null);
      setActiveMenu(null); // Close menu after action
    }
  };

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
                <div className="flex items-center space-x-2">
                  <div
                    className={`flex items-center space-x-2 transition-all duration-300 ease-in-out overflow-hidden ${
                      activeMenu === issue.id ? 'max-w-xs' : 'max-w-0'
                    }`}
                  >
                    <button
                      onClick={() => handleMarketResearch(issue)}
                      disabled={analyzingIssue === issue.id || analysisLoading}
                      className="bg-indigo-600 text-white px-4 py-1.5 rounded-md text-sm whitespace-nowrap hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed"
                    >
                      {analyzingIssue === issue.id || analysisLoading ? 'Analyzing...' : 'Market Research'}
                    </button>
                    <button
                      onClick={() => handleCreatePR(issue)}
                      disabled={isCreatingPR === issue.id || !analysisData || analysisLoading}
                      className="bg-emerald-600 text-white px-4 py-1.5 rounded-md text-sm whitespace-nowrap hover:bg-emerald-700 disabled:bg-emerald-800 disabled:cursor-not-allowed"
                    >
                      {isCreatingPR === issue.id ? 'Creating...' : 'Create PR'}
                    </button>
                  </div>
                  <button
                    onClick={() => handleMenuClick(issue.id)}
                    className="p-2 rounded-full hover:bg-slate-600 text-slate-400 hover:text-white"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
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
