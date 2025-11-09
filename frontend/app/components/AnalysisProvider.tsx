'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_VIABLY_BACKEND_URL ?? 'http://localhost:8000';

const DEFAULT_ANALYSIS_REQUEST = {
  feature_name: 'Smart Branch Connect',
  description:
    'Hybrid banking experience connecting digital and in-branch services',
  target_user: 'PNC retail customers',
  business_goal: 'increase branch traffic and digital engagement',
  industry: 'banking',
};

interface EngineerAnalysis {
  estimated_sprints: number;
  estimated_engineers: number;
  estimated_cost_usd: number;
  key_risks: string[];
  confidence: number;
}

interface CompetitorAnalysis {
  key_competitors: string[];
  expected_response_time_sprints: number;
  response_play: string;
  competitive_risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface MarketIntelligence {
  market_size_usd?: number;
  growth_rate_cagr?: number;
  source_url?: string;
  source_title?: string;
  note?: string;
  confidence?: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface SimilarProject {
  name: string;
  similarity_score: number;
  cost_usd: number;
  adoption_rate: number;
  outcome: string;
}

interface SimilarFeatures {
  similar_projects: SimilarProject[];
  cost_estimate_basis?: {
    most_similar_project: string;
    similarity_score: number;
  };
}

interface ROIScenario {
  scenario: 'worst_case' | 'base_case' | 'best_case';
  roi_percent: number;
  payback_period_months: number;
  projected_revenue_18mo: number;
  adoption_rate?: number;
  projected_users?: number;
  assumptions?: string;
}

interface ROIProjections {
  scenarios: {
    worst_case: ROIScenario;
    base_case: ROIScenario;
    best_case: ROIScenario;
  };
  recommended_scenario: 'worst_case' | 'base_case' | 'best_case';
  calculation_basis?: string;
}

interface OverallRecommendation {
  decision: 'proceed' | 'proceed_with_caution' | 'delay' | 'avoid';
  confidence: number;
  reasoning: string[];
  key_concerns?: string[];
  success_probability?: number;
}

export interface CompleteAnalysis {
  analysis_id: string;
  feature_name: string;
  description: string;
  target_user: string;
  business_goal: string;
  industry: string;
  engineer_analysis?: EngineerAnalysis;
  competitor_analysis?: CompetitorAnalysis;
  market_intelligence?: MarketIntelligence;
  roi_projections?: ROIProjections;
  similar_features?: SimilarFeatures;
  overall_recommendation?: OverallRecommendation;
}

interface AnalysisContextValue {
  data: CompleteAnalysis | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  triggerAnalysis: (featureName: string, description: string) => Promise<void>;
}

const AnalysisContext = createContext<AnalysisContextValue | undefined>(
  undefined,
);

export const AnalysisProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<CompleteAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerAnalysis = useCallback(async (featureName: string, description: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/api/analyze-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature_name: featureName,
          description: description,
          target_user: 'PNC customers',
          business_goal: 'increase engagement and revenue',
          industry: 'banking',
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis request failed (${response.status})`);
      }

      const json = (await response.json()) as CompleteAnalysis;
      setData(json);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to load analysis data';
      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAnalysis = useCallback(async () => {
    await triggerAnalysis(
      DEFAULT_ANALYSIS_REQUEST.feature_name,
      DEFAULT_ANALYSIS_REQUEST.description
    );
  }, [triggerAnalysis]);

  const value = useMemo(
    () => ({
      data,
      loading,
      error,
      refetch: fetchAnalysis,
      triggerAnalysis,
    }),
    [data, loading, error, fetchAnalysis, triggerAnalysis],
  );

  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  );
};

export const useAnalysisData = () => {
  const ctx = useContext(AnalysisContext);
  if (!ctx) {
    throw new Error('useAnalysisData must be used within AnalysisProvider');
  }
  return ctx;
};
