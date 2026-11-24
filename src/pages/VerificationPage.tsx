import React from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { EmptyState, MetricTile, StatusText } from '../components/ui/Primitives';

export function VerificationPage() {
  const { state, navigate } = useWorkspace();

  const evaluated = state.recommendations.filter((r) => r.status === 'Evaluated');
  const running = state.recommendations.filter((r) => r.status === 'Running');
  const validatedCount = evaluated.filter((r) => r.conclusion === 'Validated').length;

  return (
    <div className="space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[#64748B]">
            Layer 4 Verification · Measures whether accepted recommendations produced verifiable uplift
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white mt-1">
            Verification
          </h1>
        </div>
        <button
          type="button"
          onClick={() => navigate('recommendations')}
          className="px-3.5 py-2 text-xs font-medium text-[#CBD5E1] bg-[#121620] border border-white/[0.08] rounded-lg hover:text-white whitespace-nowrap self-start sm:self-auto"
        >
          Manage Experiments →
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricTile label="Evaluated Experiments" value={evaluated.length} unit="count" />
        <MetricTile
          label="Validated Outcomes"
          value={validatedCount}
          unit="count"
          note={evaluated.length > 0 ? `${Math.round((validatedCount / evaluated.length) * 100)}% validation rate` : undefined}
        />
        <MetricTile label="Currently Running" value={running.length} unit="count" />
      </div>

      {evaluated.length === 0 ? (
        <EmptyState
          title="No evaluated experiments yet"
          description="Advance a running recommendation to Evaluated after its measurement period concludes to log its verified outcome here."
          actionLabel="Open Recommendations"
          onAction={() => navigate('recommendations')}
        />
      ) : (
        <div className="border border-white/[0.07] rounded-xl bg-[#121620] overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.07] text-[#64748B]">
                <th className="py-3 px-4 font-medium">Experiment</th>
                <th className="py-3 px-4 font-medium">Baseline</th>
                <th className="py-3 px-4 font-medium">Target</th>
                <th className="py-3 px-4 font-medium">Actual Result</th>
                <th className="py-3 px-4 font-medium">Difference</th>
                <th className="py-3 px-4 font-medium">Conclusion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {evaluated.map((rec) => (
                <tr key={rec.id} className="hover:bg-white/[0.02]">
                  <td className="py-3.5 px-4 max-w-sm">
                    <p className="font-medium text-[#EDF1F7]">{rec.title}</p>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      {rec.domain} · {rec.measurementPeriod}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 font-mono tabular-nums text-[#94A3B8]">
                    {rec.baselineValue}
                  </td>
                  <td className="py-3.5 px-4 font-mono tabular-nums text-[#CBD5E1]">
                    {rec.targetValue}
                  </td>
                  <td className="py-3.5 px-4 font-mono tabular-nums text-white">
                    {rec.actualResult ?? '—'}
                  </td>
                  <td className="py-3.5 px-4 font-mono tabular-nums text-[#CBD5E1]">
                    {rec.difference ?? '—'}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusText
                      label={rec.conclusion ?? 'Pending'}
                      tone={
                        rec.conclusion === 'Validated'
                          ? 'positive'
                          : rec.conclusion === 'Inconclusive'
                          ? 'warning'
                          : 'danger'
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
