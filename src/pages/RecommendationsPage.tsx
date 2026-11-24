import React, { useMemo, useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { getNextRecommendationStatus } from '../lib/analyticsEngine';
import type { Recommendation, RecommendationStatus } from '../types/analytics';
import { SegmentedTabs, SlideOverPanel, StatusText } from '../components/ui/Primitives';

export function RecommendationsPage() {
  const { state, advanceRecommendation, navigate } = useWorkspace();
  const [statusFilter, setStatusFilter] = useState<'all' | RecommendationStatus>('all');
  const [evaluatingRec, setEvaluatingRec] = useState<Recommendation | null>(null);
  const [actualResult, setActualResult] = useState('');
  const [difference, setDifference] = useState('');
  const [conclusion, setConclusion] = useState<'Validated' | 'Inconclusive' | 'Not Met'>('Validated');
  const [evalError, setEvalError] = useState('');

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return state.recommendations;
    return state.recommendations.filter((r) => r.status === statusFilter);
  }, [state.recommendations, statusFilter]);

  const handleAdvance = (rec: Recommendation) => {
    const next = getNextRecommendationStatus(rec.status);
    if (!next) return;
    if (next === 'Evaluated') {
      setEvaluatingRec(rec);
      setActualResult(rec.actualResult ?? '');
      setDifference(rec.difference ?? '');
      setConclusion('Validated');
      setEvalError('');
      return;
    }
    advanceRecommendation(rec.id, next);
  };

  const handleSubmitEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingRec) return;
    if (!actualResult.trim()) {
      setEvalError('Record the measured actual result before finalizing evaluation.');
      return;
    }
    advanceRecommendation(evaluatingRec.id, 'Evaluated', {
      actualResult: actualResult.trim(),
      difference: difference.trim() || 'Measured against baseline',
      conclusion,
    });
    setEvaluatingRec(null);
  };

  const actionLabelForStatus: Record<RecommendationStatus, string | null> = {
    Proposed: 'Accept Experiment',
    Accepted: 'Start Running',
    Running: 'Record Evaluation',
    Evaluated: null,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[#64748B]">
            AI Advisor · Lifecycle: Proposed → Accepted → Running → Evaluated (never treated as fact until measured)
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white mt-1">
            Recommendations
          </h1>
        </div>

        <SegmentedTabs
          ariaLabel="Filter recommendations by lifecycle stage"
          active={statusFilter}
          onChange={setStatusFilter}
          tabs={[
            { id: 'all', label: 'All', count: state.recommendations.length },
            { id: 'Proposed', label: 'Proposed' },
            { id: 'Accepted', label: 'Accepted' },
            { id: 'Running', label: 'Running' },
            { id: 'Evaluated', label: 'Evaluated' },
          ]}
        />
      </div>

      <div className="space-y-3">
        {filtered.map((rec) => {
          const nextActionLabel = actionLabelForStatus[rec.status];
          return (
            <div
              key={rec.id}
              className="p-5 bg-[#121620] border border-white/[0.07] rounded-xl space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-[#94A3B8]">
                  <StatusText
                    label={rec.status}
                    tone={
                      rec.status === 'Evaluated'
                        ? 'positive'
                        : rec.status === 'Running'
                        ? 'accent'
                        : rec.status === 'Accepted'
                        ? 'warning'
                        : 'neutral'
                    }
                  />
                  <span aria-hidden="true">·</span>
                  <span>{rec.domain}</span>
                  <span aria-hidden="true">·</span>
                  <span>Window: {rec.measurementPeriod}</span>
                </div>
                <span className="font-mono text-[#64748B] tabular-nums">{rec.createdAt}</span>
              </div>

              <h2 className="text-base font-semibold text-white">{rec.title}</h2>
              <p className="text-xs text-[#CBD5E1] leading-relaxed">{rec.expectedOutcome}</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/[0.06] text-xs">
                <div>
                  <span className="text-[#64748B]">Success Metric:</span>{' '}
                  <span className="text-[#EDF1F7]">{rec.successMetric}</span>
                </div>
                <div className="font-mono tabular-nums">
                  <span className="text-[#64748B]">Baseline:</span>{' '}
                  <span className="text-[#CBD5E1]">{rec.baselineValue}</span>
                </div>
                <div className="font-mono tabular-nums">
                  <span className="text-[#64748B]">Target:</span>{' '}
                  <span className="text-[#EDF1F7]">{rec.targetValue}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                {rec.status === 'Evaluated' ? (
                  <button
                    type="button"
                    onClick={() => navigate('verification')}
                    className="text-xs font-medium text-[#34D399] hover:underline"
                  >
                    Evaluated ({rec.conclusion}) — View in Verification →
                  </button>
                ) : (
                  <span className="text-xs text-[#64748B]">
                    {rec.actualResult ? `Interim: ${rec.actualResult}` : 'Awaiting lifecycle transition'}
                  </span>
                )}

                {nextActionLabel && (
                  <button
                    type="button"
                    onClick={() => handleAdvance(rec)}
                    className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#3B82F6] hover:bg-[#2563EB] rounded-lg transition-colors whitespace-nowrap"
                  >
                    {nextActionLabel}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Evaluation Drawer when moving Running -> Evaluated */}
      <SlideOverPanel
        open={Boolean(evaluatingRec)}
        onClose={() => setEvaluatingRec(null)}
        title="Evaluate Experiment Outcome"
        subtitle={evaluatingRec?.title}
      >
        <form onSubmit={handleSubmitEvaluation} className="space-y-4">
          <div className="p-3.5 bg-[#121620] border border-white/[0.07] rounded-lg text-xs space-y-1">
            <p className="text-[#94A3B8]">
              Baseline: <span className="font-mono text-[#EDF1F7]">{evaluatingRec?.baselineValue}</span>
            </p>
            <p className="text-[#94A3B8]">
              Target: <span className="font-mono text-[#EDF1F7]">{evaluatingRec?.targetValue}</span>
            </p>
          </div>
          <div>
            <label htmlFor="ev-actual" className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
              Measured Actual Result
            </label>
            <input
              id="ev-actual"
              type="text"
              value={actualResult}
              onChange={(e) => {
                setActualResult(e.target.value);
                setEvalError('');
              }}
              placeholder="e.g., 16,420 avg impressions"
              className="w-full px-3.5 py-2 text-sm bg-[#121620] border border-white/[0.1] rounded-lg text-white"
            />
          </div>
          <div>
            <label htmlFor="ev-diff" className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
              Difference vs Baseline
            </label>
            <input
              id="ev-diff"
              type="text"
              value={difference}
              onChange={(e) => setDifference(e.target.value)}
              placeholder="e.g., +39.0% vs baseline"
              className="w-full px-3.5 py-2 text-sm bg-[#121620] border border-white/[0.1] rounded-lg text-white"
            />
          </div>
          <div>
            <label htmlFor="ev-conclusion" className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
              Conclusion
            </label>
            <select
              id="ev-conclusion"
              value={conclusion}
              onChange={(e) =>
                setConclusion(e.target.value as 'Validated' | 'Inconclusive' | 'Not Met')
              }
              className="w-full px-3 py-2 text-sm bg-[#121620] border border-white/[0.1] rounded-lg text-white"
            >
              <option value="Validated">Validated</option>
              <option value="Inconclusive">Inconclusive</option>
              <option value="Not Met">Not Met</option>
            </select>
          </div>
          {evalError && <p className="text-xs text-[#F87171]">{evalError}</p>}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEvaluatingRec(null)}
              className="px-4 py-2 text-xs text-[#CBD5E1] bg-[#121620] border border-white/[0.08] rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-[#3B82F6] hover:bg-[#2563EB] rounded-lg"
            >
              Save Evaluation
            </button>
          </div>
        </form>
      </SlideOverPanel>
    </div>
  );
}
