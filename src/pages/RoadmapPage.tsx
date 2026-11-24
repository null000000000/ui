import React, { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { calculateSystemProgress } from '../lib/analyticsEngine';
import { MetricTile, ProgressiveSection, StatusText } from '../components/ui/Primitives';

export function RoadmapPage() {
  const { state, navigate } = useWorkspace();
  const [showHistory, setShowHistory] = useState(false);

  const activeSystem = state.systems.find((s) => s.status === 'Active') ?? state.systems[0];
  const overallProgress = useMemo(
    () => calculateSystemProgress(state.milestones, state.deliverables),
    [state.milestones, state.deliverables]
  );

  const activeSystemProgress = useMemo(() => {
    const ms = state.milestones.filter((m) => m.systemId === activeSystem.id);
    return calculateSystemProgress(ms, state.deliverables);
  }, [state.milestones, state.deliverables, activeSystem.id]);

  const blockedMilestones = state.milestones.filter(
    (m) => m.status === 'Blocked' || m.blockers.length > 0
  );

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-[#64748B]">18-Month Engineering Journey</p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-white mt-1">
          Engineering Roadmap
        </h1>
      </div>

      {/* Active System Spotlight (Matching Spec Wireframe) */}
      <section className="p-6 sm:p-7 bg-[#121620] border border-white/[0.07] rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <StatusText label="Current System" tone="accent" />
            <span aria-hidden="true">·</span>
            <span>{activeSystem.code}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {activeSystem.startDate} → {activeSystem.targetEndDate}
            </span>
          </div>
          <h2 className="text-3xl font-semibold text-white tracking-tight">
            {activeSystem.name}
          </h2>
          <p className="text-sm text-[#94A3B8] leading-relaxed">
            {activeSystem.subtitle} — {activeSystem.description}
          </p>
          <p className="text-xs text-[#CBD5E1] font-mono tabular-nums pt-1">
            Completion:{' '}
            {activeSystemProgress.percentage !== null
              ? `${activeSystemProgress.percentage}% (${activeSystemProgress.completedDeliverables}/${activeSystemProgress.totalDeliverables} deliverables · Calculated)`
              : 'Not yet calculated'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => navigate('system-detail', activeSystem.id)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#3B82F6] hover:bg-[#2563EB] rounded-lg transition-colors whitespace-nowrap"
          >
            <span>Open {activeSystem.name}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => navigate('milestones')}
            className="px-4 py-2 text-xs font-medium text-[#CBD5E1] hover:text-white bg-[#0B0E14] border border-white/[0.08] rounded-lg transition-colors whitespace-nowrap"
          >
            Milestones
          </button>
        </div>
      </section>

      {/* Top Roadmap KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricTile
          label="Overall Roadmap Completion"
          value={overallProgress.percentage}
          unit="percentage"
          source="Calculated"
          note={`${overallProgress.completedDeliverables} of ${overallProgress.totalDeliverables} tracked deliverables`}
        />
        <MetricTile
          label="Milestones Completed"
          value={overallProgress.completedMilestones}
          unit="count"
          source="Calculated"
          note={`Out of ${overallProgress.totalMilestones} defined milestones`}
        />
        <MetricTile
          label="Blocked / Attention Milestones"
          value={blockedMilestones.length}
          unit="count"
          source="Tracked"
          note={blockedMilestones.length > 0 ? 'Requires blocker resolution' : 'No active blockers'}
        />
      </div>

      {/* Systems Timeline */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#EDF1F7]">Systems Timeline</h2>
          <button
            type="button"
            onClick={() => navigate('systems')}
            className="text-xs font-medium text-[#60A5FA] hover:text-[#93C5FD]"
          >
            View all →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {state.systems.map((sys) => {
            const sysMs = state.milestones.filter((m) => m.systemId === sys.id);
            const prog = calculateSystemProgress(sysMs, state.deliverables);
            return (
              <button
                key={sys.id}
                type="button"
                onClick={() => navigate('system-detail', sys.id)}
                className="text-left p-5 bg-[#121620] border border-white/[0.07] hover:border-white/[0.16] rounded-xl space-y-3 transition-colors"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[#64748B]">{sys.code}</span>
                  <StatusText
                    label={sys.status}
                    tone={
                      sys.status === 'Active'
                        ? 'accent'
                        : sys.status === 'Completed'
                        ? 'positive'
                        : 'neutral'
                    }
                  />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">{sys.name}</h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5">{sys.subtitle}</p>
                </div>
                <div className="pt-2 space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono tabular-nums text-[#94A3B8]">
                    <span>Progress</span>
                    <span>{prog.percentage !== null ? `${prog.percentage}%` : 'Not calculated'}</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#3B82F6] rounded-full"
                      style={{ width: `${prog.percentage ?? 0}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Delayed / Blocked Milestones */}
      {blockedMilestones.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[#EDF1F7]">Delayed & Blocked Milestones</h2>
          <div className="border border-white/[0.07] rounded-xl bg-[#121620] divide-y divide-white/[0.06]">
            {blockedMilestones.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => navigate('milestone-detail', m.id)}
                className="w-full text-left p-4 hover:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-medium text-[#EDF1F7]">
                    M0{m.sequence}. {m.title}
                  </p>
                  <p className="text-xs text-[#FBBF24] mt-0.5">{m.blockers[0]}</p>
                </div>
                <StatusText
                  label={m.status}
                  tone={m.status === 'Blocked' ? 'danger' : 'warning'}
                />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Progressive Roadmap History */}
      <ProgressiveSection
        title="Roadmap History"
        summary="Completed milestones and engineering time log"
        expanded={showHistory}
        onToggle={() => setShowHistory((v) => !v)}
        actionLabel="Show roadmap history"
      >
        <div className="border border-white/[0.07] rounded-xl bg-[#121620] divide-y divide-white/[0.06]">
          {state.timeEntries.map((entry) => {
            const ms = state.milestones.find((m) => m.id === entry.milestoneId);
            return (
              <div key={entry.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                <div>
                  <p className="text-[#EDF1F7] font-medium">{entry.note}</p>
                  <p className="text-[#64748B] mt-0.5">
                    {ms ? `M0${ms.sequence} · ${ms.title}` : entry.milestoneId} · {entry.activityType}
                  </p>
                </div>
                <div className="text-right font-mono tabular-nums shrink-0">
                  <p className="text-[#EDF1F7]">{entry.hours.toFixed(1)}h</p>
                  <p className="text-[#64748B]">{entry.date}</p>
                </div>
              </div>
            );
          })}
        </div>
      </ProgressiveSection>
    </div>
  );
}
