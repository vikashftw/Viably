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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
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

      <main className="container mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              Analyze Product Feature
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Enter your feature details to get AI-powered analysis including cost estimation, competitive intelligence, and strategic recommendations.
            </p>
          </div>

          <form onSubmit={handleAnalyze} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Feature Name *
              </label>
              <input
                type="text"
                value={featureName}
                onChange={(e) => setFeatureName(e.target.value)}
                required
                placeholder="e.g., Smart Branch Connect"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Feature Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                placeholder="Describe the feature in detail..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Target User
                </label>
                <input
                  type="text"
                  value={targetUser}
                  onChange={(e) => setTargetUser(e.target.value)}
                  placeholder="PNC customers"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Business Goal
                </label>
                <input
                  type="text"
                  value={businessGoal}
                  onChange={(e) => setBusinessGoal(e.target.value)}
                  placeholder="increase engagement and revenue"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`w-full md:w-auto px-8 py-4 rounded-lg font-semibold text-white text-lg shadow-lg transition-all ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105'
                }`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Analyzing Feature...
                  </span>
                ) : (
                  'Analyze Feature'
                )}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Simulation Scenarios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">BNPL Feature</h4>
                  <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full dark:bg-green-900 dark:text-green-300">Active</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">"Buy Now, Pay Later" option for checkout.</p>
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>4.8</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>1.2k Views</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">AI Assistant</h4>
                  <span className="text-xs font-medium bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full dark:bg-yellow-900 dark:text-yellow-300">Pending</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">In-app AI helper for customer support.</p>
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-gray-400" />
                    <span>N/A</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>560 Views</span>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-dashed border-gray-400 dark:border-gray-600 text-center flex flex-col justify-center items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                <Plus className="w-8 h-8 text-gray-400 mb-2"/>
                <h4 className="font-semibold text-gray-600 dark:text-gray-400">New Scenario</h4>
                <p className="text-gray-400 text-sm">Create a new simulation</p>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Example PNC Scenarios
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => {
                  setFeatureName('Smart Branch Connect');
                  setDescription('Hybrid banking experience connecting digital and in-branch services');
                  setTargetUser('PNC customers visiting branches');
                  setBusinessGoal('maximize ROI on $2B branch expansion');
                }}
                className="text-left bg-blue-50 dark:bg-blue-900 p-4 rounded-lg border border-blue-200 dark:border-blue-700 hover:shadow-md transition"
              >
                <h4 className="font-semibold text-blue-800 dark:text-blue-200">Smart Branch Connect</h4>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">Hybrid banking experience</p>
              </button>

              <button
                onClick={() => {
                  setFeatureName('AI Treasury Forecasting');
                  setDescription('Real-time cash flow forecasting for corporate clients using AI');
                  setTargetUser('PNC corporate banking clients');
                  setBusinessGoal('enhance PINACLE Connect platform');
                }}
                className="text-left bg-purple-50 dark:bg-purple-900 p-4 rounded-lg border border-purple-200 dark:border-purple-700 hover:shadow-md transition"
              >
                <h4 className="font-semibold text-purple-800 dark:text-purple-200">AI Treasury Forecasting</h4>
                <p className="text-xs text-purple-600 dark:text-purple-300 mt-1">Corporate banking AI</p>
              </button>

              <button
                onClick={() => {
                  setFeatureName('Gig Economy Banking Hub');
                  setDescription('Dedicated mobile banking for gig workers with instant deposits');
                  setTargetUser('Gig workers using PNC');
                  setBusinessGoal('expand market share in gig economy segment');
                }}
                className="text-left bg-green-50 dark:bg-green-900 p-4 rounded-lg border border-green-200 dark:border-green-700 hover:shadow-md transition"
              >
                <h4 className="font-semibold text-green-800 dark:text-green-200">Gig Economy Banking</h4>
                <p className="text-xs text-green-600 dark:text-green-300 mt-1">Mobile banking for gig workers</p>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}