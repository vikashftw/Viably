'use client';

import { useState, useEffect } from 'react';
import { GitBranch, ArrowLeft } from 'lucide-react';
import { AnalysisResults } from './components/AnalysisResults';
import { JiraButton } from './components/JiraButton';

export default function Dashboard() {
  const [isJiraConnected, setIsJiraConnected] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [featureName, setFeatureName] = useState('');
  const [description, setDescription] = useState('');
  const [targetUser, setTargetUser] = useState('PNC customers');
  const [businessGoal, setBusinessGoal] = useState('increase engagement and revenue');

  useEffect(() => {
    const checkJiraStatus = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/jira/status');
        const data = await response.json();
        setIsJiraConnected(data.connected);
      } catch (error) {
        console.error('Failed to fetch Jira status:', error);
      }
    };
    checkJiraStatus();
  }, []);

  useEffect(() => {
    if (isJiraConnected) {
      const fetchBacklog = async () => {
        try {
          const response = await fetch('http://localhost:8000/api/jira/backlog');
          const data = await response.json();
          console.log('Jira Backlog:', data);
        } catch (error) {
          console.error('Failed to fetch Jira backlog:', error);
        }
      };
      fetchBacklog();
    }
  }, [isJiraConnected]);

  const handleConnect = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/jira/connect');
      const data = await response.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } catch (error) {
      console.error('Failed to connect to Jira:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch('http://localhost:8000/api/jira/disconnect', { method: 'POST' });
      setIsJiraConnected(false);
    } catch (error) {
      console.error('Failed to disconnect from Jira:', error);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/analyze-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature_name: featureName,
          description: description,
          target_user: targetUser,
          business_goal: businessGoal
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImplementation = async () => {
    if (!analysis) return;

    setGenerating(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/trigger-implementation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis_id: analysis.analysis_id,
          target_repo: {
            owner: 'pnc-bank',
            repo: 'banking-platform',
            branch: 'main'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Implementation generation failed: ${response.statusText}`);
      }

      const result = await response.json();
      // Navigate to implementation results
      window.location.href = `/implementation/${result.pr_number}`;
    } catch (err) {
      console.error('Implementation generation failed:', err);
      setError(err instanceof Error ? err.message : 'Implementation generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleBackToInput = () => {
    setAnalysis(null);
    setError(null);
  };

  // If we have analysis results, show them
  if (analysis) {
    return (
      <div className="text-gray-900 dark:text-gray-100">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <GitBranch className="w-8 h-8 text-blue-600 dark:text-blue-500" />
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Viability</h1>
            </div>
            <div className="flex items-center space-x-6">
              <button
                onClick={handleBackToInput}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm">Back to Input</span>
              </button>
              <JiraButton
                isJiraConnected={isJiraConnected}
                handleConnect={handleConnect}
                handleDisconnect={handleDisconnect}
              />
            </div>
          </div>
        </header>

        {error && (
          <div className="container mx-auto px-6 pt-4">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          </div>
        )}

        <AnalysisResults
          analysis={analysis}
          onGenerateImplementation={handleGenerateImplementation}
          isGenerating={generating}
        />
      </div>
    );
  }

  // Otherwise, show the input form
  return (
    <div className="text-gray-900 dark:text-gray-100">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <GitBranch className="w-8 h-8 text-blue-600 dark:text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Viability</h1>
          </div>
          <div className="flex items-center space-x-6">
            <JiraButton
              isJiraConnected={isJiraConnected}
              handleConnect={handleConnect}
              handleDisconnect={handleDisconnect}
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 flex justify-center items-center" style={{ minHeight: 'calc(100vh - 140px)' }}>
        <div className="w-full max-w-2xl">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <form onSubmit={handleAnalyze} className="space-y-6">
              <div>
                <label htmlFor="featureName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Feature Name</label>
                <input
                  type="text"
                  id="featureName"
                  value={featureName}
                  onChange={(e) => setFeatureName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., AI-powered financial assistant"
                  required
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Describe the feature and its core functionality."
                  required
                ></textarea>
              </div>
              <div>
                <label htmlFor="targetUser" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target User</label>
                <input
                  type="text"
                  id="targetUser"
                  value={targetUser}
                  onChange={(e) => setTargetUser(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="businessGoal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Business Goal</label>
                <input
                  type="text"
                  id="businessGoal"
                  value={businessGoal}
                  onChange={(e) => setBusinessGoal(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  {loading ? 'Analyzing...' : 'Analyze'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}