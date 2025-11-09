'use client';

import { useState, useEffect } from 'react';
import { Plus, Bell, User, GitBranch, Star, Eye, Scale, CheckCircle, XCircle, Link, Zap, ZapOff } from 'lucide-react';

export default function Dashboard() {
  const [isJiraConnected, setIsJiraConnected] = useState(false);

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

  const handleDisconnect = async () => {
    try {
      await fetch('http://localhost:8000/api/jira/disconnect', { method: 'POST' });
      setIsJiraConnected(false);
    } catch (error) {
      console.error('Failed to disconnect from Jira:', error);
    }
  };

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
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Jira Integration</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {isJiraConnected
                  ? 'Your Jira account is connected.'
                  : 'Connect your Jira account to simulate feature viability.'}
              </p>
            </div>
            {isJiraConnected ? (
              <button
                onClick={handleDisconnect}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg flex items-center space-x-2 transition duration-300"
              >
                <ZapOff className="w-5 h-5" />
                <span>Disconnect from Jira</span>
              </button>
            ) : (
              <a
                href="http://localhost:8000/api/jira/connect"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg flex items-center space-x-2 transition duration-300"
              >
                <Zap className="w-5 h-5" />
                <span>Connect to Jira</span>
              </a>
            )}
          </div>
          
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

          <div className="mt-10">
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Viability Report</h3>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-bold text-lg text-gray-800 dark:text-gray-200">BNPL Feature Analysis</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Report generated on Nov 8, 2025</p>
                    </div>
                    <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full dark:bg-blue-900 dark:text-blue-300">Official</span>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Estimated Cost</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-200 mt-1">$120K</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Predicted Sentiment</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-500 mt-1">+35%</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Adoption Score</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-200 mt-1">7.2/10</p>
                    </div>
                </div>

                <div className="mt-6">
                    <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Key Insights</h5>
                    <ul className="space-y-3 text-sm">
                        <li className="flex items-start space-x-3">
                            <Scale className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5"/>
                            <span className="text-gray-700 dark:text-gray-300"><span className="font-semibold">Competitor Risk:</span> High risk of competitor match within 2 sprints, nullifying market advantage.</span>
                        </li>
                        <li className="flex items-start space-x-3">
                            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5"/>
                            <span className="text-gray-700 dark:text-gray-300"><span className="font-semibold">Positive:</span> Strong adoption predicted among student and low-income demographics.</span>
                        </li>
                        <li className="flex items-start space-x-3">
                            <XCircle className="w-5 h-5 text-red-500 mt-0.5"/>
                            <span className="text-gray-700 dark:text-gray-300"><span className="font-semibold">Negative:</span> Potential brand dilution for high-income users who perceive BNPL as "cheap".</span>
                        </li>
                    </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h5 className="font-semibold text-gray-700 dark:text-gray-300">Recommendation</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Proceed with the BNPL feature, but bundle it with a new loyalty program to retain high-value customers and mitigate brand dilution concerns. Monitor competitor response closely post-launch.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}