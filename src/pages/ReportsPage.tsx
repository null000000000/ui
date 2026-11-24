import React, { useMemo, useState } from 'react';
import { Bookmark, Download, Plus } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import type { DateRangeOption, ReportSnapshot } from '../types/analytics';
import {
  formatShortTimestamp,
  SegmentedTabs,
  SlideOverPanel,
  StatusText,
} from '../components/ui/Primitives';

export function ReportsPage() {
  const { state, generateReport, toggleReportSaved } = useWorkspace();
  const [filterTab, setFilterTab] = useState<'recent' | 'saved'>('recent');
  const [builderOpen, setBuilderOpen] = useState(false);
  const [viewingReport, setViewingReport] = useState<ReportSnapshot | null>(null);

  const [reportType, setReportType] = useState<ReportSnapshot['type']>('Cross Report');
  const [reportTitle, setReportTitle] = useState('');
  const [reportRange, setReportRange] = useState<DateRangeOption>('30d');
  const [selectedScope, setSelectedScope] = useState<string[]>([
    'YouTube',
    'LinkedIn',
    'System 01 — ORBIT',
  ]);
  const [metricsIncluded, setMetricsIncluded] = useState<string[]>([
    'Views',
    'Impressions',
    'Deliverable Completion',
    'Test Coverage',
  ]);
  const [includesAiInsights, setIncludesAiInsights] = useState(true);

  const visibleReports = useMemo(() => {
    return filterTab === 'saved'
      ? state.reports.filter((r) => r.saved)
      : state.reports;
  }, [state.reports, filterTab]);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const created = generateReport({
      title: reportTitle,
      type: reportType,
      dateRange: reportRange,
      selectedScope: selectedScope.length > 0 ? selectedScope : ['All Connected Sources'],
      metricsIncluded: metricsIncluded.length > 0 ? metricsIncluded : ['Primary Metrics'],
      includesAiInsights,
    });
    setReportTitle('');
    setBuilderOpen(false);
    setViewingReport(created);
  };

  const handleDownloadJson = (rep: ReportSnapshot) => {
    const blob = new Blob([JSON.stringify(rep, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${rep.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const scopeOptions = [
    'YouTube',
    'Instagram',
    'Facebook',
    'TikTok',
    'LinkedIn',
    'System 01 — ORBIT',
    'GitHub',
  ];

  const metricOptions = [
    'Views',
    'Watch Time',
    'Reach',
    'Impressions',
    'Deliverable Completion',
    'Planned vs Actual Hours',
    'Test Coverage',
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[#64748B]">
            Persisted analytical report snapshots · Report builder stays hidden until requested
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white mt-1">Reports</h1>
        </div>

        <button
          type="button"
          onClick={() => setBuilderOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#3B82F6] hover:bg-[#2563EB] rounded-lg whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Generate Report</span>
        </button>
      </div>

      <SegmentedTabs
        ariaLabel="Report lists"
        active={filterTab}
        onChange={setFilterTab}
        tabs={[
          { id: 'recent', label: 'Recent Reports', count: state.reports.length },
          {
            id: 'saved',
            label: 'Saved Reports',
            count: state.reports.filter((r) => r.saved).length,
          },
        ]}
      />

      <div className="space-y-3">
        {visibleReports.map((rep) => (
          <div
            key={rep.id}
            className="p-5 bg-[#121620] border border-white/[0.07] hover:border-white/[0.15] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
          >
            <button
              type="button"
              onClick={() => setViewingReport(rep)}
              className="text-left space-y-1.5 flex-1 min-w-0"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#94A3B8]">
                <StatusText label={rep.type} tone="accent" />
                <span aria-hidden="true">·</span>
                <span>Window: {rep.dateRange}</span>
                <span aria-hidden="true">·</span>
                <span>{rep.includesAiInsights ? 'Includes AI Insights' : 'Metrics only'}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-[#64748B] tabular-nums">
                  {formatShortTimestamp(rep.generatedAt)}
                </span>
              </div>
              <h2 className="text-base font-semibold text-white">{rep.title}</h2>
              <p className="text-xs text-[#94A3B8] line-clamp-2">{rep.summary}</p>
            </button>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => toggleReportSaved(rep.id)}
                aria-label={rep.saved ? `Unsave ${rep.title}` : `Save ${rep.title}`}
                className={`p-2 rounded-lg border transition-colors ${
                  rep.saved
                    ? 'bg-[#3B82F6]/15 border-[#3B82F6]/40 text-[#60A5FA]'
                    : 'bg-[#0B0E14] border-white/[0.08] text-[#94A3B8] hover:text-white'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewingReport(rep)}
                className="px-3.5 py-2 text-xs font-medium text-[#EDF1F7] bg-[#0B0E14] border border-white/[0.08] hover:border-white/[0.18] rounded-lg whitespace-nowrap"
              >
                Open Snapshot
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Generate Report Builder Drawer (Spec 8) */}
      <SlideOverPanel
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        title="Generate Report"
        subtitle="Configure scope, metrics, and whether to attach evidence-backed AI Insights."
      >
        <form onSubmit={handleGenerate} className="space-y-5 text-xs">
          <div>
            <label htmlFor="rep-type" className="block font-medium text-[#CBD5E1] mb-1.5">
              1. Report Type
            </label>
            <select
              id="rep-type"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportSnapshot['type'])}
              className="w-full px-3 py-2 bg-[#121620] border border-white/[0.1] rounded-lg text-white"
            >
              <option value="Brand Report">Brand Report</option>
              <option value="Engineering Report">Engineering Report</option>
              <option value="Cross Report">Cross Report</option>
              <option value="Intelligence Report">Intelligence Report</option>
              <option value="Custom Report">Custom Report</option>
            </select>
          </div>

          <div>
            <label htmlFor="rep-title" className="block font-medium text-[#CBD5E1] mb-1.5">
              Report Title (optional)
            </label>
            <input
              id="rep-title"
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder={`${reportType} — Snapshot`}
              className="w-full px-3.5 py-2 bg-[#121620] border border-white/[0.1] rounded-lg text-white placeholder:text-[#64748B]"
            />
          </div>

          <div>
            <label htmlFor="rep-range" className="block font-medium text-[#CBD5E1] mb-1.5">
              2. Date Range
            </label>
            <select
              id="rep-range"
              value={reportRange}
              onChange={(e) => setReportRange(e.target.value as DateRangeOption)}
              className="w-full px-3 py-2 bg-[#121620] border border-white/[0.1] rounded-lg text-white"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="180d">Last 180 days</option>
              <option value="all">All snapshots</option>
            </select>
          </div>

          <div>
            <span className="block font-medium text-[#CBD5E1] mb-2">
              3. Selected Platforms / Systems
            </span>
            <div className="flex flex-wrap gap-2">
              {scopeOptions.map((item) => {
                const active = selectedScope.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      setSelectedScope((prev) =>
                        active ? prev.filter((x) => x !== item) : [...prev, item]
                      )
                    }
                    className={`px-3 py-1.5 rounded-lg border transition-colors ${
                      active
                        ? 'bg-[#3B82F6]/15 border-[#3B82F6]/50 text-[#60A5FA]'
                        : 'bg-[#121620] border-white/[0.08] text-[#94A3B8]'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="block font-medium text-[#CBD5E1] mb-2">4. Metrics</span>
            <div className="flex flex-wrap gap-2">
              {metricOptions.map((metric) => {
                const active = metricsIncluded.includes(metric);
                return (
                  <button
                    key={metric}
                    type="button"
                    onClick={() =>
                      setMetricsIncluded((prev) =>
                        active ? prev.filter((x) => x !== metric) : [...prev, metric]
                      )
                    }
                    className={`px-3 py-1.5 rounded-lg border transition-colors ${
                      active
                        ? 'bg-[#3B82F6]/15 border-[#3B82F6]/50 text-[#60A5FA]'
                        : 'bg-[#121620] border-white/[0.08] text-[#94A3B8]'
                    }`}
                  >
                    {metric}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-[#EDF1F7] cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={includesAiInsights}
              onChange={(e) => setIncludesAiInsights(e.target.checked)}
              className="accent-[#3B82F6]"
            />
            <span>5. Include AI Insights & Experiment Hypotheses</span>
          </label>

          <div className="pt-3 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setBuilderOpen(false)}
              className="px-4 py-2 text-[#CBD5E1] bg-[#121620] border border-white/[0.08] rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-medium text-white bg-[#3B82F6] hover:bg-[#2563EB] rounded-lg"
            >
              Generate Snapshot
            </button>
          </div>
        </form>
      </SlideOverPanel>

      {/* Report Snapshot Reader */}
      <SlideOverPanel
        open={Boolean(viewingReport)}
        onClose={() => setViewingReport(null)}
        title={viewingReport?.title ?? ''}
        subtitle={
          viewingReport
            ? `${viewingReport.type} · Window: ${viewingReport.dateRange} · Generated ${formatShortTimestamp(
                viewingReport.generatedAt
              )}`
            : undefined
        }
        footer={
          viewingReport ? (
            <button
              type="button"
              onClick={() => handleDownloadJson(viewingReport)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#3B82F6] hover:bg-[#2563EB] rounded-lg"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON Snapshot</span>
            </button>
          ) : undefined
        }
      >
        {viewingReport && (
          <div className="space-y-6 text-xs">
            <div className="space-y-1.5">
              <h3 className="font-semibold text-[#EDF1F7]">Executive Summary</h3>
              <p className="text-sm text-[#CBD5E1] leading-relaxed">{viewingReport.summary}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-[#EDF1F7]">Key Highlights</h3>
              <div className="border border-white/[0.07] rounded-lg divide-y divide-white/[0.06] bg-[#121620]">
                {viewingReport.highlights.map((h) => (
                  <div key={h.label} className="p-3.5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[#CBD5E1]">{h.label}</p>
                      <p className="text-[11px] font-mono text-[#64748B]">Source: {h.source}</p>
                    </div>
                    <span className="font-mono tabular-nums text-sm text-white">{h.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-semibold text-[#EDF1F7]">Scope</h3>
              <p className="text-[#94A3B8]">{viewingReport.selectedScope.join(' · ')}</p>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-semibold text-[#EDF1F7]">Included Metrics</h3>
              <p className="text-[#94A3B8]">{viewingReport.metricsIncluded.join(' · ')}</p>
            </div>
          </div>
        )}
      </SlideOverPanel>
    </div>
  );
}
