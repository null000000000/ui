import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import type { AnalysisRun } from '../types/analytics';
import { formatShortTimestamp, StatusText } from '../components/ui/Primitives';

export function AnalysisRunsPage() {
  const { state, runIntelligenceAnalysis } = useWorkspace();
  const [selectedType, setSelectedType] =
    useState<AnalysisRun['analysisType']>('Full Intelligence Sweep');

  const handleRun = () => {
    const scope =
      selectedType === 'Brand Performance'
        ? 'All Connected Brand Platforms'
        : selectedType === 'Engineering Velocity'
        ? 'System 01 — ORBIT'
        : 'All Connected Platforms + System 01 (ORBIT)';
    runIntelligenceAnalysis(selectedType, scope);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[#64748B]">
            Stored AI analysis executions — results are persisted rather than recomputed on every page load
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white mt-1">
            Analysis Runs
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Select analysis type"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as AnalysisRun['analysisType'])}
            className="px-3 py-2 text-xs bg-[#121620] border border-white/[0.08] rounded-lg text-[#EDF1F7]"
          >
            <option value="Full Intelligence Sweep">Full Intelligence Sweep</option>
            <option value="Brand Performance">Brand Performance</option>
            <option value="Engineering Velocity">Engineering Velocity</option>
            <option value="Cross-Domain Correlation">Cross-Domain Correlation</option>
          </select>
          <button
            type="button"
            onClick={handleRun}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#3B82F6] hover:bg-[#2563EB] rounded-lg whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Run Analysis</span>
          </button>
        </div>
      </div>

      <div className="border border-white/[0.07] rounded-xl bg-[#121620] overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-white/[0.07] text-[#64748B]">
              <th className="py-3 px-4 font-medium">Run</th>
              <th className="py-3 px-4 font-medium">Scope</th>
              <th className="py-3 px-4 font-medium">Data Sources</th>
              <th className="py-3 px-4 font-medium">Result Summary</th>
              <th className="py-3 px-4 font-medium">Confidence</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium text-right">Executed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {state.analysisRuns.map((run) => (
              <tr key={run.id} className="hover:bg-white/[0.02]">
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <p className="font-medium text-[#EDF1F7]">{run.analysisType}</p>
                  <p className="font-mono text-[11px] text-[#64748B]">{run.id}</p>
                </td>
                <td className="py-3.5 px-4 text-[#CBD5E1]">{run.scope}</td>
                <td className="py-3.5 px-4 text-[#94A3B8]">{run.dataSources.join(' · ')}</td>
                <td className="py-3.5 px-4 text-[#CBD5E1] max-w-sm">{run.resultSummary}</td>
                <td className="py-3.5 px-4 text-[#CBD5E1]">{run.confidence}</td>
                <td className="py-3.5 px-4">
                  <StatusText
                    label={run.status}
                    tone={
                      run.status === 'Completed'
                        ? 'positive'
                        : run.status === 'Partial'
                        ? 'warning'
                        : 'danger'
                    }
                  />
                </td>
                <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#64748B] whitespace-nowrap">
                  {formatShortTimestamp(run.executedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
