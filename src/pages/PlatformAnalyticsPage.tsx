import React, { useMemo, useState } from 'react';
import { ArrowRight, Plus } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { formatMetricValue, sliceSeriesByDateRange } from '../lib/analyticsEngine';
import type { PlatformId } from '../types/analytics';
import { HorizontalBarList, TrendChart } from '../components/charts/Charts';
import {
  EmptyState,
  formatShortTimestamp,
  MetricTile,
  SegmentedTabs,
  SlideOverPanel,
  StatusText,
} from '../components/ui/Primitives';

type PlatformTab =
  | 'overview'
  | 'content'
  | 'audience'
  | 'engagement'
  | 'growth'
  | 'insights'
  | 'data_status';

export function PlatformAnalyticsPage({ platformId }: { platformId: PlatformId }) {
  const {
    state,
    dateRange,
    navigate,
    logManualPlatformMetric,
    togglePlatformConnection,
  } = useWorkspace();

  const [activeTab, setActiveTab] = useState<PlatformTab>('overview');
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [selectedMetricKey, setSelectedMetricKey] = useState('');
  const [manualValue, setManualValue] = useState('');
  const [manualError, setManualError] = useState('');

  const platform = state.platforms.find((p) => p.id === platformId)!;

  const platformPublications = useMemo(() => {
    const rows: {
      contentId: string;
      title: string;
      format: string;
      publishedAt: string;
      primaryLabel: string;
      primaryValue: number | null;
      primaryUnit: 'count' | 'seconds' | 'percentage' | 'hours' | 'score';
      engagementRatePct: number | null;
      sourceType: string;
    }[] = [];

    for (const item of state.contentItems) {
      for (const pub of item.publications) {
        if (pub.platform === platformId) {
          rows.push({
            contentId: item.id,
            title: item.title,
            format: item.format,
            publishedAt: pub.publishedAt,
            primaryLabel: pub.metrics.primaryLabel,
            primaryValue: pub.metrics.primaryValue,
            primaryUnit: pub.metrics.primaryUnit,
            engagementRatePct: pub.metrics.engagementRatePct,
            sourceType: pub.sourceType,
          });
        }
      }
    }

    return rows.sort((a, b) => (b.primaryValue ?? -1) - (a.primaryValue ?? -1));
  }, [state.contentItems, platformId]);

  const platformInsights = useMemo(
    () =>
      state.insights.filter(
        (i) =>
          i.domain === 'Brand' ||
          i.title.toLowerCase().includes(platform.name.toLowerCase()) ||
          i.observation.toLowerCase().includes(platform.name.toLowerCase())
      ),
    [state.insights, platform.name]
  );

  const openManualModal = () => {
    setSelectedMetricKey(platform.metrics[0]?.key ?? '');
    setManualValue('');
    setManualError('');
    setManualModalOpen(true);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(manualValue);
    if (manualValue.trim() === '' || Number.isNaN(num) || num < 0) {
      setManualError('Enter a valid non-negative numeric observation.');
      return;
    }
    logManualPlatformMetric(platformId, selectedMetricKey || platform.metrics[0].key, num);
    setManualModalOpen(false);
  };

  const statusTone =
    platform.connectionStatus === 'connected'
      ? 'positive'
      : platform.connectionStatus === 'manual_only'
      ? 'warning'
      : 'neutral';

  const statusLabel =
    platform.connectionStatus === 'connected'
      ? 'Connected'
      : platform.connectionStatus === 'manual_only'
      ? 'Manual Entry Mode'
      : 'Not Connected';

  return (
    <div className="space-y-7">
      {/* Platform Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
            <StatusText label={statusLabel} tone={statusTone} />
            <span aria-hidden="true">·</span>
            <span>{platform.handle}</span>
            <span aria-hidden="true">·</span>
            <span>{platform.collectionMode}</span>
            <span aria-hidden="true">·</span>
            <span>Last sync: {formatShortTimestamp(platform.lastSyncedAt)}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white mt-1">
            {platform.name}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openManualModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#EDF1F7] bg-[#121620] hover:bg-[#181E2B] border border-white/[0.08] rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Manual Metric</span>
          </button>
          {platform.connectionStatus === 'disconnected' && (
            <button
              type="button"
              onClick={() => togglePlatformConnection(platformId)}
              className="px-3.5 py-2 text-xs font-medium text-white bg-[#3B82F6] hover:bg-[#2563EB] rounded-lg transition-colors whitespace-nowrap"
            >
              Connect {platform.name}
            </button>
          )}
        </div>
      </div>

      {/* Progressive Section Tabs */}
      <SegmentedTabs
        ariaLabel={`${platform.name} analytics sections`}
        active={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'content', label: 'Content', count: platformPublications.length },
          { id: 'audience', label: 'Audience' },
          { id: 'engagement', label: 'Engagement' },
          { id: 'growth', label: 'Growth' },
          { id: 'insights', label: 'Insights', count: platformInsights.length },
          { id: 'data_status', label: 'Data Status' },
        ]}
      />

      {/* OVERVIEW TAB (Minimal Default) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {platform.metrics.map((metric) => (
              <MetricTile
                key={metric.key}
                label={metric.label}
                value={metric.value}
                unit={metric.unit}
                deltaPct={metric.deltaPct}
                source={metric.source}
                note={metric.note}
              />
            ))}
          </div>

          {platform.connectionStatus === 'disconnected' ? (
            <EmptyState
              title={`${platform.name} is not connected yet`}
              description="Unavailable metrics remain displayed as '—' rather than zero. Connect your OAuth account to establish a fresh historical baseline, or log a manual observation."
              actionLabel={`Connect ${platform.name}`}
              onAction={() => togglePlatformConnection(platformId)}
            />
          ) : (
            <section className="p-6 bg-[#121620] border border-white/[0.07] rounded-xl space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-[#EDF1F7]">Performance Trend</h2>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {platform.primaryMetricLabel} time-series · Source: {platform.collectionMode}
                  </p>
                </div>
              </div>
              <TrendChart
                data={sliceSeriesByDateRange(platform.trendSeries, dateRange)}
                unit={platform.primaryMetricUnit}
                primaryLabel={`${platform.name} ${platform.primaryMetricLabel}`}
                height={240}
              />
            </section>
          )}

          {/* Compact Top Content Preview with Drill-Down */}
          <section className="p-6 bg-[#121620] border border-white/[0.07] rounded-xl space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-[#EDF1F7]">Content Performance</h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Publications tracked independently for {platform.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('content')}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#60A5FA] hover:text-[#93C5FD] whitespace-nowrap"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {platformPublications.length === 0 ? (
              <p className="text-xs text-[#64748B]">
                No publications linked to {platform.name} yet.
              </p>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {platformPublications.slice(0, 3).map((row) => (
                  <button
                    key={row.contentId + row.publishedAt}
                    type="button"
                    onClick={() => navigate('content-detail', row.contentId)}
                    className="w-full py-3 flex items-center justify-between gap-4 text-left hover:bg-white/[0.02] -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#EDF1F7] truncate">{row.title}</p>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        {row.format} · Published {row.publishedAt} · {row.sourceType}
                      </p>
                    </div>
                    <div className="text-right font-mono tabular-nums shrink-0">
                      <p className="text-sm text-[#EDF1F7]">
                        {formatMetricValue(row.primaryValue, row.primaryUnit)}
                      </p>
                      <p className="text-[11px] text-[#64748B]">{row.primaryLabel}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* CONTENT TAB */}
      {activeTab === 'content' && (
        <div className="border border-white/[0.07] rounded-xl bg-[#121620] overflow-x-auto">
          {platformPublications.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title={`No ${platform.name} publications recorded`}
                description="Register content in the Content Library and link a publication to track platform-specific performance."
                actionLabel="Open Content Library"
                onAction={() => navigate('content-library')}
              />
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/[0.07] text-[#64748B]">
                  <th className="py-3 px-4 font-medium">Content Title</th>
                  <th className="py-3 px-4 font-medium">Format</th>
                  <th className="py-3 px-4 font-medium">Published</th>
                  <th className="py-3 px-4 font-medium text-right">{platform.primaryMetricLabel}</th>
                  <th className="py-3 px-4 font-medium text-right">Engagement</th>
                  <th className="py-3 px-4 font-medium text-right">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {platformPublications.map((row) => (
                  <tr key={row.contentId + row.publishedAt} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => navigate('content-detail', row.contentId)}
                        className="font-medium text-[#EDF1F7] hover:text-[#60A5FA] text-left"
                      >
                        {row.title}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-[#94A3B8]">{row.format}</td>
                    <td className="py-3 px-4 font-mono tabular-nums text-[#94A3B8]">
                      {row.publishedAt}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-[#EDF1F7]">
                      {formatMetricValue(row.primaryValue, row.primaryUnit)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-[#CBD5E1]">
                      {formatMetricValue(row.engagementRatePct, 'percentage')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#64748B]">
                      {row.sourceType}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* AUDIENCE TAB */}
      {activeTab === 'audience' && (
        <div className="space-y-6">
          {!platform.audience.available ? (
            <EmptyState
              title="Audience breakdown unavailable"
              description={`${platform.name} currently does not expose demographic or returning-viewer telemetry in ${platform.collectionMode} mode.`}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 bg-[#121620] border border-white/[0.07] rounded-xl space-y-4">
                <h2 className="text-sm font-semibold text-[#EDF1F7]">Top Audience Regions</h2>
                <HorizontalBarList
                  unit="percentage"
                  items={platform.audience.topRegions.map((r) => ({
                    label: r.name,
                    value: r.sharePct,
                  }))}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 content-start">
                <MetricTile
                  label="Returning Viewer Share"
                  value={platform.audience.returningSharePct}
                  unit="percentage"
                  source={platform.audience.returningSharePct !== null ? 'API' : 'Unavailable'}
                  note={platform.audience.returningSharePct === null ? 'Not provided by platform API' : undefined}
                />
                <div className="p-5 bg-[#121620] border border-white/[0.07] rounded-xl">
                  <p className="text-xs font-medium text-[#94A3B8]">Peak Activity Window</p>
                  <p className="text-lg font-mono tabular-nums font-semibold text-[#EDF1F7] mt-3">
                    {platform.audience.activeHours ?? '—'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ENGAGEMENT TAB */}
      {activeTab === 'engagement' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricTile label="Likes / Reactions" value={platform.engagement.likes} unit="count" />
          <MetricTile label="Comments" value={platform.engagement.comments} unit="count" />
          <MetricTile label="Shares / Reposts" value={platform.engagement.shares} unit="count" />
          <MetricTile
            label="Saves / Bookmarks"
            value={platform.engagement.saves}
            unit="count"
            note={platform.engagement.saves === null ? 'Not exposed by API' : undefined}
          />
          <MetricTile
            label="Engagement Rate"
            value={platform.engagement.ratePct}
            unit="percentage"
            source="Calculated"
          />
        </div>
      )}

      {/* GROWTH TAB */}
      {activeTab === 'growth' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MetricTile
              label="Net Audience Change (30d)"
              value={platform.growth.netFollowers}
              unit="count"
              deltaPct={platform.growth.growthRatePct}
            />
            <MetricTile
              label="Growth Rate"
              value={platform.growth.growthRatePct}
              unit="percentage"
              source="Calculated"
            />
          </div>
          <div className="p-6 bg-[#121620] border border-white/[0.07] rounded-xl">
            <h2 className="text-sm font-semibold text-[#EDF1F7] mb-4">Audience Trajectory</h2>
            <TrendChart
              data={platform.growth.monthlySeries}
              unit="count"
              primaryLabel={`${platform.name} Audience`}
              accentColor="#34D399"
              height={220}
            />
          </div>
        </div>
      )}

      {/* INSIGHTS TAB */}
      {activeTab === 'insights' && (
        <div className="space-y-3">
          {platformInsights.length === 0 ? (
            <EmptyState
              title={`No ${platform.name}-specific insights yet`}
              description="Insights appear here once enough time-series observations exist to substantiate a finding with evidence."
            />
          ) : (
            platformInsights.map((ins) => (
              <div
                key={ins.id}
                className="p-5 bg-[#121620] border border-white/[0.07] rounded-xl space-y-2"
              >
                <div className="flex items-center justify-between gap-2 text-xs text-[#94A3B8]">
                  <span>
                    {ins.domain} · Priority: {ins.priority} · Confidence: {ins.confidence}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate('insights', ins.id)}
                    className="text-[#60A5FA] hover:text-[#93C5FD]"
                  >
                    Inspect evidence →
                  </button>
                </div>
                <h3 className="text-sm font-semibold text-white">{ins.title}</h3>
                <p className="text-xs text-[#CBD5E1] leading-relaxed">{ins.observation}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* DATA STATUS TAB */}
      {activeTab === 'data_status' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 bg-[#121620] border border-white/[0.07] rounded-xl space-y-4">
            <h2 className="text-sm font-semibold text-[#EDF1F7]">Connection & Sync Policy</h2>
            <dl className="space-y-3 text-xs">
              <div className="flex justify-between gap-4 border-b border-white/[0.05] pb-2.5">
                <dt className="text-[#64748B]">Collection Mode</dt>
                <dd className="text-[#EDF1F7] font-medium">{platform.collectionMode}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-white/[0.05] pb-2.5">
                <dt className="text-[#64748B]">Schedule</dt>
                <dd className="text-[#EDF1F7]">{platform.syncSchedule}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-white/[0.05] pb-2.5">
                <dt className="text-[#64748B]">Last Successful Sync</dt>
                <dd className="font-mono tabular-nums text-[#EDF1F7]">
                  {formatShortTimestamp(platform.lastSyncedAt)}
                </dd>
              </div>
            </dl>
            <div className="pt-2">
              <p className="text-xs font-medium text-[#94A3B8] mb-2">OAuth Scopes</p>
              <ul className="space-y-1.5 text-xs">
                {platform.permissions.map((perm) => (
                  <li key={perm.scope} className="flex items-center justify-between font-mono">
                    <span className="text-[#CBD5E1]">{perm.scope}</span>
                    <StatusText
                      label={perm.granted ? 'Granted' : 'Not granted'}
                      tone={perm.granted ? 'positive' : 'neutral'}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-6 bg-[#121620] border border-white/[0.07] rounded-xl space-y-4">
            <h2 className="text-sm font-semibold text-[#EDF1F7]">Metric Availability Transparency</h2>
            <div>
              <p className="text-xs font-medium text-[#34D399] mb-2">Supported Metrics</p>
              <p className="text-xs text-[#CBD5E1] leading-relaxed">
                {platform.supportedMetrics.join(' · ')}
              </p>
            </div>
            <div className="pt-3 border-t border-white/[0.06]">
              <p className="text-xs font-medium text-[#FBBF24] mb-2">Unavailable / Missing Metrics</p>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                {platform.missingMetrics.join(' · ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Manual Observation Drawer */}
      <SlideOverPanel
        open={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        title={`Log Manual Metric · ${platform.name}`}
        subtitle="Manual observations pass the same validation rules as API ingestion and are tagged with source: Manual."
      >
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label htmlFor="pm-metric" className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
              Metric Definition
            </label>
            <select
              id="pm-metric"
              value={selectedMetricKey}
              onChange={(e) => setSelectedMetricKey(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#121620] border border-white/[0.1] rounded-lg text-white focus:border-[#3B82F6] focus:outline-none"
            >
              {platform.metrics.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label} ({m.unit})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="pm-value" className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
              Observed Value
            </label>
            <input
              id="pm-value"
              type="number"
              step="any"
              min="0"
              value={manualValue}
              onChange={(e) => {
                setManualValue(e.target.value);
                setManualError('');
              }}
              placeholder="Enter exact observed figure"
              className="w-full px-3.5 py-2 text-sm font-mono tabular-nums bg-[#121620] border border-white/[0.1] rounded-lg text-white focus:border-[#3B82F6] focus:outline-none"
            />
          </div>
          {manualError && <p className="text-xs text-[#F87171]">{manualError}</p>}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setManualModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-[#CBD5E1] bg-[#121620] border border-white/[0.08] rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-[#3B82F6] hover:bg-[#2563EB] rounded-lg"
            >
              Save Observation
            </button>
          </div>
        </form>
      </SlideOverPanel>
    </div>
  );
}
