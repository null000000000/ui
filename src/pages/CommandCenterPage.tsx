import React, { useMemo, useState } from 'react';
import { ArrowRight, Clock, FolderPlus } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  calculateSystemProgress,
  formatMetricValue,
  sliceSeriesByDateRange,
} from '../lib/analyticsEngine';
import { TrendChart } from '../components/charts/Charts';
import {
  formatShortTimestamp,
  MetricTile,
  ProgressiveSection,
  SegmentedTabs,
  StatusText,
} from '../components/ui/Primitives';

export function CommandCenterPage() {
  const {
    state,
    dateRange,
    navigate,
    lastGlobalSyncAt,
    setQuickActionModal,
  } = useWorkspace();

  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false);
  const [chartFocus, setChartFocus] = useState<'youtube' | 'linkedin' | 'github'>('youtube');

  const activeSystem = state.systems.find((s) => s.status === 'Active') ?? state.systems[0];
  const systemMilestones = useMemo(
    () => state.milestones.filter((m) => m.systemId === activeSystem.id),
    [state.milestones, activeSystem.id]
  );
  const engProgress = useMemo(
    () => calculateSystemProgress(systemMilestones, state.deliverables),
    [systemMilestones, state.deliverables]
  );

  const youtube = state.platforms.find((p) => p.id === 'youtube')!;
  const linkedin = state.platforms.find((p) => p.id === 'linkedin')!;
  const primaryRepo = state.repositories[0];

  const topInsight =
    state.insights.find((i) => i.priority === 'High' && i.status !== 'Dismissed') ??
    state.insights[0] ??
    null;

  const chartConfig = useMemo(() => {
    if (chartFocus === 'youtube') {
      return {
        data: sliceSeriesByDateRange(youtube.trendSeries, dateRange),
        unit: 'count' as const,
        primaryLabel: 'YouTube Views',
        secondaryLabel: 'Retention %',
        secondaryUnit: 'percentage' as const,
        accentColor: '#3B82F6',
        sourceNote: 'Source: YouTube API · Native Views (never blended with Reach)',
      };
    }
    if (chartFocus === 'linkedin') {
      return {
        data: sliceSeriesByDateRange(linkedin.trendSeries, dateRange),
        unit: 'count' as const,
        primaryLabel: 'LinkedIn Impressions',
        secondaryLabel: undefined,
        secondaryUnit: undefined,
        accentColor: '#60A5FA',
        sourceNote: 'Source: LinkedIn API · Native Impressions',
      };
    }
    return {
      data: sliceSeriesByDateRange(primaryRepo.commitSeries, dateRange),
      unit: 'count' as const,
      primaryLabel: `${primaryRepo.name} Commits`,
      secondaryLabel: undefined,
      secondaryUnit: undefined,
      accentColor: '#34D399',
      sourceNote: 'Source: GitHub API · Commit activity (separate from Engineering Quality)',
    };
  }, [chartFocus, youtube, linkedin, primaryRepo, dateRange]);

  const dateLabelMap = {
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
    '180d': 'Last 180 days',
    all: 'All snapshots',
  };

  return (
    <div className="space-y-8">
      {/* Page Title & Contextual Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[#64748B]">
            Current overview · {dateLabelMap[dateRange]} · Synced {formatShortTimestamp(lastGlobalSyncAt)}
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white mt-1">
            Command Center
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setQuickActionModal('content')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#EDF1F7] bg-[#121620] hover:bg-[#181E2B] border border-white/[0.08] rounded-lg transition-colors whitespace-nowrap"
          >
            <FolderPlus className="w-3.5 h-3.5 text-[#94A3B8]" />
            <span>Add Content</span>
          </button>
          <button
            type="button"
            onClick={() => setQuickActionModal('activity')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#EDF1F7] bg-[#121620] hover:bg-[#181E2B] border border-white/[0.08] rounded-lg transition-colors whitespace-nowrap"
          >
            <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
            <span>Log Activity</span>
          </button>
        </div>
      </div>

      {/* Primary Two-Domain Indicators (Minimal Default) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricTile
          label="Brand Performance · YouTube Views"
          value={youtube.metrics[0].value}
          unit="count"
          deltaPct={youtube.metrics[0].deltaPct}
          source="API · Non-blended"
          note={`LinkedIn Impressions: ${formatMetricValue(linkedin.metrics[0].value, 'count')} · 4 of 6 platforms connected`}
          emphasized
          onClick={() => navigate('brand-youtube')}
        />
        <MetricTile
          label={`Engineering Progress · ${activeSystem.code} (${activeSystem.name})`}
          value={engProgress.percentage}
          unit="percentage"
          source="Calculated"
          note={`${engProgress.completedDeliverables} of ${engProgress.totalDeliverables} deliverables completed · ${engProgress.completedMilestones}/${engProgress.totalMilestones} milestones closed`}
          emphasized
          onClick={() => navigate('roadmap')}
        />
      </div>

      {/* Primary Performance Overview Chart */}
      <section className="p-5 sm:p-6 bg-[#121620] border border-white/[0.07] rounded-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-[#EDF1F7]">Performance Overview</h2>
            <p className="text-xs text-[#64748B] mt-0.5">{chartConfig.sourceNote}</p>
          </div>
          <SegmentedTabs
            ariaLabel="Performance Overview series selector"
            active={chartFocus}
            onChange={setChartFocus}
            tabs={[
              { id: 'youtube', label: 'YouTube' },
              { id: 'linkedin', label: 'LinkedIn' },
              { id: 'github', label: 'GitHub' },
            ]}
          />
        </div>

        <TrendChart
          data={chartConfig.data}
          unit={chartConfig.unit}
          primaryLabel={chartConfig.primaryLabel}
          secondaryLabel={chartConfig.secondaryLabel}
          secondaryUnit={chartConfig.secondaryUnit}
          accentColor={chartConfig.accentColor}
          height={250}
        />
      </section>

      {/* Latest Insight (Separated AI Layer with Traceable Evidence) */}
      <section className="p-6 bg-[#121620] border border-white/[0.07] rounded-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 text-xs">
            <span className="font-semibold text-[#EDF1F7]">Latest Insight</span>
            <span className="text-[#475569]" aria-hidden="true">·</span>
            <span className="text-[#64748B]">AI Analyst (Hypothesis separated from computed metrics)</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('insights')}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#60A5FA] hover:text-[#93C5FD] transition-colors whitespace-nowrap"
          >
            <span>All insights</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {topInsight ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#94A3B8]">
              <StatusText label={`${topInsight.priority} Priority`} tone="warning" />
              <span aria-hidden="true">·</span>
              <span>{topInsight.domain}</span>
              <span aria-hidden="true">·</span>
              <span>Confidence: {topInsight.confidence}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{topInsight.evidence.length} evidence records</span>
            </div>
            <h3 className="text-base font-semibold text-white">{topInsight.title}</h3>
            <p className="text-sm text-[#CBD5E1] leading-relaxed max-w-3xl">
              {topInsight.observation}
            </p>
            <div className="pt-1 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06]">
              <p className="text-xs text-[#94A3B8]">
                <span className="text-[#CBD5E1] font-medium">Suggested test:</span>{' '}
                {topInsight.suggestedAction}
              </p>
              <button
                type="button"
                onClick={() => navigate('insights', topInsight.id)}
                className="text-xs font-medium text-[#60A5FA] hover:text-[#93C5FD] whitespace-nowrap shrink-0"
              >
                Inspect evidence →
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#64748B]">
            No active findings yet. Run an analysis pass after syncing fresh observations.
          </p>
        )}
      </section>

      {/* Progressive Disclosure: Additional Details Hidden by Default */}
      <ProgressiveSection
        title="Additional sections"
        summary="Platform snapshot, active milestone status, and recent activity feed"
        expanded={showDetailedBreakdown}
        onToggle={() => setShowDetailedBreakdown((v) => !v)}
        actionLabel="Show detailed breakdown"
        collapseLabel="Hide detailed breakdown"
      >
        <div className="space-y-8">
          {/* Platform Distribution Table (Non-Blended) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[#CBD5E1]">Platform Snapshot</h3>
              <span className="text-xs text-[#64748B]">Native units preserved per platform</span>
            </div>
            <div className="overflow-x-auto border border-white/[0.07] rounded-xl bg-[#121620]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/[0.07] text-[#64748B]">
                    <th className="py-3 px-4 font-medium">Platform</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium">Primary Metric</th>
                    <th className="py-3 px-4 font-medium text-right">Value</th>
                    <th className="py-3 px-4 font-medium text-right">Engagement</th>
                    <th className="py-3 px-4 font-medium text-right">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {state.platforms.map((p) => {
                    const primary = p.metrics[0];
                    const eng = p.metrics.find((m) => m.key === 'engagement');
                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => navigate(`brand-${p.id}` as const)}
                            className="font-medium text-[#EDF1F7] hover:text-[#60A5FA] transition-colors"
                          >
                            {p.name}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <StatusText
                            label={
                              p.connectionStatus === 'connected'
                                ? 'Connected'
                                : p.connectionStatus === 'manual_only'
                                ? 'Manual Only'
                                : 'Not Connected'
                            }
                            tone={
                              p.connectionStatus === 'connected'
                                ? 'positive'
                                : p.connectionStatus === 'manual_only'
                                ? 'warning'
                                : 'neutral'
                            }
                          />
                        </td>
                        <td className="py-3 px-4 text-[#94A3B8]">{primary.label}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-[#EDF1F7]">
                          {formatMetricValue(primary.value, primary.unit)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-[#CBD5E1]">
                          {formatMetricValue(eng?.value, 'percentage')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[#64748B]">
                          {primary.source}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Milestones & Recent Activity Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-[#CBD5E1]">
                  {activeSystem.code} — {activeSystem.name} Milestones
                </h3>
                <button
                  type="button"
                  onClick={() => navigate('milestones')}
                  className="text-xs text-[#60A5FA] hover:text-[#93C5FD]"
                >
                  View all →
                </button>
              </div>
              <div className="divide-y divide-white/[0.06] border border-white/[0.07] rounded-xl bg-[#121620]">
                {systemMilestones.map((m) => {
                  const mDels = state.deliverables.filter((d) => d.milestoneId === m.id);
                  const done = mDels.filter((d) => d.status === 'Completed').length;
                  const pct = mDels.length > 0 ? Math.round((done / mDels.length) * 100) : null;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => navigate('milestone-detail', m.id)}
                      className="w-full text-left p-4 hover:bg-white/[0.02] transition-colors flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#EDF1F7] truncate">
                          0{m.sequence}. {m.title}
                        </p>
                        <p className="text-[11px] text-[#64748B] mt-0.5 font-mono tabular-nums">
                          {done}/{mDels.length} deliverables · {m.actualHours}h / {m.plannedHours}h
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-mono tabular-nums text-[#EDF1F7]">
                          {pct !== null ? `${pct}%` : '—'}
                        </p>
                        <StatusText
                          label={m.status}
                          tone={
                            m.status === 'Completed'
                              ? 'positive'
                              : m.status === 'Blocked'
                              ? 'danger'
                              : m.status === 'In Progress'
                              ? 'accent'
                              : 'neutral'
                          }
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-[#CBD5E1]">Recent Activity</h3>
                <button
                  type="button"
                  onClick={() => navigate('sync-history')}
                  className="text-xs text-[#60A5FA] hover:text-[#93C5FD]"
                >
                  Sync history →
                </button>
              </div>
              <div className="divide-y divide-white/[0.06] border border-white/[0.07] rounded-xl bg-[#121620]">
                {state.timeEntries.slice(0, 3).map((entry) => (
                  <div key={entry.id} className="p-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#EDF1F7]">{entry.note}</p>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        {entry.activityType} · {entry.date}
                      </p>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-[#CBD5E1] shrink-0">
                      {entry.hours.toFixed(1)}h
                    </span>
                  </div>
                ))}
                {state.syncRuns.slice(0, 2).map((run) => (
                  <div key={run.id} className="p-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#EDF1F7]">
                        {run.source} {run.trigger.toLowerCase()} sync
                      </p>
                      <p className="text-[11px] text-[#64748B] mt-0.5 font-mono tabular-nums">
                        {run.recordsProcessed} snapshots · {formatShortTimestamp(run.completedAt)}
                      </p>
                    </div>
                    <StatusText
                      label={run.status}
                      tone={
                        run.status === 'Succeeded'
                          ? 'positive'
                          : run.status === 'Partial'
                          ? 'warning'
                          : 'danger'
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ProgressiveSection>
    </div>
  );
}
