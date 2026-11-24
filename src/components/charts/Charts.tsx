import React, { useState } from 'react';
import { formatMetricValue } from '../../lib/analyticsEngine';
import type { MetricUnit, TimeSeriesPoint } from '../../types/analytics';

interface TrendChartProps {
  data: TimeSeriesPoint[];
  unit: MetricUnit;
  primaryLabel: string;
  secondaryLabel?: string;
  secondaryUnit?: MetricUnit;
  height?: number;
  accentColor?: string;
  secondaryColor?: string;
  emptyMessage?: string;
}

/**
 * Responsive interactive SVG Trend Chart with hover crosshair inspection.
 * Preserves heterogeneous metric units by scaling optional secondary series independently.
 */
export function TrendChart({
  data,
  unit,
  primaryLabel,
  secondaryLabel,
  secondaryUnit = 'percentage',
  height = 240,
  accentColor = '#3B82F6',
  secondaryColor = '#34D399',
  emptyMessage = 'No observations recorded for this period yet.',
}: TrendChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const validPrimary = data
    .map((d, i) => ({ ...d, i }))
    .filter((d) => d.value !== null && !Number.isNaN(d.value));

  if (validPrimary.length === 0) {
    return (
      <div
        className="flex items-center justify-center border border-dashed border-white/[0.08] rounded-xl bg-[#0F131C]/60 text-xs text-[#64748B]"
        style={{ height }}
      >
        {emptyMessage}
      </div>
    );
  }

  const width = 760;
  const padTop = 20;
  const padRight = 18;
  const padBottom = 32;
  const padLeft = 56;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const primaryVals = validPrimary.map((d) => d.value as number);
  const minVal = Math.min(...primaryVals);
  const maxVal = Math.max(...primaryVals);
  const span = maxVal - minVal || Math.max(maxVal, 1);
  const yMin = Math.max(0, minVal - span * 0.15);
  const yMax = maxVal + span * 0.15;

  const getX = (idx: number) => {
    if (data.length <= 1) return padLeft + chartW / 2;
    return padLeft + (idx / (data.length - 1)) * chartW;
  };

  const getY = (val: number) => {
    const ratio = (val - yMin) / (yMax - yMin || 1);
    return padTop + chartH - ratio * chartH;
  };

  const linePath = validPrimary
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(pt.i).toFixed(1)} ${getY(pt.value as number).toFixed(1)}`)
    .join(' ');

  const areaPath =
    validPrimary.length > 1
      ? `${linePath} L ${getX(validPrimary[validPrimary.length - 1].i).toFixed(1)} ${(padTop + chartH).toFixed(1)} L ${getX(validPrimary[0].i).toFixed(1)} ${(padTop + chartH).toFixed(1)} Z`
      : '';

  const validSecondary = secondaryLabel
    ? data
        .map((d, i) => ({ ...d, i }))
        .filter((d) => d.secondaryValue !== null && d.secondaryValue !== undefined)
    : [];

  let secondaryPath = '';
  let getSecondaryY: ((v: number) => number) | null = null;
  if (validSecondary.length > 1) {
    const secVals = validSecondary.map((d) => d.secondaryValue as number);
    const sMin = Math.max(0, Math.min(...secVals) - 5);
    const sMax = Math.max(...secVals) + 5;
    getSecondaryY = (v: number) => padTop + chartH - ((v - sMin) / (sMax - sMin || 1)) * chartH;
    secondaryPath = validSecondary
      .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(pt.i).toFixed(1)} ${getSecondaryY!(pt.secondaryValue as number).toFixed(1)}`)
      .join(' ');
  }

  const ticks = [0, 0.33, 0.66, 1].map((r) => yMin + r * (yMax - yMin));
  const activePoint = hoveredIdx !== null ? data[hoveredIdx] : data[data.length - 1];
  const activeIndex = hoveredIdx !== null ? hoveredIdx : data.length - 1;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 text-[#94A3B8]">
          <span className="inline-flex items-center gap-2">
            <span className="w-2.5 h-0.5 rounded-full" style={{ backgroundColor: accentColor }} />
            <span>{primaryLabel}</span>
          </span>
          {secondaryLabel && validSecondary.length > 1 && (
            <span className="inline-flex items-center gap-2">
              <span className="w-2.5 h-0.5 rounded-full" style={{ backgroundColor: secondaryColor }} />
              <span>{secondaryLabel}</span>
            </span>
          )}
        </div>
        {activePoint && (
          <div className="flex items-center gap-3 font-mono tabular-nums text-[#CBD5E1]">
            <span className="text-[#64748B]">{activePoint.label}</span>
            <span>{formatMetricValue(activePoint.value, unit)}</span>
            {secondaryLabel && activePoint.secondaryValue !== undefined && activePoint.secondaryValue !== null && (
              <span style={{ color: secondaryColor }}>
                {formatMetricValue(activePoint.secondaryValue, secondaryUnit)}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto block select-none"
          role="img"
          aria-label={`${primaryLabel} trend visualization`}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            <linearGradient id={`area-${primaryLabel.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.20" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          {ticks.map((tick, idx) => {
            const y = getY(tick);
            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="#64748B"
                  fontSize="10.5"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {unit === 'count' && tick >= 1000
                    ? `${(tick / 1000).toFixed(1)}k`
                    : unit === 'percentage'
                    ? `${tick.toFixed(0)}%`
                    : Math.round(tick).toString()}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          {areaPath && (
            <path d={areaPath} fill={`url(#area-${primaryLabel.replace(/\s+/g, '')})`} />
          )}

          {/* Secondary series */}
          {secondaryPath && (
            <path
              d={secondaryPath}
              fill="none"
              stroke={secondaryColor}
              strokeWidth="1.75"
              strokeDasharray="4 4"
              strokeLinecap="round"
            />
          )}

          {/* Primary series */}
          <path
            d={linePath}
            fill="none"
            stroke={accentColor}
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Active vertical guide */}
          {activePoint && activePoint.value !== null && (
            <g>
              <line
                x1={getX(activeIndex)}
                y1={padTop}
                x2={getX(activeIndex)}
                y2={padTop + chartH}
                stroke="rgba(148,163,184,0.22)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <circle
                cx={getX(activeIndex)}
                cy={getY(activePoint.value)}
                r="4"
                fill="#0B0E14"
                stroke={accentColor}
                strokeWidth="2.2"
              />
            </g>
          )}

          {/* X-axis labels */}
          {data.map((pt, idx) => {
            const showLabel =
              data.length <= 8 || idx === 0 || idx === data.length - 1 || idx % 2 === 0;
            return (
              <g key={pt.date + idx}>
                {showLabel && (
                  <text
                    x={getX(idx)}
                    y={height - 8}
                    textAnchor="middle"
                    fill={idx === activeIndex ? '#CBD5E1' : '#64748B'}
                    fontSize="10.5"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {pt.label}
                  </text>
                )}
                {/* Invisible hover hit columns */}
                <rect
                  x={getX(idx) - chartW / Math.max(data.length * 2, 2)}
                  y={padTop}
                  width={chartW / Math.max(data.length, 1)}
                  height={chartH}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIdx(idx)}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/**
 * Clean horizontal bar breakdown preserving exact numeric alignment.
 */
export function HorizontalBarList({
  items,
  unit = 'count',
  barColor = '#3B82F6',
}: {
  items: { label: string; value: number | null; meta?: string }[];
  unit?: MetricUnit;
  barColor?: string;
}) {
  const numericValues = items
    .map((i) => i.value)
    .filter((v): v is number => v !== null && !Number.isNaN(v));
  const max = Math.max(...numericValues, 1);

  return (
    <div className="space-y-3.5">
      {items.map((item) => {
        const pct = item.value !== null ? Math.min(100, Math.max(2, (item.value / max) * 100)) : 0;
        return (
          <div key={item.label} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[#EDF1F7] font-medium truncate">{item.label}</span>
                {item.meta && <span className="text-[#64748B] truncate">{item.meta}</span>}
              </div>
              <span className="font-mono tabular-nums text-[#CBD5E1] shrink-0">
                {formatMetricValue(item.value, unit)}
              </span>
            </div>
            <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${pct}%`, backgroundColor: item.value !== null ? barColor : 'transparent' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
