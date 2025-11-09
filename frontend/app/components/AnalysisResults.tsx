'use client';

import React, { useState } from 'react';
import { ChevronDown, DollarSign, Users, TrendingUp, AlertCircle, Lightbulb, Code, Target, BarChart3, Award } from 'lucide-react';

// TypeScript Interfaces
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
  market_data?: {
    market_size_usd: number;
    growth_rate_cagr: number;
    source_url: string;
  };
  industry_trends?: Array<{
    trend: string;
    source: string;
  }>;
  competitor_news?: Array<{
    news: string;
    source: string;
  }>;
  regulatory?: Array<{
    regulation: string;
    source: string;
  }>;
}

interface SimilarFeature {
  name: string;
  similarity_score: number;
  cost: number;
  duration_weeks: number;
  adoption_rate: number;
  why_similar: string;
  matching_keywords: string[];
}

interface SimilarFeaturesAnalysis {
  similar_projects: SimilarFeature[];
  cost_estimate_basis: {
    calculation: string;
    adjustments: string[];
    final_estimate: number;
  };
  confidence: {
    score: number;
    reasoning: string;
    factors: string[];
  };
}

interface ROIScenario {
  roi_percent: number;
  payback_period_months: number;
  projected_revenue_18mo: number;
  assumptions: string;
}

interface ROIAnalysis {
  roi_scenarios: {
    worst_case: ROIScenario;
    base_case: ROIScenario;
    best_case: ROIScenario;
  };
  recommended_scenario: string;
  calculation_basis: string;
  explicit_assumptions: string[];
  data_sources: string[];
}

interface OverallRecommendation {
  summary: string;
  rationale: string;
  action_items: string[];
}

interface UpskillingInsights {
  bottleneck_skills: string[];
  suggested_training: string[];
}

interface AnalysisResultsProps {
  analysis: {
    analysis_id: string;
    feature_name: string;
    engineer_analysis: EngineerAnalysis;
    competitor_analysis: CompetitorAnalysis;
    market_intelligence?: MarketIntelligence;
    similar_features?: SimilarFeaturesAnalysis;
    roi_scenarios?: ROIAnalysis;
    overall_recommendation: OverallRecommendation;
    upskilling_insights: UpskillingInsights;
  };
  onGenerateImplementation: () => void;
  isGenerating?: boolean;
}

// Reusable Metric Card Component
const MetricCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  className?: string;
}> = ({ icon, label, value, subValue, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-md p-4 border border-gray-200 ${className}`}>
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <span className="text-sm text-gray-600 font-medium">{label}</span>
    </div>
    <div className="text-2xl font-bold text-gray-900">{value}</div>
    {subValue && <div className="text-sm text-gray-500 mt-1">{subValue}</div>}
  </div>
);

// Accordion Section Component
const AccordionSection: React.FC<{
  id: string;
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ id, title, icon, isExpanded, onToggle, children }) => (
  <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors"
    >
      <div className="flex items-center gap-3">
        {icon}
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <ChevronDown
        className={`w-5 h-5 text-gray-600 transition-transform ${
          isExpanded ? 'rotate-180' : ''
        }`}
      />
    </button>
    {isExpanded && (
      <div className="px-6 py-5 border-t border-gray-200">
        {children}
      </div>
    )}
  </div>
);

// Engineer Analysis Sub-Component
const EngineerAnalysisView: React.FC<{ data: EngineerAnalysis }> = ({ data }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        icon={<BarChart3 className="w-5 h-5 text-blue-600" />}
        label="Estimated Sprints"
        value={data.estimated_sprints}
        subValue={`${data.estimated_sprints * 2} weeks`}
      />
      <MetricCard
        icon={<Users className="w-5 h-5 text-green-600" />}
        label="Team Size"
        value={data.estimated_engineers}
        subValue="engineers"
      />
      <MetricCard
        icon={<DollarSign className="w-5 h-5 text-purple-600" />}
        label="Estimated Cost"
        value={`$${(data.estimated_cost_usd / 1000).toFixed(0)}K`}
        subValue={`$${data.estimated_cost_usd.toLocaleString()}`}
      />
      <MetricCard
        icon={<Target className="w-5 h-5 text-orange-600" />}
        label="Confidence"
        value={`${(data.confidence * 100).toFixed(0)}%`}
        className={data.confidence >= 0.7 ? 'border-green-300' : 'border-yellow-300'}
      />
    </div>

    <div className="mt-6">
      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-red-600" />
        Key Risks
      </h4>
      <ul className="space-y-2">
        {data.key_risks.map((risk, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
            <span className="text-red-500 mt-1">•</span>
            <span>{risk}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

// Competitor Analysis Sub-Component
const CompetitorAnalysisView: React.FC<{ data: CompetitorAnalysis }> = ({ data }) => {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'bg-green-100 text-green-800 border-green-300';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-4">
        <div className={`px-4 py-2 rounded-full border-2 font-semibold ${getRiskColor(data.competitive_risk_level)}`}>
          {data.competitive_risk_level} RISK
        </div>
        <div className="text-sm text-gray-600">
          Expected competitor response: <span className="font-semibold">{data.expected_response_time_sprints} sprints</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Key Competitors</h4>
          <div className="flex flex-wrap gap-2">
            {data.key_competitors.map((competitor, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200"
              >
                {competitor}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Likely Response Strategy</h4>
          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
            {data.response_play}
          </p>
        </div>
      </div>
    </div>
  );
};

// Market Intelligence Sub-Component
const MarketIntelligenceView: React.FC<{ data: MarketIntelligence }> = ({ data }) => (
  <div className="space-y-6">
    {data.market_data && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          icon={<TrendingUp className="w-5 h-5 text-green-600" />}
          label="Market Size"
          value={`$${(data.market_data.market_size_usd / 1000000000).toFixed(1)}B`}
          subValue="USD"
        />
        <MetricCard
          icon={<BarChart3 className="w-5 h-5 text-blue-600" />}
          label="Growth Rate (CAGR)"
          value={`${(data.market_data.growth_rate_cagr * 100).toFixed(1)}%`}
          subValue="annual growth"
        />
      </div>
    )}

    {data.industry_trends && data.industry_trends.length > 0 && (
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Industry Trends</h4>
        <ul className="space-y-2">
          {data.industry_trends.map((trend, idx) => (
            <li key={idx} className="text-sm bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-gray-800 font-medium mb-1">{trend.trend}</p>
              <a href={trend.source} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs hover:underline">
                Source: {trend.source}
              </a>
            </li>
          ))}
        </ul>
      </div>
    )}

    {data.competitor_news && data.competitor_news.length > 0 && (
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Competitor News</h4>
        <ul className="space-y-2">
          {data.competitor_news.map((news, idx) => (
            <li key={idx} className="text-sm bg-purple-50 p-3 rounded-lg border border-purple-200">
              <p className="text-gray-800 font-medium mb-1">{news.news}</p>
              <a href={news.source} target="_blank" rel="noopener noreferrer" className="text-purple-600 text-xs hover:underline">
                Source: {news.source}
              </a>
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

// Similar Features Sub-Component
const SimilarFeaturesView: React.FC<{ data: SimilarFeaturesAnalysis }> = ({ data }) => (
  <div className="space-y-6">
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Cost Estimation Methodology</h4>
      <p className="text-sm text-gray-700 mb-2">{data.cost_estimate_basis.calculation}</p>
      <div className="space-y-1">
        {data.cost_estimate_basis.adjustments.map((adj, idx) => (
          <p key={idx} className="text-xs text-gray-600">• {adj}</p>
        ))}
      </div>
      <p className="text-sm font-semibold text-gray-900 mt-2">
        Final Estimate: ${data.cost_estimate_basis.final_estimate.toLocaleString()}
      </p>
    </div>

    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-3">Similar PNC Projects</h4>
      <div className="space-y-3">
        {data.similar_projects.map((project, idx) => (
          <div key={idx} className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-semibold text-gray-900">{project.name}</h5>
              <span className="text-sm font-medium text-blue-600">
                {(project.similarity_score * 100).toFixed(0)}% match
              </span>
            </div>
            <p className="text-sm text-gray-700 mb-2">{project.why_similar}</p>
            <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
              <div>Cost: ${(project.cost / 1000).toFixed(0)}K</div>
              <div>Duration: {project.duration_weeks}w</div>
              <div>Adoption: {(project.adoption_rate * 100).toFixed(0)}%</div>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {project.matching_keywords.map((keyword, kidx) => (
                <span key={kidx} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Confidence Assessment</h4>
      <p className="text-sm text-gray-700 mb-2">{data.confidence.reasoning}</p>
      <div className="space-y-1">
        {data.confidence.factors.map((factor, idx) => (
          <p key={idx} className="text-xs text-gray-600">• {factor}</p>
        ))}
      </div>
      <p className="text-sm font-semibold text-gray-900 mt-2">
        Confidence Score: {(data.confidence.score * 100).toFixed(0)}%
      </p>
    </div>
  </div>
);

// ROI Analysis Sub-Component
const ROIAnalysisView: React.FC<{ data: ROIAnalysis }> = ({ data }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Worst Case */}
      <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
        <h4 className="text-sm font-semibold text-red-800 mb-3">Worst Case</h4>
        <div className="space-y-2">
          <div>
            <p className="text-xs text-gray-600">ROI</p>
            <p className="text-2xl font-bold text-red-800">{data.roi_scenarios.worst_case.roi_percent}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Payback Period</p>
            <p className="text-lg font-semibold text-red-700">{data.roi_scenarios.worst_case.payback_period_months} months</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Revenue (18mo)</p>
            <p className="text-sm font-medium text-red-700">${(data.roi_scenarios.worst_case.projected_revenue_18mo / 1000000).toFixed(2)}M</p>
          </div>
          <p className="text-xs text-gray-600 mt-2">{data.roi_scenarios.worst_case.assumptions}</p>
        </div>
      </div>

      {/* Base Case */}
      <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-blue-800">Base Case</h4>
          <Award className="w-5 h-5 text-blue-600" />
        </div>
        <div className="space-y-2">
          <div>
            <p className="text-xs text-gray-600">ROI</p>
            <p className="text-3xl font-bold text-blue-800">{data.roi_scenarios.base_case.roi_percent}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Payback Period</p>
            <p className="text-lg font-semibold text-blue-700">{data.roi_scenarios.base_case.payback_period_months} months</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Revenue (18mo)</p>
            <p className="text-sm font-medium text-blue-700">${(data.roi_scenarios.base_case.projected_revenue_18mo / 1000000).toFixed(2)}M</p>
          </div>
          <p className="text-xs text-gray-600 mt-2">{data.roi_scenarios.base_case.assumptions}</p>
        </div>
      </div>

      {/* Best Case */}
      <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
        <h4 className="text-sm font-semibold text-green-800 mb-3">Best Case</h4>
        <div className="space-y-2">
          <div>
            <p className="text-xs text-gray-600">ROI</p>
            <p className="text-2xl font-bold text-green-800">{data.roi_scenarios.best_case.roi_percent}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Payback Period</p>
            <p className="text-lg font-semibold text-green-700">{data.roi_scenarios.best_case.payback_period_months} months</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Revenue (18mo)</p>
            <p className="text-sm font-medium text-green-700">${(data.roi_scenarios.best_case.projected_revenue_18mo / 1000000).toFixed(2)}M</p>
          </div>
          <p className="text-xs text-gray-600 mt-2">{data.roi_scenarios.best_case.assumptions}</p>
        </div>
      </div>
    </div>

    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Calculation Basis</h4>
      <p className="text-sm text-gray-700 mb-3">{data.calculation_basis}</p>

      <h5 className="text-xs font-semibold text-gray-600 mb-2">Explicit Assumptions:</h5>
      <ul className="space-y-1 mb-3">
        {data.explicit_assumptions.map((assumption, idx) => (
          <li key={idx} className="text-xs text-gray-600">• {assumption}</li>
        ))}
      </ul>

      <h5 className="text-xs font-semibold text-gray-600 mb-2">Data Sources:</h5>
      <ul className="space-y-1">
        {data.data_sources.map((source, idx) => (
          <li key={idx} className="text-xs text-gray-600">• {source}</li>
        ))}
      </ul>
    </div>
  </div>
);

// Recommendation Sub-Component
const RecommendationView: React.FC<{ data: OverallRecommendation }> = ({ data }) => {
  const getRecommendationColor = (summary: string) => {
    if (summary.includes('PROCEED')) return 'bg-green-100 text-green-800 border-green-300';
    if (summary.includes('DEFER')) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (summary.includes('REJECT')) return 'bg-red-100 text-red-800 border-red-300';
    return 'bg-blue-100 text-blue-800 border-blue-300';
  };

  return (
    <div className="space-y-4">
      <div className={`px-6 py-4 rounded-lg border-2 font-semibold text-lg ${getRecommendationColor(data.summary)}`}>
        {data.summary}
      </div>

      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Rationale</h4>
        <p className="text-sm text-gray-700">{data.rationale}</p>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Action Items</h4>
        <ul className="space-y-2">
          {data.action_items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
              <input type="checkbox" className="mt-1" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// Upskilling Sub-Component
const UpskillingView: React.FC<{ data: UpskillingInsights }> = ({ data }) => (
  <div className="space-y-4">
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-3">Bottleneck Skills</h4>
      <div className="flex flex-wrap gap-2">
        {data.bottleneck_skills.map((skill, idx) => (
          <span
            key={idx}
            className="px-3 py-2 bg-orange-100 text-orange-800 rounded-lg text-sm font-medium border border-orange-300"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>

    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-3">Suggested Training</h4>
      <ul className="space-y-2">
        {data.suggested_training.map((training, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm bg-purple-50 p-3 rounded-lg border border-purple-200">
            <Lightbulb className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">{training}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

// Main Component
export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  analysis,
  onGenerateImplementation,
  isGenerating = false
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['engineer', 'recommendation'])
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{analysis.feature_name}</h1>
        <p className="text-sm text-gray-500">Analysis ID: {analysis.analysis_id}</p>
      </div>

      {/* Generate Implementation Button */}
      <div className="mb-8">
        <button
          onClick={onGenerateImplementation}
          disabled={isGenerating}
          className={`w-full md:w-auto px-8 py-4 rounded-lg font-semibold text-white text-lg shadow-lg transition-all ${
            isGenerating
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105'
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <Code className="w-5 h-5 animate-spin" />
              Generating Implementation...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Generate Implementation Plan
            </span>
          )}
        </button>
      </div>

      {/* Accordion Sections */}
      <div className="space-y-4">
        {/* Engineer Analysis */}
        <AccordionSection
          id="engineer"
          title="Engineer Analysis"
          icon={<Code className="w-6 h-6 text-blue-600" />}
          isExpanded={expandedSections.has('engineer')}
          onToggle={() => toggleSection('engineer')}
        >
          <EngineerAnalysisView data={analysis.engineer_analysis} />
        </AccordionSection>

        {/* Competitor Analysis */}
        <AccordionSection
          id="competitor"
          title="Competitor Analysis"
          icon={<Target className="w-6 h-6 text-purple-600" />}
          isExpanded={expandedSections.has('competitor')}
          onToggle={() => toggleSection('competitor')}
        >
          <CompetitorAnalysisView data={analysis.competitor_analysis} />
        </AccordionSection>

        {/* Market Intelligence (Optional) */}
        {analysis.market_intelligence && (
          <AccordionSection
            id="market"
            title="Market Intelligence"
            icon={<TrendingUp className="w-6 h-6 text-green-600" />}
            isExpanded={expandedSections.has('market')}
            onToggle={() => toggleSection('market')}
          >
            <MarketIntelligenceView data={analysis.market_intelligence} />
          </AccordionSection>
        )}

        {/* Similar Features (Optional) */}
        {analysis.similar_features && (
          <AccordionSection
            id="similar"
            title="Similar Features Analysis"
            icon={<BarChart3 className="w-6 h-6 text-orange-600" />}
            isExpanded={expandedSections.has('similar')}
            onToggle={() => toggleSection('similar')}
          >
            <SimilarFeaturesView data={analysis.similar_features} />
          </AccordionSection>
        )}

        {/* ROI Scenarios (Optional) */}
        {analysis.roi_scenarios && (
          <AccordionSection
            id="roi"
            title="ROI Analysis"
            icon={<DollarSign className="w-6 h-6 text-green-600" />}
            isExpanded={expandedSections.has('roi')}
            onToggle={() => toggleSection('roi')}
          >
            <ROIAnalysisView data={analysis.roi_scenarios} />
          </AccordionSection>
        )}

        {/* Overall Recommendation */}
        <AccordionSection
          id="recommendation"
          title="Overall Recommendation"
          icon={<Award className="w-6 h-6 text-indigo-600" />}
          isExpanded={expandedSections.has('recommendation')}
          onToggle={() => toggleSection('recommendation')}
        >
          <RecommendationView data={analysis.overall_recommendation} />
        </AccordionSection>

        {/* Upskilling Insights */}
        <AccordionSection
          id="upskilling"
          title="Upskilling Insights"
          icon={<Lightbulb className="w-6 h-6 text-yellow-600" />}
          isExpanded={expandedSections.has('upskilling')}
          onToggle={() => toggleSection('upskilling')}
        >
          <UpskillingView data={analysis.upskilling_insights} />
        </AccordionSection>
      </div>
    </div>
  );
};
