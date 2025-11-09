'use client';

import React from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

export const LoadingStateCard = ({ title }: { title: string }) => (
  <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 h-full flex flex-col items-center justify-center text-center">
    <RefreshCcw className="w-6 h-6 text-slate-400 animate-spin" />
    <p className="mt-3 text-sm text-slate-400">Loading {title}...</p>
  </div>
);

export const ErrorStateCard = ({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}) => (
  <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 h-full flex flex-col items-center justify-center text-center space-y-3">
    <AlertCircle className="w-6 h-6 text-amber-400" />
    <div>
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="text-xs text-slate-400 mt-1">{message}</p>
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-3 py-1 text-xs font-semibold text-white bg-slate-700 rounded-md hover:bg-slate-600"
      >
        Retry
      </button>
    )}
  </div>
);
