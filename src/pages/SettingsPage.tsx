import React, { useState } from 'react';
import { Download, RotateCcw } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import type { AppSettings, DateRangeOption } from '../types/analytics';
import { SegmentedTabs, StatusText } from '../components/ui/Primitives';

type SettingsTab =
  | 'general'
  | 'analytics'
  | 'metrics'
  | 'ai'
  | 'notifications'
  | 'data'
  | 'security'
  | 'backup';

export function SettingsPage() {
  const { state, updateSettings, resetDemoData } = useWorkspace();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handlePatch = (patch: Partial<AppSettings>) => {
    updateSettings(patch);
    setSavedFeedback(true);
    window.setTimeout(() => setSavedFeedback(false), 1800);
  };

  const handleExportWorkspace = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `personal-analytics-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[#64748B]">
            Workspace configuration, Metric Registry definitions, AI guardrails, and data ownership
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white mt-1">Settings</h1>
        </div>
        {savedFeedback && <StatusText label="Preferences saved" tone="positive" />}
      </div>

      <SegmentedTabs
        ariaLabel="Settings categories"
        active={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'general', label: 'General' },
          { id: 'analytics', label: 'Analytics Preferences' },
          { id: 'metrics', label: 'Metric Definitions', count: state.metricDefinitions.length },
          { id: 'ai', label: 'AI Configuration' },
          { id: 'notifications', label: 'Notifications' },
          { id: 'data', label: 'Data Management' },
          { id: 'security', label: 'Security' },
          { id: 'backup', label: 'Backup & Export' },
        ]}
      />

      {activeTab === 'general' && (
        <div className="p-6 bg-[#121620] border border-white/[0.07] rounded-xl space-y-5 max-w-2xl text-xs">
          <div>
            <label htmlFor="set-ws" className="block text-[#CBD5E1] font-medium mb-1.5">
              Workspace Name
            </label>
            <input
              id="set-ws"
              type="text"
              value={state.settings.workspaceName}
              onChange={(e) => handlePatch({ workspaceName: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-[#0B0E14] border border-white/[0.1] rounded-lg text-white"
            />
          </div>
          <div>
            <label htmlFor="set-owner" className="block text-[#CBD5E1] font-medium mb-1.5">
              Owner Name (Single-user Scope)
            </label>
            <input
              id="set-owner"
              type="text"
              value={state.settings.ownerName}
              onChange={(e) => handlePatch({ ownerName: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-[#0B0E14] border border-white/[0.1] rounded-lg text-white"
            />
          </div>
          <div>
            <label htmlFor="set-tz" className="block text-[#CBD5E1] font-medium mb-1.5">
              Reporting Timezone
            </label>
            <input
              id="set-tz"
              type="text"
              value={state.settings.timezone}
              onChange={(e) => handlePatch({ timezone: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-[#0B0E14] border border-white/[0.1] rounded-lg text-white"
            />
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="p-6 bg-[#121620] border border-white/[0.07] rounded-xl space-y-5 max-w-2xl text-xs">
          <div>
            <label htmlFor="set-range" className="block text-[#CBD5E1] font-medium mb-1.5">
              Default Global Date Range
            </label>
            <select
              id="set-range"
              value={state.settings.defaultDateRange}
              onChange={(e) =>
                handlePatch({ defaultDateRange: e.target.value as DateRangeOption })
              }
              className="w-full px-3 py-2 text-sm bg-[#0B0E14] border border-white/[0.1] rounded-lg text-white"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="180d">Last 180 days</option>
              <option value="all">All snapshots</option>
            </select>
          </div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={state.settings.minimalDefaultMode}
              onChange={(e) => handlePatch({ minimalDefaultMode: e.target.checked })}
              className="mt-0.5 accent-[#3B82F6]"
            />
            <div>
              <p className="text-sm font-medium text-[#EDF1F7]">Minimal by Default (Progressive Disclosure)</p>
              <p className="text-[#64748B] mt-0.5">
                Keep secondary breakdowns, filter drawers, and extra table columns collapsed until explicitly opened.
              </p>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={state.settings.showSourceIndicators}
              onChange={(e) => handlePatch({ showSourceIndicators: e.target.checked })}
              className="mt-0.5 accent-[#3B82F6]"
            />
            <div>
              <p className="text-sm font-medium text-[#EDF1F7]">Show Source Traceability Labels</p>
              <p className="text-[#64748B] mt-0.5">
                Display API, Manual, or Calculated provenance alongside metric tiles.
              </p>
            </div>
          </label>
        </div>
      )}

      {activeTab === 'metrics' && (
        <div className="border border-white/[0.07] rounded-xl bg-[#121620] overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.07] text-[#64748B]">
                <th className="py-3 px-4 font-medium">Metric</th>
                <th className="py-3 px-4 font-medium">Domain</th>
                <th className="py-3 px-4 font-medium">Unit</th>
                <th className="py-3 px-4 font-medium">Source Platform</th>
                <th className="py-3 px-4 font-medium">Aggregation</th>
                <th className="py-3 px-4 font-medium">Version</th>
                <th className="py-3 px-4 font-medium">Definition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {state.metricDefinitions.map((md) => (
                <tr key={md.id} className="hover:bg-white/[0.02]">
                  <td className="py-3.5 px-4 font-medium text-[#EDF1F7] whitespace-nowrap">
                    {md.name}
                  </td>
                  <td className="py-3.5 px-4 text-[#94A3B8]">{md.domain}</td>
                  <td className="py-3.5 px-4 font-mono text-[#CBD5E1]">{md.unit}</td>
                  <td className="py-3.5 px-4 text-[#94A3B8] whitespace-nowrap">
                    {md.sourcePlatform}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#94A3B8]">
                    {md.aggregationType}
                    {md.isCumulative ? ' (cumulative)' : ''}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#64748B]">{md.definitionVersion}</td>
                  <td className="py-3.5 px-4 text-[#94A3B8] max-w-sm">{md.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="p-6 bg-[#121620] border border-white/[0.07] rounded-xl space-y-5 max-w-2xl text-xs">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={state.settings.aiEvidenceRequired}
              onChange={(e) => handlePatch({ aiEvidenceRequired: e.target.checked })}
              className="mt-0.5 accent-[#3B82F6]"
            />
            <div>
              <p className="text-sm font-medium text-[#EDF1F7]">Require Supporting Evidence for Every Insight</p>
              <p className="text-[#64748B] mt-0.5">
                Enforces architecture invariant #6: no AI Analyst insight can be stored without linked insight_evidence records.
              </p>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={state.settings.aiAutoRunOnSync}
              onChange={(e) => handlePatch({ aiAutoRunOnSync: e.target.checked })}
              className="mt-0.5 accent-[#3B82F6]"
            />
            <div>
              <p className="text-sm font-medium text-[#EDF1F7]">Run Rules & AI Analysis After Sync</p>
              <p className="text-[#64748B] mt-0.5">
                Trigger incremental trend detection after fresh snapshots persist. AI can never mutate metrics or milestone status.
              </p>
            </div>
          </label>
          <div>
            <label htmlFor="set-conf" className="block text-[#CBD5E1] font-medium mb-1.5">
              Minimum Confidence Threshold for Highlighted Insights
            </label>
            <select
              id="set-conf"
              value={state.settings.aiConfidenceThreshold}
              onChange={(e) =>
                handlePatch({
                  aiConfidenceThreshold: e.target.value as AppSettings['aiConfidenceThreshold'],
                })
              }
              className="w-full px-3 py-2 text-sm bg-[#0B0E14] border border-white/[0.1] rounded-lg text-white"
            >
              <option value="High">High only</option>
              <option value="Medium">Medium and above</option>
              <option value="Low">Show all exploratory hypotheses</option>
            </select>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="p-6 bg-[#121620] border border-white/[0.07] rounded-xl space-y-4 max-w-2xl text-xs">
          <label className="flex items-center justify-between gap-4 py-2 border-b border-white/[0.05] cursor-pointer">
            <div>
              <p className="text-sm font-medium text-[#EDF1F7]">Sync Failures & Partial Runs</p>
              <p className="text-[#64748B]">Alert when a scheduled or manual connector fails</p>
            </div>
            <input
              type="checkbox"
              checked={state.settings.notifySyncFailures}
              onChange={(e) => handlePatch({ notifySyncFailures: e.target.checked })}
              className="accent-[#3B82F6]"
            />
          </label>
          <label className="flex items-center justify-between gap-4 py-2 border-b border-white/[0.05] cursor-pointer">
            <div>
              <p className="text-sm font-medium text-[#EDF1F7]">High-Priority AI Insights</p>
              <p className="text-[#64748B]">Alert when trend detection surfaces a high-confidence anomaly</p>
            </div>
            <input
              type="checkbox"
              checked={state.settings.notifyHighPriorityInsights}
              onChange={(e) => handlePatch({ notifyHighPriorityInsights: e.target.checked })}
              className="accent-[#3B82F6]"
            />
          </label>
          <label className="flex items-center justify-between gap-4 py-2 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-[#EDF1F7]">Experiment Verification Windows</p>
              <p className="text-[#64748B]">Notify when a running experiment finishes its measurement period</p>
            </div>
            <input
              type="checkbox"
              checked={state.settings.notifyExperimentMilestones}
              onChange={(e) => handlePatch({ notifyExperimentMilestones: e.target.checked })}
              className="accent-[#3B82F6]"
            />
          </label>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="p-6 bg-[#121620] border border-white/[0.07] rounded-xl space-y-5 max-w-2xl text-xs">
          <div>
            <label htmlFor="set-ret" className="block text-[#CBD5E1] font-medium mb-1.5">
              Historical Snapshot Retention Policy
            </label>
            <select
              id="set-ret"
              value={state.settings.retentionPolicy}
              onChange={(e) =>
                handlePatch({
                  retentionPolicy: e.target.value as AppSettings['retentionPolicy'],
                })
              }
              className="w-full px-3 py-2 text-sm bg-[#0B0E14] border border-white/[0.1] rounded-lg text-white"
            >
              <option value="Keep all snapshots">Keep all immutable snapshots indefinitely</option>
              <option value="24 months">24 months rolling window</option>
              <option value="12 months">12 months rolling window</option>
            </select>
          </div>
          <p className="text-[#94A3B8] leading-relaxed">
            Historical Integrity invariant: existing metric observations are append-only snapshots and are never overwritten when fresh data arrives.
          </p>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="p-6 bg-[#121620] border border-white/[0.07] rounded-xl space-y-4 max-w-2xl text-xs">
          <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
            <div>
              <p className="text-sm font-medium text-[#EDF1F7]">Encrypted Credential Storage</p>
              <p className="text-[#64748B]">OAuth tokens isolated in integration_credentials; redacted from logs</p>
            </div>
            <StatusText label="Active" tone="positive" />
          </div>
          <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
            <div>
              <p className="text-sm font-medium text-[#EDF1F7]">Single-User Access Mode</p>
              <p className="text-[#64748B]">No multi-tenant exposure; personal analytics boundary enforced</p>
            </div>
            <StatusText label="Enforced" tone="accent" />
          </div>
          <label className="flex items-center justify-between gap-4 py-2 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-[#EDF1F7]">Audit Logging</p>
              <p className="text-[#64748B]">Record manual metric overrides, sync retries, and report exports</p>
            </div>
            <input
              type="checkbox"
              checked={state.settings.auditLoggingEnabled}
              onChange={(e) => handlePatch({ auditLoggingEnabled: e.target.checked })}
              className="accent-[#3B82F6]"
            />
          </label>
        </div>
      )}

      {activeTab === 'backup' && (
        <div className="p-6 bg-[#121620] border border-white/[0.07] rounded-xl space-y-5 max-w-2xl text-xs">
          <div className="space-y-1.5">
            <h2 className="text-sm font-semibold text-white">Full Data Ownership & Export</h2>
            <p className="text-[#94A3B8] leading-relaxed">
              Export your complete workspace dataset—including platform snapshots, content registry, milestones, deliverables, insights, and verification logs—as portable JSON.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExportWorkspace}
              className="inline-flex items-center gap-1.5 px-4 py-2 font-medium text-white bg-[#3B82F6] hover:bg-[#2563EB] rounded-lg"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Full JSON Backup</span>
            </button>
            <button
              type="button"
              onClick={resetDemoData}
              className="inline-flex items-center gap-1.5 px-4 py-2 font-medium text-[#CBD5E1] hover:text-white bg-[#0B0E14] border border-white/[0.08] rounded-lg"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Workspace to Seed Baseline</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
