import React, { useMemo, useState } from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { calculateMilestoneProgress, calculateSystemProgress, formatMetricValue } from '../lib/analyticsEngine';
import {
  EmptyState,
  MetricTile,
  SegmentedTabs,
  StatusText,
} from '../components/ui/Primitives';

type SystemTab =
  | 'overview'
  | 'architecture'
  | 'milestones'
  | 'deliverables'
  | 'repository'
  | 'quality'
  | 'activity'
  | 'time';

export function SystemsPage({ systemId }: { systemId: string | null }) {
  const { state, navigate, toggleDeliverableStatus, setQuickActionModal } = useWorkspace();
  const [activeTab, setActiveTab] = useState<SystemTab>('overview');

  if (systemId) {
    const system = state.systems.find((s) => s.id === systemId) ?? state.systems[0];
    const systemMilestones = state.milestones.filter((m) => m.systemId === system.id);
    const systemDeliverables = state.deliverables.filter((d) => d.systemId === system.id);
    const systemTime = state.timeEntries.filter((t) => t.systemId === system.id);
    const repo = state.repositories.find((r) => r.id === system.repositoryId);
    const progress = calculateSystemProgress(systemMilestones, state.deliverables);
    const totalPlanned = systemMilestones.reduce((acc, m) => acc + m.plannedHours, 0);
    const totalActual = systemMilestones.reduce((acc, m) => acc + m.actualHours, 0);

    return (
      <div className="space-y-7">
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => navigate('systems')}
            className="inline-flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Systems</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
                <span className="font-mono">{system.code}</span>
                <span aria-hidden="true">·</span>
                <StatusText
                  label={system.status}
                  tone={system.status === 'Active' ? 'accent' : 'neutral'}
                />
                <span aria-hidden="true">·</span>
                <span>{system.architectureStyle}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-white mt-1">
                {system.name} — {system.subtitle}
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setQuickActionModal('activity')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#EDF1F7] bg-[#121620] hover:bg-[#181E2B] border border-white/[0.08] rounded-lg whitespace-nowrap self-start sm:self-auto"
            >
              <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
              <span>Log Activity</span>
            </button>
          </div>
        </div>

        {/* Progressive 8-Section Tabs (Default = Overview Only) */}
        <SegmentedTabs
          ariaLabel={`${system.name} sections`}
          active={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'architecture', label: 'Architecture' },
            { id: 'milestones', label: 'Milestones', count: systemMilestones.length },
            { id: 'deliverables', label: 'Deliverables', count: systemDeliverables.length },
            { id: 'repository', label: 'Repository' },
            { id: 'quality', label: 'Quality' },
            { id: 'activity', label: 'Activity' },
            { id: 'time', label: 'Time Investment' },
          ]}
        />

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricTile
                label="Calculated Completion"
                value={progress.percentage}
                unit="percentage"
                source={progress.percentage !== null ? 'Calculated' : 'Not Calculated'}
                note={`${progress.completedDeliverables}/${progress.totalDeliverables} deliverables done`}
              />
              <MetricTile
                label="Milestones"
                value={progress.completedMilestones}
                unit="count"
                note={`of ${progress.totalMilestones} milestones completed`}
              />
              <MetricTile
                label="Actual Hours Logged"
                value={totalActual}
                unit="hours"
                note={`Planned: ${totalPlanned.toFixed(1)}h`}
              />
              <MetricTile
                label="Test Coverage"
                value={system.qualitySummary.testCoveragePct}
                unit="percentage"
                source={system.qualitySummary.testCoveragePct !== null ? 'CI' : 'Unavailable'}
              />
            </div>

            <div className="p-6 bg-[#121620] border border-white/[0.07] rounded-xl space-y-3">
              <h2 className="text-sm font-semibold text-[#EDF1F7]">System Brief</h2>
              <p className="text-sm text-[#CBD5E1] leading-relaxed max-w-3xl">
                {system.description}
              </p>
              <p className="text-xs text-[#64748B] pt-2">
                Stack: {system.stack.join(' · ')}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'architecture' && (
          <div className="p-6 bg-[#121620] border border-white/[0.07] rounded-xl space-y-4">
            <h2 className="text-sm font-semibold text-[#EDF1F7]">Architecture Decisions</h2>
            <p className="text-xs text-[#94A3B8]">{system.architectureStyle}</p>
            <ul className="space-y-2.5 text-sm text-[#CBD5E1] list-disc pl-5">
              {system.architectureNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'milestones' && (
          <div className="border border-white/[0.07] rounded-xl bg-[#121620] divide-y divide-white/[0.06]">
            {systemMilestones.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="No milestones defined yet"
                  description="Milestones will be planned once this system transitions from Planned to Active."
                />
              </div>
            ) : (
              systemMilestones.map((m) => {
                const mProg = calculateMilestoneProgress(
                  state.deliverables.filter((d) => d.milestoneId === m.id)
                );
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => navigate('milestone-detail', m.id)}
                    className="w-full text-left p-5 hover:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-white">
                        0{m.sequence}. {m.title}
                      </p>
                      <p className="text-xs text-[#94A3B8]">{m.objective}</p>
                    </div>
                    <div className="text-right shrink-0 font-mono tabular-nums text-xs">
                      <p className="text-[#EDF1F7]">
                        {mProg.percentage !== null ? `${mProg.percentage}%` : '—'}
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
              })
            )}
          </div>
        )}

        {activeTab === 'deliverables' && (
          <div className="border border-white/[0.07] rounded-xl bg-[#121620] divide-y divide-white/[0.06]">
            {systemDeliverables.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="No deliverables logged"
                  description="Deliverables drive automatic progress calculation once work begins."
                />
              </div>
            ) : (
              systemDeliverables.map((del) => (
                <div key={del.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <input
                      type="checkbox"
                      aria-label={`Toggle deliverable ${del.title}`}
                      checked={del.status === 'Completed'}
                      onChange={() => toggleDeliverableStatus(del.id)}
                      className="mt-1 accent-[#3B82F6] cursor-pointer"
                    />
                    <div className="min-w-0">
                      <p className="text-sm text-[#EDF1F7]">{del.title}</p>
                      <p className="text-xs text-[#64748B] font-mono mt-0.5">
                        {del.gitRef ?? 'No git ref yet'} · {del.testSummary ?? 'No tests linked'}
                      </p>
                    </div>
                  </div>
                  <StatusText
                    label={del.status}
                    tone={
                      del.status === 'Completed'
                        ? 'positive'
                        : del.status === 'Blocked'
                        ? 'danger'
                        : del.status === 'In Progress'
                        ? 'accent'
                        : 'neutral'
                    }
                  />
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'repository' && (
          <div className="p-6 bg-[#121620] border border-white/[0.07] rounded-xl space-y-4">
            {repo ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-white font-mono">{repo.name}</h2>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Default branch: {repo.defaultBranch} · {repo.commits30d} commits (30d)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('github')}
                    className="text-xs font-medium text-[#60A5FA] hover:text-[#93C5FD]"
                  >
                    Open GitHub view →
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                  <MetricTile label="Commits (30d)" value={repo.commits30d} unit="count" />
                  <MetricTile label="Merged PRs (30d)" value={repo.mergedPrs30d} unit="count" />
                  <MetricTile label="Open PRs" value={repo.openPrs} unit="count" />
                  <MetricTile label="Open Issues" value={repo.openIssues} unit="count" />
                </div>
              </>
            ) : (
              <EmptyState
                title="Repository not initialized"
                description="No GitHub repository is linked to this planned system yet."
              />
            )}
          </div>
        )}

        {activeTab === 'quality' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricTile
              label="Test Coverage"
              value={system.qualitySummary.testCoveragePct}
              unit="percentage"
            />
            <div className="p-5 bg-[#121620] border border-white/[0.07] rounded-xl">
              <p className="text-xs text-[#94A3B8]">Build Status</p>
              <p className="text-xl font-semibold text-white mt-3">
                {system.qualitySummary.buildPassing === null
                  ? '—'
                  : system.qualitySummary.buildPassing
                  ? 'Passing'
                  : 'Failing'}
              </p>
            </div>
            <MetricTile
              label="Documentation Completeness"
              value={system.qualitySummary.docsCompletenessPct}
              unit="percentage"
            />
            <MetricTile
              label="Open Tech Debt Items"
              value={system.qualitySummary.techDebtItems}
              unit="count"
            />
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="border border-white/[0.07] rounded-xl bg-[#121620] divide-y divide-white/[0.06]">
            {systemTime.length === 0 ? (
              <div className="p-6 text-xs text-[#64748B]">No engineering activity logged yet.</div>
            ) : (
              systemTime.map((entry) => (
                <div key={entry.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <p className="text-[#EDF1F7] font-medium">{entry.note}</p>
                    <p className="text-[#64748B] mt-0.5">{entry.activityType}</p>
                  </div>
                  <span className="font-mono tabular-nums text-[#CBD5E1]">
                    {entry.date} · {entry.hours.toFixed(1)}h
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'time' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricTile label="Planned Hours" value={totalPlanned} unit="hours" />
            <MetricTile label="Actual Hours Logged" value={totalActual} unit="hours" />
            <MetricTile
              label="Remaining Planned Budget"
              value={Math.max(0, totalPlanned - totalActual)}
              unit="hours"
            />
          </div>
        )}
      </div>
    );
  }

  // Systems List
  return (
    <div className="space-y-7">
      <div>
        <p className="text-xs text-[#64748B]">
          All software systems across your 18-Month Engineering Journey
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-white mt-1">Systems</h1>
      </div>

      <div className="space-y-4">
        {state.systems.map((sys) => {
          const sysMs = state.milestones.filter((m) => m.systemId === sys.id);
          const prog = calculateSystemProgress(sysMs, state.deliverables);
          const actualHours = sysMs.reduce((acc, m) => acc + m.actualHours, 0);

          return (
            <button
              key={sys.id}
              type="button"
              onClick={() => navigate('system-detail', sys.id)}
              className="w-full text-left p-6 bg-[#121620] border border-white/[0.07] hover:border-white/[0.16] rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-colors"
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2 text-xs text-[#64748B]">
                  <span className="font-mono">{sys.code}</span>
                  <span aria-hidden="true">·</span>
                  <StatusText
                    label={sys.status}
                    tone={sys.status === 'Active' ? 'accent' : 'neutral'}
                  />
                  <span aria-hidden="true">·</span>
                  <span>{sys.architectureStyle}</span>
                </div>
                <h2 className="text-lg font-semibold text-white">
                  {sys.name} — {sys.subtitle}
                </h2>
                <p className="text-xs text-[#94A3B8] leading-relaxed">{sys.description}</p>
              </div>

              <div className="grid grid-cols-3 gap-6 shrink-0 font-mono tabular-nums text-xs">
                <div>
                  <p className="text-[#64748B]">Completion</p>
                  <p className="text-base font-semibold text-white mt-1">
                    {formatMetricValue(prog.percentage, 'percentage')}
                  </p>
                </div>
                <div>
                  <p className="text-[#64748B]">Milestones</p>
                  <p className="text-base font-semibold text-white mt-1">
                    {prog.completedMilestones}/{prog.totalMilestones}
                  </p>
                </div>
                <div>
                  <p className="text-[#64748B]">Time Logged</p>
                  <p className="text-base font-semibold text-white mt-1">
                    {formatMetricValue(actualHours, 'hours')}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
