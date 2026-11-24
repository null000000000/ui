import React, { useEffect, useMemo, useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import type { Insight } from '../types/analytics';
import {
  EmptyState,
  formatShortTimestamp,
  SegmentedTabs,
  SlideOverPanel,
  StatusText,
} from '../components/ui/Primitives';

export function InsightsPage({ initialInsightId }: { initialInsightId: string | null }) {
  const {
    state,
    updateInsightStatus,
    createRecommendationFromInsight,
    navigate,
  } = useWorkspace();

  const [domainFilter, setDomainFilter] = useState<'all' | 'Brand' | 'Engineering' | 'Cross-Domain'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(initialInsightId);

  useEffect(() => {
    if (initialInsightId) setSelectedId(initialInsightId);
  }, [initialInsightId]);

  const filteredInsights = useMemo(() => {
    if (domainFilter === 'all') return state.insights;
    return state.insights.filter((i) => i.domain === domainFilter);
  }, [state.insights, domainFilter]);

  const activeInsight: Insight | null =
    state.insights.find((i) => i.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[#64748B]">
            AI Analyst · Every insight requires traceable metric evidence and separates observation from hypothesis
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white mt-1">Insights</h1>
        </div>

        <SegmentedTabs
          ariaLabel="Filter insights by domain"
          active={domainFilter}
          onChange={setDomainFilter}
          tabs={[
            { id: 'all', label: 'All', count: state.insights.length },
            { id: 'Brand', label: 'Brand' },
            { id: 'Engineering', label: 'Engineering' },
            { id: 'Cross-Domain', label: 'Cross-Domain' },
          ]}
        />
      </div>

      {filteredInsights.length === 0 ? (
        <EmptyState
          title="No insights in this domain"
          description="Run an analysis sweep after collecting new observations."
          actionLabel="Open Analysis Runs"
          onAction={() => navigate('analysis-runs')}
        />
      ) : (
        <div className="space-y-3">
          {filteredInsights.map((ins) => (
            <button
              key={ins.id}
              type="button"
              onClick={() => setSelectedId(ins.id)}
              className="w-full text-left p-5 bg-[#121620] border border-white/[0.07] hover:border-white/[0.16] rounded-xl space-y-2.5 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2 text-[#94A3B8]">
                  <StatusText
                    label={`${ins.priority} Priority`}
                    tone={
                      ins.priority === 'High'
                        ? 'warning'
                        : ins.priority === 'Medium'
                        ? 'accent'
                        : 'neutral'
                    }
                  />
                  <span aria-hidden="true">·</span>
                  <span>{ins.domain}</span>
                  <span aria-hidden="true">·</span>
                  <span>Confidence: {ins.confidence}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{ins.evidence.length} evidence rows</span>
                </div>
                <StatusText
                  label={ins.status}
                  tone={
                    ins.status === 'Actioned'
                      ? 'positive'
                      : ins.status === 'New'
                      ? 'accent'
                      : 'neutral'
                  }
                />
              </div>

              <h2 className="text-base font-semibold text-white">{ins.title}</h2>
              <p className="text-xs text-[#CBD5E1] leading-relaxed">{ins.observation}</p>
              <div className="pt-2 flex items-center justify-between text-xs text-[#64748B]">
                <span>Metrics: {ins.relatedMetrics.join(' · ')}</span>
                <span className="text-[#60A5FA]">Inspect evidence →</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Insight Detail Slide-over Panel (Spec 7.1) */}
      <SlideOverPanel
        open={Boolean(activeInsight)}
        onClose={() => setSelectedId(null)}
        title={activeInsight?.title ?? ''}
        subtitle={
          activeInsight
            ? `${activeInsight.domain} · Priority: ${activeInsight.priority} · Confidence: ${activeInsight.confidence} · ${formatShortTimestamp(
                activeInsight.createdAt
              )}`
            : undefined
        }
        footer={
          activeInsight ? (
            <div className="w-full flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateInsightStatus(activeInsight.id, 'Reviewed')}
                  className="px-3 py-1.5 text-xs text-[#CBD5E1] bg-[#121620] border border-white/[0.08] rounded-lg hover:text-white"
                >
                  Mark Reviewed
                </button>
                <button
                  type="button"
                  onClick={() => updateInsightStatus(activeInsight.id, 'Dismissed')}
                  className="px-3 py-1.5 text-xs text-[#94A3B8] hover:text-white"
                >
                  Dismiss
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  createRecommendationFromInsight(activeInsight);
                  setSelectedId(null);
                  navigate('recommendations');
                }}
                className="px-4 py-1.5 text-xs font-medium text-white bg-[#3B82F6] hover:bg-[#2563EB] rounded-lg"
              >
                Create Experiment
              </button>
            </div>
          ) : undefined
        }
      >
        {activeInsight && (
          <div className="space-y-6 text-xs">
            <div className="space-y-1.5">
              <h3 className="font-semibold text-[#EDF1F7]">What Happened (Computed Observation)</h3>
              <p className="text-sm text-[#CBD5E1] leading-relaxed">{activeInsight.observation}</p>
            </div>

            <div className="space-y-1.5">
              <h3 className="font-semibold text-[#EDF1F7]">
                Why It May Have Happened (Hypothesis — Not Fact)
              </h3>
              <p className="text-[#CBD5E1] leading-relaxed">{activeInsight.possibleExplanation}</p>
            </div>

            <div className="space-y-2.5">
              <h3 className="font-semibold text-[#EDF1F7]">Supporting Evidence</h3>
              <div className="border border-white/[0.07] rounded-lg divide-y divide-white/[0.06] bg-[#121620]">
                {activeInsight.evidence.map((ev) => (
                  <div key={ev.id} className="p-3.5 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-[#EDF1F7]">{ev.metricName}</span>
                      <span className="font-mono text-[11px] text-[#64748B]">{ev.source}</span>
                    </div>
                    <p className="text-[#94A3B8]">{ev.entityRef} · {ev.period}</p>
                    <p className="font-mono tabular-nums text-[#CBD5E1] pt-1">
                      Observed: <span className="text-white">{ev.observedValue}</span> · Baseline:{' '}
                      <span className="text-[#94A3B8]">{ev.baselineValue}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="font-semibold text-[#EDF1F7]">Related Metrics</h3>
              <p className="text-[#94A3B8]">{activeInsight.relatedMetrics.join(' · ')}</p>
            </div>

            <div className="space-y-1.5 pt-3 border-t border-white/[0.07]">
              <h3 className="font-semibold text-[#EDF1F7]">Suggested Testable Action</h3>
              <p className="text-[#CBD5E1] leading-relaxed">{activeInsight.suggestedAction}</p>
            </div>
          </div>
        )}
      </SlideOverPanel>
    </div>
  );
}
