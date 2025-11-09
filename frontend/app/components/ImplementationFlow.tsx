'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, AlertCircle, ExternalLink, User, BookOpen, FileCode, Clock, GitPullRequest, Users } from 'lucide-react';
import Link from 'next/link';

interface ImplementationFlowProps {
  analysisId: string;
  targetRepo: {
    owner: string;
    repo: string;
    branch: string;
  };
  onComplete?: (result: any) => void;
}

interface FlowStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
  progress?: number;
}

interface EngineerAssignment {
  name: string;
  skills: string[];
  matched_skills: string[];
  files_assigned: string[];
}

interface ImplementationResult {
  pr_url: string;
  pr_number: number;
  branch_name: string;
  files_created: string[];
  team_assignments: EngineerAssignment[];
  training_recommendations: Array<{
    skill: string;
    course: string;
    reason: string;
  }>;
  total_duration_seconds: number;
}

export const ImplementationFlow: React.FC<ImplementationFlowProps> = ({
  analysisId,
  targetRepo,
  onComplete
}) => {
  const [steps, setSteps] = useState<FlowStep[]>([
    {
      id: 'search',
      title: 'Searching Codebase',
      description: 'Using Ripgrep to find related files and patterns...',
      status: 'pending',
      progress: 0
    },
    {
      id: 'generate',
      title: 'Generating Implementation',
      description: 'Claude AI creating file structure and code...',
      status: 'pending',
      progress: 0
    },
    {
      id: 'pr',
      title: 'Creating GitHub PR',
      description: 'Scaffolding code and opening pull request...',
      status: 'pending',
      progress: 0
    },
    {
      id: 'assign',
      title: 'Assigning Team Members',
      description: 'Matching skills to engineers and training needs...',
      status: 'pending',
      progress: 0
    }
  ]);

  const [result, setResult] = useState<ImplementationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [overallStartTime] = useState(Date.now());

  useEffect(() => {
    executeFlow();
  }, []);

  const updateStep = (stepId: string, updates: Partial<FlowStep>) => {
    setSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, ...updates } : step
    ));
  };

  const executeFlow = async () => {
    try {
      // Step 1: Search
      updateStep('search', { status: 'in_progress', startTime: Date.now() });

      // Simulate search progress
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 100));
        updateStep('search', { progress: i });
      }

      // Call backend API
      const response = await fetch('/api/implementation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis_id: analysisId,
          target_repo: targetRepo
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Implementation failed');
      }

      const data = await response.json();

      // Complete search step
      updateStep('search', { status: 'completed', endTime: Date.now(), progress: 100 });

      // Step 2: Generate
      updateStep('generate', { status: 'in_progress', startTime: Date.now() });

      // Simulate generation progress
      for (let i = 0; i <= 100; i += 15) {
        await new Promise(resolve => setTimeout(resolve, 150));
        updateStep('generate', { progress: i });
      }

      updateStep('generate', { status: 'completed', endTime: Date.now(), progress: 100 });

      // Step 3: PR Creation
      updateStep('pr', { status: 'in_progress', startTime: Date.now() });

      // Simulate PR creation
      for (let i = 0; i <= 100; i += 25) {
        await new Promise(resolve => setTimeout(resolve, 100));
        updateStep('pr', { progress: i });
      }

      updateStep('pr', { status: 'completed', endTime: Date.now(), progress: 100 });

      // Step 4: Team Assignment
      updateStep('assign', { status: 'in_progress', startTime: Date.now() });

      // Simulate team matching
      for (let i = 0; i <= 100; i += 33) {
        await new Promise(resolve => setTimeout(resolve, 80));
        updateStep('assign', { progress: i });
      }

      updateStep('assign', { status: 'completed', endTime: Date.now(), progress: 100 });

      // Set final result
      setResult(data);

      if (onComplete) {
        onComplete(data);
      }

    } catch (err: any) {
      console.error('Implementation flow error:', err);
      setError(err.message || 'Unknown error occurred');

      // Mark current in-progress step as failed
      setSteps(prev => prev.map(step =>
        step.status === 'in_progress' ? { ...step, status: 'failed' } : step
      ));
    }
  };

  const getTotalDuration = () => {
    return ((Date.now() - overallStartTime) / 1000).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Implementation in Progress
          </h1>
          <p className="text-gray-600">
            Repository: <span className="font-mono text-sm">{targetRepo.owner}/{targetRepo.repo}</span>
          </p>
          <p className="text-gray-600">
            Analysis ID: <span className="font-mono text-sm">{analysisId}</span>
          </p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="space-y-8">
            {steps.map((step, index) => (
              <StepIndicator key={step.id} step={step} index={index + 1} />
            ))}
          </div>

          {/* Overall Progress */}
          {!error && !result && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Elapsed: {getTotalDuration()}s
                </span>
                <span className="text-gray-500">
                  {steps.filter(s => s.status === 'completed').length} / {steps.length} steps completed
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Implementation Failed
                </h3>
                <p className="text-red-700 mb-4">{error}</p>
                <Link
                  href="/"
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="space-y-6">
            {/* Success Banner */}
            <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <h3 className="text-xl font-bold text-green-900">
                    Implementation Complete!
                  </h3>
                  <p className="text-green-700">
                    Completed in {result.total_duration_seconds}s
                  </p>
                </div>
              </div>
            </div>

            {/* PR Card */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <GitPullRequest className="w-8 h-8 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold mb-2">Pull Request Created</h3>
                    <p className="text-blue-100 mb-3">
                      PR #{result.pr_number} on branch <code className="bg-blue-700 px-2 py-1 rounded">{result.branch_name}</code>
                    </p>
                    <a
                      href={result.pr_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition"
                    >
                      View on GitHub
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Files Created */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileCode className="w-6 h-6 text-green-600" />
                Files Created ({result.files_created.length})
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
                <div className="space-y-1">
                  {result.files_created.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-gray-700">
                      <span className="text-green-600 font-bold">+</span>
                      <span>{file}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Team Assignments */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                Team Assignments ({result.team_assignments.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.team_assignments.map((engineer, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 transition">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 mb-2">{engineer.name}</h4>

                        {/* Matched Skills */}
                        <div className="mb-2">
                          <p className="text-xs text-gray-500 mb-1">Matched Skills:</p>
                          <div className="flex flex-wrap gap-1">
                            {engineer.matched_skills.map((skill, skillIdx) => (
                              <span
                                key={skillIdx}
                                className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Files Assigned */}
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Files: {engineer.files_assigned.length}
                          </p>
                          <div className="text-xs text-gray-600 font-mono">
                            {engineer.files_assigned.slice(0, 2).map((file, fileIdx) => (
                              <div key={fileIdx} className="truncate">{file}</div>
                            ))}
                            {engineer.files_assigned.length > 2 && (
                              <div className="text-gray-400">
                                +{engineer.files_assigned.length - 2} more...
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Training Recommendations */}
            {result.training_recommendations.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-orange-600" />
                  Training Recommendations
                </h3>
                <div className="space-y-3">
                  {result.training_recommendations.map((training, idx) => (
                    <div
                      key={idx}
                      className="bg-orange-50 border-l-4 border-orange-400 rounded-lg p-4"
                    >
                      <div className="flex items-start gap-3">
                        <BookOpen className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-orange-200 text-orange-800 text-xs font-semibold rounded">
                              {training.skill}
                            </span>
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {training.course}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {training.reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Link
                href="/"
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-center"
              >
                Analyze Another Feature
              </Link>
              <a
                href={result.pr_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition text-center inline-flex items-center justify-center gap-2"
              >
                View PR on GitHub
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Step Indicator Component
const StepIndicator: React.FC<{ step: FlowStep; index: number }> = ({ step, index }) => {
  const getStepIcon = () => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-8 h-8 text-red-500" />;
      case 'in_progress':
        return (
          <div className="relative">
            <Circle className="w-8 h-8 text-blue-500 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping" />
            </div>
          </div>
        );
      default:
        return <Circle className="w-8 h-8 text-gray-300" />;
    }
  };

  const getDuration = () => {
    if (step.startTime && step.endTime) {
      return ((step.endTime - step.startTime) / 1000).toFixed(1) + 's';
    }
    return '';
  };

  const getStatusColor = () => {
    switch (step.status) {
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'in_progress': return 'text-blue-600';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="flex items-start gap-4">
      {/* Step Icon */}
      <div className="flex-shrink-0">
        {getStepIcon()}
      </div>

      {/* Step Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h3 className={`text-lg font-semibold ${getStatusColor()}`}>
            {index}. {step.title}
          </h3>
          {step.status === 'completed' && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
              {getDuration()}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 mb-2">{step.description}</p>

        {/* Progress Bar */}
        {step.status === 'in_progress' && (
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-300 ease-out"
              style={{ width: `${step.progress || 0}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ImplementationFlow;
