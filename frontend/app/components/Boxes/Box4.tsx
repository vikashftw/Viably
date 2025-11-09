'use client';

import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle, AlertCircle, TrendingUp, Clock, Zap } from 'lucide-react';
import { useAnalysisData } from '../AnalysisProvider';
import { LoadingStateCard, ErrorStateCard } from './BoxState';

interface ActivityItem {
  id: number;
  type: 'success' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
  timestampMs: number;
  icon: React.ReactNode;
}

const getRelativeTime = (timestampMs: number): string => {
  const now = Date.now();
  const diff = now - timestampMs;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export const Box4 = () => {
  const { data, loading, error, refetch } = useAnalysisData();
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (data) {
        refetch();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [data, refetch]);

  // Update timestamps every 5 seconds for live feel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <LoadingStateCard title="Activity Feed" />;
  }

  if (error) {
    return (
      <ErrorStateCard
        title="Activity Feed"
        message={error ?? 'Activity feed unavailable'}
        onRetry={refetch}
      />
    );
  }

  // Generate activity feed from analysis data
  const activities: ActivityItem[] = [];
  let activityId = 1;
  const now = Date.now();

  // Analysis completed
  if (data) {
    activities.push({
      id: activityId++,
      type: 'success',
      title: 'Analysis Completed',
      description: `Feature "${data.feature_name}" analyzed successfully`,
      timestamp: 'Just now',
      timestampMs: now - 10000, // 10 seconds ago
      icon: <CheckCircle className="w-4 h-4" />,
    });
  }

  // Engineer analysis
  if (data?.engineer_analysis) {
    const eng = data.engineer_analysis;
    activities.push({
      id: activityId++,
      type: 'info',
      title: 'Build Estimation Ready',
      description: `${eng.estimated_sprints || 0} sprints, ${eng.estimated_engineers || 0} engineers, $${eng.estimated_cost_usd ? (eng.estimated_cost_usd / 1000).toFixed(0) : '0'}K cost`,
      timestamp: '2 min ago',
      timestampMs: now - 120000, // 2 minutes ago
      icon: <Zap className="w-4 h-4" />,
    });
  }

  // Competitor analysis
  if (data?.competitor_analysis) {
    const comp = data.competitor_analysis;
    activities.push({
      id: activityId++,
      type: comp.competitive_risk_level === 'HIGH' ? 'warning' : 'info',
      title: 'Competitor Scan Complete',
      description: `Found ${comp.key_competitors?.length || 0} competitors - ${comp.competitive_risk_level || 'UNKNOWN'} risk`,
      timestamp: '3 min ago',
      timestampMs: now - 180000, // 3 minutes ago
      icon: <AlertCircle className="w-4 h-4" />,
    });
  }

  // ROI projections
  if (data?.roi_projections?.scenarios?.base_case) {
    const roi = data.roi_projections.scenarios.base_case;
    activities.push({
      id: activityId++,
      type: 'success',
      title: 'ROI Projection Generated',
      description: `${roi.roi_percent?.toFixed(0) || '0'}% ROI, ${roi.payback_period_months?.toFixed(1) || '0'} month payback`,
      timestamp: '4 min ago',
      timestampMs: now - 240000, // 4 minutes ago
      icon: <TrendingUp className="w-4 h-4" />,
    });
  }

  // Market intelligence
  if (data?.market_intelligence?.market_size_usd) {
    const market = data.market_intelligence;
    const tamValue = market.market_size_usd ? (market.market_size_usd / 1_000_000_000).toFixed(1) : '0';
    const cagrValue = market.growth_rate_cagr ? (market.growth_rate_cagr * 100).toFixed(1) : '0';
    activities.push({
      id: activityId++,
      type: 'info',
      title: 'Market Data Retrieved',
      description: `$${tamValue}B TAM, ${cagrValue}% CAGR`,
      timestamp: '5 min ago',
      timestampMs: now - 300000, // 5 minutes ago
      icon: <Activity className="w-4 h-4" />,
    });
  }

  // Recommendation
  if (data?.overall_recommendation?.decision) {
    const rec = data.overall_recommendation;
    activities.push({
      id: activityId++,
      type: rec.decision === 'proceed' ? 'success' : 'warning',
      title: 'Strategic Recommendation',
      description: `Decision: ${rec.decision?.toUpperCase() || 'PENDING'} with ${rec.confidence ? (rec.confidence * 100).toFixed(0) : '0'}% confidence`,
      timestamp: '6 min ago',
      timestampMs: now - 360000, // 6 minutes ago
      icon: <CheckCircle className="w-4 h-4" />,
    });
  }

  const typeStyles = {
    success: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-300',
      iconBg: 'bg-emerald-500/20',
    },
    warning: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-300',
      iconBg: 'bg-amber-500/20',
    },
    info: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-300',
      iconBg: 'bg-blue-500/20',
    },
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 h-full shadow-lg text-white flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-300" />
          Activity Feed
        </h2>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-600 to-blue-500 border border-blue-400/50 shadow-lg shadow-blue-500/20 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
          Live
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-3">
          {activities.map((activity) => {
            const styles = typeStyles[activity.type];
            return (
              <div
                key={activity.id}
                className={`${styles.bg} border ${styles.border} rounded-lg p-3 hover:bg-opacity-80 transition-all`}
              >
                <div className="flex items-start gap-3">
                  <div className={`${styles.iconBg} p-2 rounded-lg ${styles.text}`}>
                    {activity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`text-sm font-semibold ${styles.text}`}>
                        {activity.title}
                      </h3>
                      <span className="text-xs text-slate-500 flex items-center gap-1 flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {getRelativeTime(activity.timestampMs)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {activity.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {activities.length === 0 && (
            <div className="flex items-center justify-center h-40 bg-slate-800/50 rounded-lg border border-dashed border-slate-600">
              <p className="text-slate-400 text-sm">No recent activity</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-700 text-xs text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Auto-refresh every 30s
        </span>
        <span className="text-blue-400 font-semibold">
          {activities.length} events
        </span>
      </div>
    </div>
  );
};
