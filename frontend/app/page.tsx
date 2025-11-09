'use client';

import { useState, useEffect } from 'react';
import { GitBranch, Sparkles } from 'lucide-react';
import { JiraButton } from './components/JiraButton';
import { BentoGrid } from './components/BentoGrid';
import { AnalysisProvider } from './components/AnalysisProvider';
import type { BacklogItem } from './components/Boxes/Box3';

export default function Dashboard() {
  const [isJiraConnected, setIsJiraConnected] = useState(false);
  const [backlog, setBacklog] = useState<BacklogItem[]>([]);
  const [isMockData, setIsMockData] = useState(false);

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
    // Only fetch real Jira data if connected and NOT using mock data
    if (isJiraConnected && !isMockData) {
      const fetchBacklog = async () => {
        try {
          const response = await fetch('http://localhost:8000/api/jira/backlog');
          const data = await response.json();
          console.log('Jira Backlog:', data);
          setBacklog((data.issues as BacklogItem[]) || []);
        } catch (error) {
          console.error('Failed to fetch Jira backlog:', error);
        }
      };
      fetchBacklog();
    }
  }, [isJiraConnected, isMockData]);

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
      setBacklog([]);
      setIsMockData(false);
    } catch (error) {
      console.error('Failed to disconnect from Jira:', error);
    }
  };

  const loadMockData = () => {
    // Mock Jira backlog items
    const mockBacklog: BacklogItem[] = [
      { id: 'VIA-101', summary: 'Implement user authentication system', status: 'In Progress' },
      { id: 'VIA-102', summary: 'Design dashboard layout for analytics', status: 'To Do' },
      { id: 'VIA-103', summary: 'Create API endpoints for data sync', status: 'To Do' },
      { id: 'VIA-104', summary: 'Setup CI/CD pipeline for deployments', status: 'In Progress' },
      { id: 'VIA-105', summary: 'Write unit tests for core modules', status: 'To Do' },
      { id: 'VIA-106', summary: 'Optimize database queries for performance', status: 'To Do' },
      { id: 'VIA-107', summary: 'Implement error logging and monitoring', status: 'In Progress' },
      { id: 'VIA-108', summary: 'Add data validation on frontend forms', status: 'To Do' },
    ];
    setBacklog(mockBacklog);
    setIsMockData(true); // Flag that we're using mock data
    setIsJiraConnected(true); // Show as "connected" for UI purposes
  };

  return (
    <div className="flex flex-col h-screen text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <GitBranch className="w-8 h-8 text-blue-600 dark:text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Viably</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={loadMockData}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold text-sm transition-all shadow-lg hover:shadow-xl"
            >
              <Sparkles className="w-4 h-4" />
              Load Test Data
            </button>
            <JiraButton
              isJiraConnected={isJiraConnected}
              handleConnect={handleConnect}
              handleDisconnect={handleDisconnect}
            />
          </div>
        </div>
      </header>

      <main className="flex-grow p-6">
        <AnalysisProvider>
          <BentoGrid backlog={backlog} />
        </AnalysisProvider>
      </main>
    </div>
  );
}
