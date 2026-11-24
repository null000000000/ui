import React, { useMemo, useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { formatMetricValue } from '../lib/analyticsEngine';
import { TrendChart } from '../components/charts/Charts';
import { MetricTile, ProgressiveSection, StatusText } from '../components/ui/Primitives';

export function CrossAnalyticsPage() {
  const { state, navigate } = useWorkspace();
  const [showCompareTools, setShowCompareTools] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'youtube' | 'linkedin' | 'instagram'>('linkedin');
  const [selectedEngMetric, setSelectedEngMetric] = useState<'commits' | 'hours'>('commits');

  const platform = state.platforms.find((p) => p.id === selectedPlatform)!;
  const repo = state.repositories[0];

  const linkedContentCount = state.contentItems.filter((c) => c.milestoneIds.length > 0).length;
  const totalHoursLogged = state.milestones.reduce((acc, m) => acc + m.actualHours, 0);
  const completedDeliverables = state.deliverables.filter((d) => d.status === 'Completed').length;

  const combinedSeries = useMemo(() => {
    const base = platform.trendSeries;
    return base.map((pt, idx) => {
      const engVal =
        selectedEngMetric === 'commits'
          ? repo.commitSeries[idx]?.value ?? 6
          : [4, 7, 11, 8, 12, 6, 10, 9][idx] ?? 7;
      return {
        date: pt.date,
        label: pt.label,
        value: pt.value,
        secondaryValue: engVal,
      };
    });
  }, [platform.trendSeries, repo.commitSeries, selectedEngMetric]);

  const milestoneContentMatrix = useMemo(() => {
    return state.milestones.slice(0, 4).map((m) => {
      const items = state.contentItems.filter(
        (c) => c.milestoneIds.includes(m.id) || m.linkedContentIds.includes(c.id)
      );
      const pubs = items.flatMap((c) => c.publications);
      return {
        milestone: m,
        contentCount: items.length,
        publicationsCount: pubs.length,
        leadPlatform: pubs[0]
          ? `${state.platforms.find((p) => p.id === pubs[0].platform)?.name ?? pubs[0].platform}: ${formatMetricValue(
              pubs[0].metrics.primaryValue,
              pubs[0].metrics.primaryUnit
            )} ${pubs[0].metrics.primaryLabel}`
          : 'No publications yet',
      };
    });
  }, [state.milestones, state.contentItems, state.platforms]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-[#64748B]">
          Cross-Domain Analysis · Connects Personal Branding activity with Engineering execution
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-white mt-1">
          Cross Analytics
        </h1>
      </div>

      {/* Cross-Domain Overview KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTile
          label="Milestone-Linked Content"
          value={linkedContentCount}
          unit="count"
          source="Content Registry"
          note={`Out of ${state.contentItems.length} total content items`}
        />
        <MetricTile
          label="Engineering Hours Invested"
          value={totalHoursLogged}
          unit="hours"
          source="Time Entries"
          note={`${completedDeliverables} deliverables completed`}
        />
        <MetricTile
          label="LinkedIn Impressions (30d)"
          value={state.platforms.find((p) => p.id === 'linkedin')?.metrics[0]?.value ?? null}
          unit="count"
          deltaPct={26.8}
          source="API"
        />
        <MetricTile
          label="YouTube Views (30d)"
          value={state.platforms.find((p) => p.id === 'youtube')?.metrics[0]?.value ?? null}
          unit="count"
          deltaPct={14.2}
          source="API"
        />
      </div>

      {/* Brand vs Engineering Dual-Series Chart */}
      <section className="p-6 bg-[#121620] border border-white/[0.07] rounded-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-[#EDF1F7]">
              Brand vs Engineering Activity
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Plotted on independent scales — never merged into a single blended score
            </p>
          </div>
          <span className="text-xs font-mono text-[#94A3B8]">
            {platform.name} {platform.primaryMetricLabel} vs{' '}
            {selectedEngMetric === 'commits' ? 'GitHub Commits' : 'Engineering Hours'}
          </span>
        </div>

        <TrendChart
          data={combinedSeries}
          unit={platform.primaryMetricUnit}
          primaryLabel={`${platform.name} ${platform.primaryMetricLabel}`}
          secondaryLabel={selectedEngMetric === 'commits' ? 'GitHub Commits' : 'Engineering Hours'}
          secondaryUnit={selectedEngMetric === 'commits' ? 'count' : 'hours'}
          accentColor="#3B82F6"
          secondaryColor="#34D399"
          height={250}
        />
      </section>

      {/* Content Publishing vs Technical Progress Matrix */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#EDF1F7]">
            Content Publishing vs Technical Progress
          </h2>
          <span className="text-xs text-[#64748B]">System 01 — ORBIT</span>
        </div>
        <div className="border border-white/[0.07] rounded-xl bg-[#121620] overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.07] text-[#64748B]">
                <th className="py-3 px-4 font-medium">Milestone</th>
                <th className="py-3 px-4 font-medium text-right">Time Invested</th>
                <th className="py-3 px-4 font-medium text-right">Linked Content</th>
                <th className="py-3 px-4 font-medium text-right">Publications</th>
                <th className="py-3 px-4 font-medium">Lead Publication Output</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {milestoneContentMatrix.map((row) => (
                <tr key={row.milestone.id} className="hover:bg-white/[0.02]">
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => navigate('milestone-detail', row.milestone.id)}
                      className="font-medium text-[#EDF1F7] hover:text-[#60A5FA] text-left"
                    >
                      0{row.milestone.sequence}. {row.milestone.title}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#CBD5E1]">
                    {row.milestone.actualHours.toFixed(1)}h
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#EDF1F7]">
                    {row.contentCount}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#CBD5E1]">
                    {row.publicationsCount}
                  </td>
                  <td className="py-3.5 px-4 font-mono tabular-nums text-[#94A3B8]">
                    {row.leadPlatform}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Correlation Findings (Explicitly Framed as Observed Correlation, Not Causation) */}
      <section className="p-6 bg-[#121620] border border-white/[0.07] rounded-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-[#EDF1F7]">Correlation Findings</h2>
          <StatusText label="Observed association — not proven causation" tone="warning" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          <div className="space-y-1.5">
            <p className="font-medium text-white">
              Milestone Documentation ↔ LinkedIn Reach (+34.8% observed uplift)
            </p>
            <p className="text-[#94A3B8] leading-relaxed">
              Posts written directly from completed ORBIT schema and RBAC deliverables averaged 15,920 impressions vs 11,810 for general commentary across the 30-day window.
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="font-medium text-white">
              Deep Implementation Weeks ↔ Publishing Cadence
            </p>
            <p className="text-[#94A3B8] leading-relaxed">
              Weeks exceeding 14 engineering hours showed fewer long-form YouTube uploads but steady short-form Reel repurposing from existing code walkthroughs.
            </p>
          </div>
        </div>
      </section>

      {/* Expandable Comparison Controls */}
      <ProgressiveSection
        title="Custom Variable Comparison"
        summary="Select brand platform and engineering metric to compare alongside raw evidence"
        expanded={showCompareTools}
        onToggle={() => setShowCompareTools((v) => !v)}
        actionLabel="Configure variables"
      >
        <div className="p-5 bg-[#121620] border border-white/[0.07] rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label htmlFor="cross-platform" className="block text-[#94A3B8] mb-1.5">
              Brand Variable (Primary Axis)
            </label>
            <select
              id="cross-platform"
              value={selectedPlatform}
              onChange={(e) =>
                setSelectedPlatform(e.target.value as 'youtube' | 'linkedin' | 'instagram')
              }
              className="w-full px-3 py-2 bg-[#0B0E14] border border-white/[0.1] rounded-lg text-white"
            >
              <option value="linkedin">LinkedIn Impressions</option>
              <option value="youtube">YouTube Views</option>
              <option value="instagram">Instagram Reach</option>
            </select>
          </div>
          <div>
            <label htmlFor="cross-eng" className="block text-[#94A3B8] mb-1.5">
              Engineering Variable (Secondary Axis)
            </label>
            <select
              id="cross-eng"
              value={selectedEngMetric}
              onChange={(e) => setSelectedEngMetric(e.target.value as 'commits' | 'hours')}
              className="w-full px-3 py-2 bg-[#0B0E14] border border-white/[0.1] rounded-lg text-white"
            >
              <option value="commits">GitHub Commits (ORBIT)</option>
              <option value="hours">Logged Engineering Hours</option>
            </select>
          </div>
        </div>
      </ProgressiveSection>
    </div>
  );
}
