import React, { useMemo, useState } from 'react';
import { ArrowLeft, Clock, SlidersHorizontal } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  calculateMilestoneProgress,
  calculateTimeVariance,
  formatMetricValue,
} from '../lib/analyticsEngine';
import type { Deliverable } from '../types/analytics';
import {
  MetricTile,
  SlideOverPanel,
  StatusText,
} from '../components/ui/Primitives';

export function MilestonesPage({ milestoneId }: { milestoneId: string | null }) {
  const { state, navigate, toggleDeliverableStatus, setQuickActionModal } = useWorkspace();
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [systemFilter, setSystemFilter] = useState('all');

  // Detail View
  if (milestoneId) {
    const milestone =
      state.milestones.find((m) => m.id === milestoneId) ?? state.milestones[0];
    const system = state.systems.find((s) => s.id === milestone.systemId);
    const deliverables = state.deliverables.filter((d) => d.milestoneId === milestone.id);
    const progress = calculateMilestoneProgress(deliverables);
    const variance = calculateTimeVariance(milestone.plannedHours, milestone.actualHours);
    const linkedContent = state.contentItems.filter(
      (c) => milestone.linkedContentIds.includes(c.id) || c.milestoneIds.includes(milestone.id)
    );

    const activeDeliverable = selectedDeliverable
      ? state.deliverables.find((d) => d.id === selectedDeliverable.id) ?? null
      : null;

    return (
      <div className="space-y-8">
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => navigate('milestones')}
            className="inline-flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Milestones</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
                <span>
                  {system?.code} — {system?.name}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">Milestone 0{milestone.sequence}</span>
                <span aria-hidden="true">·</span>
                <StatusText
                  label={milestone.status}
                  tone={
                    milestone.status === 'Completed'
                      ? 'positive'
                      : milestone.status === 'Blocked'
                      ? 'danger'
                      : milestone.status === 'In Progress'
                      ? 'accent'
                      : 'neutral'
                  }
                />
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-white">
                {milestone.title}
              </h1>
              <p className="text-sm text-[#94A3B8] max-w-3xl leading-relaxed">
                {milestone.objective}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setQuickActionModal('activity')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#EDF1F7] bg-[#121620] hover:bg-[#181E2B] border border-white/[0.08] rounded-lg whitespace-nowrap self-start sm:self-auto"
            >
              <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
              <span>Log Time</span>
            </button>
          </div>
        </div>

        {/* Core Milestone Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricTile
            label="Calculated Progress"
            value={progress.percentage}
            unit="percentage"
            source={progress.source}
            note={`${progress.completed} of ${progress.total} deliverables completed`}
          />
          <MetricTile
            label="Planned vs Actual Time"
            value={milestone.actualHours}
            unit="hours"
            source="Manual"
            note={`Planned: ${milestone.plannedHours.toFixed(1)}h · ${variance.label}`}
          />
          <MetricTile
            label="GitHub Activity"
            value={milestone.githubCommits}
            unit="count"
            source="API"
            note={`${milestone.githubPrs} pull requests linked`}
          />
          <MetricTile
            label="Quality Review Score"
            value={milestone.qualityScore}
            unit="score"
            source={milestone.qualityScore !== null ? 'Review' : 'Not Reviewed'}
            note={milestone.qualityReviewNote ?? 'Pending milestone review'}
          />
        </div>

        {/* Interactive Deliverables List */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-[#EDF1F7]">Deliverables</h2>
              <p className="text-xs text-[#64748B]">
                Toggling a deliverable recalculates milestone and system progress automatically. Click a title to inspect tests and evidence.
              </p>
            </div>
          </div>

          <div className="border border-white/[0.07] rounded-xl bg-[#121620] divide-y divide-white/[0.06]">
            {deliverables.length === 0 ? (
              <p className="p-6 text-xs text-[#64748B]">No deliverables registered for this milestone yet.</p>
            ) : (
              deliverables.map((del) => (
                <div
                  key={del.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <input
                      type="checkbox"
                      aria-label={`Mark "${del.title}" as completed`}
                      checked={del.status === 'Completed'}
                      onChange={() => toggleDeliverableStatus(del.id)}
                      className="mt-1 accent-[#3B82F6] cursor-pointer"
                    />
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => setSelectedDeliverable(del)}
                        className={`text-sm font-medium text-left hover:text-[#60A5FA] transition-colors ${
                          del.status === 'Completed' ? 'text-[#94A3B8] line-through' : 'text-[#EDF1F7]'
                        }`}
                      >
                        {del.title}
                      </button>
                      <p className="text-xs text-[#64748B] font-mono mt-0.5">
                        {del.gitRef ?? 'No commit linked'} · {del.testSummary ?? 'No test summary'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
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
                    <button
                      type="button"
                      onClick={() => setSelectedDeliverable(del)}
                      className="text-xs text-[#60A5FA] hover:text-[#93C5FD] whitespace-nowrap"
                    >
                      Evidence →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Skills, Blockers, Linked Content & Separated AI Evaluation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 bg-[#121620] border border-white/[0.07] rounded-xl space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-[#EDF1F7]">Skills Covered</h2>
              <p className="text-xs text-[#CBD5E1] mt-2">
                {milestone.skillsCovered.join(' · ')}
              </p>
            </div>

            <div className="pt-4 border-t border-white/[0.06]">
              <h3 className="text-sm font-semibold text-[#EDF1F7]">Active Blockers</h3>
              {milestone.blockers.length === 0 ? (
                <p className="text-xs text-[#64748B] mt-1.5">No blockers recorded.</p>
              ) : (
                <ul className="mt-2 space-y-1.5 text-xs text-[#FBBF24] list-disc pl-4">
                  {milestone.blockers.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="pt-4 border-t border-white/[0.06]">
              <h3 className="text-sm font-semibold text-[#EDF1F7]">Linked Content</h3>
              {linkedContent.length === 0 ? (
                <p className="text-xs text-[#64748B] mt-1.5">No content published for this milestone yet.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {linkedContent.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => navigate('content-detail', c.id)}
                      className="block text-left text-xs text-[#60A5FA] hover:text-[#93C5FD]"
                    >
                      {c.title} ({c.format}) →
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-6 bg-[#121620] border border-white/[0.07] rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <h2 className="text-sm font-semibold text-[#EDF1F7]">AI Evaluation</h2>
              <span className="text-[#64748B]">Advisory only · Never mutates milestone status</span>
            </div>
            <p className="text-sm text-[#CBD5E1] leading-relaxed">
              {milestone.aiEvaluation ?? 'No AI evaluation available for this milestone yet.'}
            </p>
          </div>
        </div>

        {/* Deliverable Detail Slide-over Panel (Spec 5.3) */}
        <SlideOverPanel
          open={Boolean(activeDeliverable)}
          onClose={() => setSelectedDeliverable(null)}
          title={activeDeliverable?.title ?? ''}
          subtitle={activeDeliverable ? `Status: ${activeDeliverable.status}` : undefined}
        >
          {activeDeliverable && (
            <div className="space-y-6 text-xs">
              <div>
                <h3 className="font-semibold text-[#EDF1F7] mb-1.5">Evidence & Verification Note</h3>
                <p className="text-[#CBD5E1] leading-relaxed">{activeDeliverable.evidenceNote}</p>
              </div>
              <div>
                <h3 className="font-semibold text-[#EDF1F7] mb-1.5">Git Commit / Pull Request</h3>
                <p className="font-mono text-[#60A5FA]">
                  {activeDeliverable.gitRef ?? 'Not linked yet'}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#EDF1F7] mb-1.5">Test Results</h3>
                <p className="font-mono text-[#34D399]">
                  {activeDeliverable.testSummary ?? 'No test suite executed yet'}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#EDF1F7] mb-1.5">Linked Files</h3>
                {activeDeliverable.files.length === 0 ? (
                  <p className="text-[#64748B]">No files attached.</p>
                ) : (
                  <ul className="space-y-1 font-mono text-[#CBD5E1]">
                    {activeDeliverable.files.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-[#EDF1F7] mb-2">Review History</h3>
                {activeDeliverable.reviewHistory.length === 0 ? (
                  <p className="text-[#64748B]">No reviews logged yet.</p>
                ) : (
                  <div className="space-y-3">
                    {activeDeliverable.reviewHistory.map((rev, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#121620] border border-white/[0.07] rounded-lg space-y-1"
                      >
                        <div className="flex justify-between">
                          <span className="font-medium text-[#EDF1F7]">{rev.reviewer}</span>
                          <span className="font-mono text-[#64748B]">{rev.date}</span>
                        </div>
                        <StatusText
                          label={rev.outcome}
                          tone={rev.outcome === 'Approved' ? 'positive' : 'warning'}
                        />
                        <p className="text-[#CBD5E1] pt-1">{rev.note}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SlideOverPanel>
      </div>
    );
  }

  // Milestones List View
  const filteredMilestones = useMemo(() => {
    return state.milestones.filter((m) => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (systemFilter !== 'all' && m.systemId !== systemFilter) return false;
      return true;
    });
  }, [state.milestones, statusFilter, systemFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[#64748B]">
            Progress is calculated directly from completed Deliverables alongside Planned vs Actual duration
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white mt-1">Milestones</h1>
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#CBD5E1] bg-[#121620] border border-white/[0.08] rounded-lg whitespace-nowrap self-start sm:self-auto"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters</span>
        </button>
      </div>

      {filtersOpen && (
        <div className="p-4 bg-[#121620] border border-white/[0.08] rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="ms-sys-filter" className="block text-[11px] text-[#64748B] mb-1">
              System
            </label>
            <select
              id="ms-sys-filter"
              value={systemFilter}
              onChange={(e) => setSystemFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-[#0B0E14] border border-white/[0.08] rounded-md text-[#EDF1F7]"
            >
              <option value="all">All systems</option>
              {state.systems.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ms-status-filter" className="block text-[11px] text-[#64748B] mb-1">
              Status
            </label>
            <select
              id="ms-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-[#0B0E14] border border-white/[0.08] rounded-md text-[#EDF1F7]"
            >
              <option value="all">All statuses</option>
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
              <option value="Blocked">Blocked</option>
              <option value="Planned">Planned</option>
            </select>
          </div>
        </div>
      )}

      <div className="border border-white/[0.07] rounded-xl bg-[#121620] overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-white/[0.07] text-[#64748B]">
              <th className="py-3 px-4 font-medium">Milestone</th>
              <th className="py-3 px-4 font-medium">System</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium text-right">Progress (Calculated)</th>
              <th className="py-3 px-4 font-medium text-right">Actual / Planned</th>
              <th className="py-3 px-4 font-medium text-right">Review</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {filteredMilestones.map((m) => {
              const sys = state.systems.find((s) => s.id === m.systemId);
              const prog = calculateMilestoneProgress(
                state.deliverables.filter((d) => d.milestoneId === m.id)
              );
              return (
                <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => navigate('milestone-detail', m.id)}
                      className="font-medium text-[#EDF1F7] hover:text-[#60A5FA] text-left"
                    >
                      0{m.sequence}. {m.title}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-[#94A3B8] whitespace-nowrap">{sys?.name}</td>
                  <td className="py-3.5 px-4">
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
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#EDF1F7]">
                    {prog.percentage !== null
                      ? `${prog.percentage}% (${prog.completed}/${prog.total})`
                      : '—'}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#CBD5E1] whitespace-nowrap">
                    {m.actualHours.toFixed(1)}h / {m.plannedHours.toFixed(1)}h
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#94A3B8]">
                    {formatMetricValue(m.qualityScore, 'score')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
