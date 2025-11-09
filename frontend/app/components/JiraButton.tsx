'use client';

export function JiraButton({ isJiraConnected, handleConnect, handleDisconnect }: { isJiraConnected: boolean, handleConnect: () => void, handleDisconnect: () => void }) {
  return isJiraConnected ? (
    <button
      onClick={handleDisconnect}
      className="px-4 py-2 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 text-sm"
    >
      Disconnect Jira
    </button>
  ) : (
    <button
      onClick={handleConnect}
      className="px-4 py-2 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 text-sm"
    >
      Connect to Jira
    </button>
  );
}
