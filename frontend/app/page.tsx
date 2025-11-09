'use client';

import { useState, useEffect } from 'react';
import { GitBranch } from 'lucide-react';
import { JiraButton } from './components/JiraButton';
import { BentoGrid } from './components/BentoGrid';

export default function Dashboard() {
  const [isJiraConnected, setIsJiraConnected] = useState(false);
  const [backlog, setBacklog] = useState([]);

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
          setBacklog(data.issues || []);
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

  return (
    <div className="flex flex-col h-screen text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <GitBranch className="w-8 h-8 text-blue-600 dark:text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Viably</h1>
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

      <main className="flex-grow p-6">
        <BentoGrid backlog={backlog} />
      </main>
    </div>
  );
}