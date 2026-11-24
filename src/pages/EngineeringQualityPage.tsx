import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { formatMetricValue } from '../lib/analyticsEngine';
import { TrendChart } from '../components/charts/Charts';
import { formatShortTimestamp, MetricTile, StatusText } from '../components/ui/Primitives';

export function EngineeringQualityPage() {
  const { state } = useWorkspace();
  const [selectedMetricId, setSelectedMetricId] = useState(state.qualityMetrics[0].id);

  const activeMetric =
    state.qualityMetrics.find((m) => m.id === selectedMetricId) ?? state.qualityMetrics[0];

  return (
    <div className="space-y-7">
      <div>
        <p className="text-xs text-[#64748B]">
          Explicitly defined quality indicators — GitHub commit count is never treated as proof of engineering quality
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-white mt-1">
          Engineering Quality
        </h1>
      </div>

      {/* Primary Quality KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {state.qualityMetrics.slice(0, 4).map((qm) => (
          <MetricTile
            key={qm.id}
            label={qm.name}
            value={qm.value}
            unit={qm.unit}
            source={qm.status}
            note={`Target: ${qm.target}`}
            onClick={() => setSelectedMetricId(qm.id)}
          />
        ))}
      </div>

      {/* Selected Quality Metric Trend & Definition */}
      <section className="p-6 bg-[#121620] border border-white/[0.07] rounded-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs">
              <h2 className="text-sm font-semibold text-white">{activeMetric.name} — Trend</h2>
              <StatusText
                label={activeMetric.status}
                tone={
                  activeMetric.status === 'Healthy'
                    ? 'positive'
                    : activeMetric.status === 'Watch'
                    ? 'warning'
                    : 'danger'
                }
              />
            </div>
            <p className="text-xs text-[#94A3B8] mt-1">{activeMetric.measurementMethod}</p>
          </div>
          <span className="text-xs font-mono text-[#64748B] shrink-0">
            Target: {activeMetric.target}
          </span>
        </div>

        <TrendChart
          data={activeMetric.trend}
          unit={activeMetric.unit}
          primaryLabel={activeMetric.name}
          accentColor="#3B82F6"
          height={220}
        />
      </section>

      {/* Complete Quality Dimensions Table */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[#EDF1F7]">All Quality Dimensions & Definitions</h2>
        <div className="border border-white/[0.07] rounded-xl bg-[#121620] overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.07] text-[#64748B]">
                <th className="py-3 px-4 font-medium">Dimension</th>
                <th className="py-3 px-4 font-medium">Measurement Method</th>
                <th className="py-3 px-4 font-medium text-right">Current</th>
                <th className="py-3 px-4 font-medium text-right">Target</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Evaluated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {state.qualityMetrics.map((qm) => (
                <tr
                  key={qm.id}
                  className={`hover:bg-white/[0.02] transition-colors ${
                    qm.id === selectedMetricId ? 'bg-[#3B82F6]/[0.06]' : ''
                  }`}
                >
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => setSelectedMetricId(qm.id)}
                      className="font-medium text-[#EDF1F7] hover:text-[#60A5FA] text-left"
                    >
                      {qm.name}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-[#94A3B8] max-w-md">{qm.measurementMethod}</td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#EDF1F7] whitespace-nowrap">
                    {formatMetricValue(qm.value, qm.unit)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-[#64748B] whitespace-nowrap">
                    {qm.target}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusText
                      label={qm.status}
                      tone={
                        qm.status === 'Healthy'
                          ? 'positive'
                          : qm.status === 'Watch'
                          ? 'warning'
                          : 'danger'
                      }
                    />
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#64748B] whitespace-nowrap">
                    {formatShortTimestamp(qm.lastEvaluatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
