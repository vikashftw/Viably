'use client';

import { useState, useEffect } from 'react';
import { Plus, Bell, User, GitBranch, Star, Eye, Scale, CheckCircle, XCircle, Link, Zap, ZapOff, ArrowLeft } from 'lucide-react';
import { AnalysisResults } from './components/AnalysisResults';

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
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Product Sandbox</h1>
            </div>
            <div className="flex items-center space-x-6">
              <button
                onClick={handleBackToInput}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm">Back to Input</span>
              </button>
              <button className="relative text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
                <Bell className="w-6 h-6" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
                <User className="w-6 h-6" />
              </button>
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
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Product Sandbox</h1>
          </div>
          <div className="flex items-center space-x-6">
            <button className="relative text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
              <Bell className="w-6 h-6" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
              <User className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 flex justify-center items-center" style={{ minHeight: 'calc(100vh - 140px)' }}>
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 text-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
              Jira Integration
            </h2>
            {isJiraConnected ? (
              <div>
                <p className="text-green-500 mb-4">Jira is connected.</p>
                <button
                  onClick={handleDisconnect}
                  className="px-6 py-3 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700"
                >
                  Disconnect from Jira
                </button>
              </div>
            ) : (
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Connect to your Jira account to get started.
                </p>
                <button
                  onClick={handleConnect}
                  className="px-6 py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700"
                >
                  Connect to Jira
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}