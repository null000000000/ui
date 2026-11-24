import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import type { SyncRun } from '../types/analytics';
import { formatShortTimestamp, SlideOverPanel, StatusText } from '../components/ui/Primitives';

export function SyncHistoryPage() {
  const { state, retrySyncRun, isSyncing } = useWorkspace();
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const activeRun: SyncRun | null =
    state.syncRuns.find((r) => r.id === selectedRunId) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-[#64748B]">
          Idempotent 8-stage ingestion pipeline logs · API failures never erase existing dashboard data
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-white mt-1">
          Sync History
        </h1>
      </div>

      <div className="border border-white/[0.07] rounded-xl bg-[#121620] overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-white/[0.07] text-[#64748B]">
              <th className="py-3 px-4 font-medium">Source</th>
              <th className="py-3 px-4 font-medium">Trigger</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Started / Completed</th>
              <th className="py-3 px-4 font-medium text-right">Records</th>
              <th className="py-3 px-4 font-medium text-right">Errors</th>
              <th className="py-3 px-4 font-medium text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {state.syncRuns.map((run) => (
              <tr key={run.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="py-3.5 px-4">
                  <button
                    type="button"
                    onClick={() => setSelectedRunId(run.id)}
                    className="font-medium text-[#EDF1F7] hover:text-[#60A5FA]"
                  >
                    {run.source}
                  </button>
                  <p className="font-mono text-[11px] text-[#64748B]">{run.id}</p>
                </td>
                <td className="py-3.5 px-4 text-[#94A3B8]">{run.trigger}</td>
                <td className="py-3.5 px-4">
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
                </td>
                <td className="py-3.5 px-4 font-mono tabular-nums text-[#94A3B8] whitespace-nowrap">
                  {formatShortTimestamp(run.startedAt)}
                </td>
                <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#EDF1F7]">
                  {run.recordsProcessed}
                  {run.recordsSkipped > 0 && (
                    <span className="text-[#64748B]"> ({run.recordsSkipped} skip)</span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#94A3B8]">
                  {run.errors.length}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => setSelectedRunId(run.id)}
                    className="text-[#60A5FA] hover:text-[#93C5FD]"
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sync Run Detail Panel (Spec 9.2) */}
      <SlideOverPanel
        open={Boolean(activeRun)}
        onClose={() => setSelectedRunId(null)}
        title={activeRun ? `Sync Run · ${activeRun.source}` : ''}
        subtitle={
          activeRun
            ? `${activeRun.id} · ${activeRun.trigger} · ${formatShortTimestamp(activeRun.startedAt)}`
            : undefined
        }
        footer={
          activeRun ? (
            <button
              type="button"
              disabled={isSyncing}
              onClick={() => {
                retrySyncRun(activeRun.id);
                setSelectedRunId(null);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-60 rounded-lg"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Sync</span>
            </button>
          ) : undefined
        }
      >
        {activeRun && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-3 gap-3 p-4 bg-[#121620] border border-white/[0.07] rounded-xl font-mono tabular-nums">
              <div>
                <p className="text-[#64748B]">Imported</p>
                <p className="text-lg font-semibold text-white mt-0.5">
                  {activeRun.recordsProcessed}
                </p>
              </div>
              <div>
                <p className="text-[#64748B]">Skipped</p>
                <p className="text-lg font-semibold text-[#CBD5E1] mt-0.5">
                  {activeRun.recordsSkipped}
                </p>
              </div>
              <div>
                <p className="text-[#64748B]">Errors</p>
                <p className="text-lg font-semibold text-[#F87171] mt-0.5">
                  {activeRun.errors.length}
                </p>
              </div>
            </div>

            {activeRun.errors.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-[#F87171]">Errors & Warnings</h3>
                {activeRun.errors.map((err) => (
                  <div
                    key={err.code}
                    className="p-3.5 bg-[#F87171]/[0.06] border border-[#F87171]/25 rounded-lg space-y-1"
                  >
                    <p className="font-mono text-[#F87171]">{err.code}</p>
                    <p className="text-[#CBD5E1]">{err.message}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2.5">
              <h3 className="font-semibold text-[#EDF1F7]">8-Stage Sync Lifecycle</h3>
              <div className="border border-white/[0.07] rounded-xl bg-[#121620] divide-y divide-white/[0.06]">
                {activeRun.stages.map((st, idx) => (
                  <div key={st.stage} className="p-3.5 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-[#EDF1F7]">
                        0{idx + 1}. {st.stage}
                      </p>
                      <p className="text-[#94A3B8] mt-0.5">{st.note}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <StatusText
                        label={st.status}
                        tone={
                          st.status === 'Completed'
                            ? 'positive'
                            : st.status === 'Failed'
                            ? 'danger'
                            : 'neutral'
                        }
                      />
                      <p className="font-mono text-[11px] text-[#64748B] tabular-nums mt-0.5">
                        {st.durationMs}ms
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </SlideOverPanel>
    </div>
  );
}
