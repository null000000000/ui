import React, { useMemo, useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import type { Deliverable } from '../types/analytics';
import { SegmentedTabs, SlideOverPanel, StatusText } from '../components/ui/Primitives';

export function DeliverablesPage() {
  const { state, toggleDeliverableStatus, navigate } = useWorkspace();
  const [statusFilter, setStatusFilter] = useState<'all' | 'Completed' | 'In Progress' | 'Blocked'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return state.deliverables;
    return state.deliverables.filter((d) => d.status === statusFilter);
  }, [state.deliverables, statusFilter]);

  const activeDeliverable: Deliverable | null =
    state.deliverables.find((d) => d.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[#64748B]">
            Granular engineering outputs driving calculated milestone completion
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white mt-1">Deliverables</h1>
        </div>

        <SegmentedTabs
          ariaLabel="Filter deliverables by status"
          active={statusFilter}
          onChange={setStatusFilter}
          tabs={[
            { id: 'all', label: 'All', count: state.deliverables.length },
            {
              id: 'Completed',
              label: 'Completed',
              count: state.deliverables.filter((d) => d.status === 'Completed').length,
            },
            {
              id: 'In Progress',
              label: 'In Progress',
              count: state.deliverables.filter((d) => d.status === 'In Progress').length,
            },
            {
              id: 'Blocked',
              label: 'Blocked',
              count: state.deliverables.filter((d) => d.status === 'Blocked').length,
            },
          ]}
        />
      </div>

      <div className="border border-white/[0.07] rounded-xl bg-[#121620] overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-white/[0.07] text-[#64748B]">
              <th className="py-3 px-4 font-medium w-10">Done</th>
              <th className="py-3 px-4 font-medium">Deliverable</th>
              <th className="py-3 px-4 font-medium">Milestone</th>
              <th className="py-3 px-4 font-medium">Git Ref</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {filtered.map((del) => {
              const ms = state.milestones.find((m) => m.id === del.milestoneId);
              return (
                <tr key={del.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4">
                    <input
                      type="checkbox"
                      aria-label={`Toggle ${del.title}`}
                      checked={del.status === 'Completed'}
                      onChange={() => toggleDeliverableStatus(del.id)}
                      className="accent-[#3B82F6] cursor-pointer"
                    />
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => setSelectedId(del.id)}
                      className="font-medium text-[#EDF1F7] hover:text-[#60A5FA] text-left"
                    >
                      {del.title}
                    </button>
                  </td>
                  <td className="py-3.5 px-4">
                    {ms ? (
                      <button
                        type="button"
                        onClick={() => navigate('milestone-detail', ms.id)}
                        className="text-[#94A3B8] hover:text-white whitespace-nowrap"
                      >
                        M0{ms.sequence} — {ms.title}
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#94A3B8] whitespace-nowrap">
                    {del.gitRef ?? '—'}
                  </td>
                  <td className="py-3.5 px-4">
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
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedId(del.id)}
                      className="text-[#60A5FA] hover:text-[#93C5FD]"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <SlideOverPanel
        open={Boolean(activeDeliverable)}
        onClose={() => setSelectedId(null)}
        title={activeDeliverable?.title ?? ''}
        subtitle={
          activeDeliverable
            ? `Status: ${activeDeliverable.status}${
                activeDeliverable.completedAt ? ` · Completed ${activeDeliverable.completedAt}` : ''
              }`
            : undefined
        }
      >
        {activeDeliverable && (
          <div className="space-y-5 text-xs">
            <div>
              <h3 className="font-semibold text-[#EDF1F7] mb-1">Evidence</h3>
              <p className="text-[#CBD5E1] leading-relaxed">{activeDeliverable.evidenceNote}</p>
            </div>
            <div>
              <h3 className="font-semibold text-[#EDF1F7] mb-1">Linked Files</h3>
              {activeDeliverable.files.length === 0 ? (
                <p className="text-[#64748B]">No files recorded.</p>
              ) : (
                <ul className="space-y-1 font-mono text-[#CBD5E1]">
                  {activeDeliverable.files.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-[#EDF1F7] mb-1">Git Commit / PR</h3>
              <p className="font-mono text-[#60A5FA]">{activeDeliverable.gitRef ?? '—'}</p>
            </div>
            <div>
              <h3 className="font-semibold text-[#EDF1F7] mb-1">Test Results</h3>
              <p className="font-mono text-[#34D399]">
                {activeDeliverable.testSummary ?? 'No automated test summary attached'}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[#EDF1F7] mb-2">Review History</h3>
              {activeDeliverable.reviewHistory.length === 0 ? (
                <p className="text-[#64748B]">No reviews recorded yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {activeDeliverable.reviewHistory.map((r, i) => (
                    <div
                      key={i}
                      className="p-3 bg-[#121620] border border-white/[0.07] rounded-lg space-y-1"
                    >
                      <div className="flex justify-between">
                        <span className="font-medium text-[#EDF1F7]">{r.reviewer}</span>
                        <span className="font-mono text-[#64748B]">{r.date}</span>
                      </div>
                      <StatusText
                        label={r.outcome}
                        tone={r.outcome === 'Approved' ? 'positive' : 'warning'}
                      />
                      <p className="text-[#CBD5E1]">{r.note}</p>
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
