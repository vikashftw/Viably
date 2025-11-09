"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

// Singleton EventSource manager - shared across all components
let globalEventSource: EventSource | null = null;
let subscribers: Set<(event: any) => void> = new Set();
let isAnalysisRunning = false;

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export interface AnalysisEvent {
  type: 'start' | 'agent_start' | 'agent_complete' | 'wave_complete' | 'complete' | 'error' | 'session_joined';
  agent?: string;
  wave?: number;
  result?: any;
  session_id?: string;
  feature_name?: string;
  message?: string;
  timestamp: number;
  analysis?: any;
  total_duration_ms?: number;
  wave_timings?: {
    wave1_ms: number;
    wave2_ms: number;
    wave3_ms: number;
  };
}

export function useSharedAnalysis() {
  const [events, setEvents] = useState<AnalysisEvent[]>([]);
  const [latestEvent, setLatestEvent] = useState<AnalysisEvent | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscriberRef = useRef<((event: any) => void) | null>(null);

  useEffect(() => {
    // Subscribe this component to global event stream
    const handler = (event: AnalysisEvent) => {
      setEvents(prev => [...prev, event]);
      setLatestEvent(event);

      // Update running state
      if (event.type === 'start') {
        setIsRunning(true);
        setError(null);
      } else if (event.type === 'complete') {
        setIsRunning(false);
      } else if (event.type === 'error') {
        setIsRunning(false);
        setError(event.message || 'Unknown error');
      }
    };

    subscribers.add(handler);
    subscriberRef.current = handler;

    // Sync initial state
    setIsRunning(isAnalysisRunning);

    return () => {
      if (subscriberRef.current) {
        subscribers.delete(subscriberRef.current);
      }
    };
  }, []);

  const startAnalysis = useCallback((feature: string, description: string) => {
    // Close existing connection if any
    if (globalEventSource) {
      globalEventSource.close();
      globalEventSource = null;
    }

    // Clear previous events
    setEvents([]);
    setLatestEvent(null);
    setError(null);
    isAnalysisRunning = true;
    setIsRunning(true);

    // Create SSE connection
    const params = new URLSearchParams({
      feature_name: feature,
      description: description,
      industry: 'banking'
    });

    const url = `${BACKEND_URL}/api/analyze-stream?${params.toString()}`;
    console.log(`[useSharedAnalysis] Connecting to SSE: ${url}`);

    globalEventSource = new EventSource(url);

    globalEventSource.onmessage = (event) => {
      try {
        const data: AnalysisEvent = JSON.parse(event.data);
        console.log(`[useSharedAnalysis] Received event:`, data.type, data.agent);

        // Broadcast to ALL subscribers (all components using this hook)
        subscribers.forEach(handler => handler(data));

        // Handle completion
        if (data.type === 'complete') {
          console.log('[useSharedAnalysis] Analysis complete');
          isAnalysisRunning = false;

          // Keep connection open for a moment to ensure all clients receive completion
          setTimeout(() => {
            if (globalEventSource) {
              globalEventSource.close();
              globalEventSource = null;
            }
          }, 1000);
        }
      } catch (err) {
        console.error('[useSharedAnalysis] Failed to parse event:', err);
      }
    };

    globalEventSource.onerror = (err) => {
      // SSE connections close with an "error" event even on successful completion
      // Only treat it as an error if readyState is not CLOSED (2)
      const target = err.target as EventSource;

      if (!target || target.readyState === EventSource.CLOSED) {
        // Normal close after completion, not an error
        console.log('[useSharedAnalysis] SSE connection closed normally');
        return;
      }

      // Real error - connection failed while CONNECTING (0) or OPEN (1)
      console.error('[useSharedAnalysis] SSE connection error (readyState:', target.readyState, ')');
      isAnalysisRunning = false;
      setIsRunning(false);
      setError('Connection error');

      if (globalEventSource) {
        globalEventSource.close();
        globalEventSource = null;
      }
    };

    globalEventSource.onopen = () => {
      console.log('[useSharedAnalysis] SSE connection opened');
    };
  }, []);

  const stopAnalysis = useCallback(() => {
    if (globalEventSource) {
      globalEventSource.close();
      globalEventSource = null;
    }
    isAnalysisRunning = false;
    setIsRunning(false);
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
    setLatestEvent(null);
    setError(null);
  }, []);

  return {
    events,
    latestEvent,
    isRunning,
    error,
    startAnalysis,
    stopAnalysis,
    clearEvents
  };
}

// Export helper to check if analysis is currently running
export function isAnalysisActive(): boolean {
  return isAnalysisRunning;
}

// Export helper to get current subscriber count
export function getSubscriberCount(): number {
  return subscribers.size;
}
