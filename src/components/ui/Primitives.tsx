import React from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { formatDelta, formatMetricValue } from '../../lib/analyticsEngine';
import type { MetricUnit } from '../../types/analytics';

/**
 * Clean unboxed semantic status text — adheres to Zero-Pill discipline
 * and pairs color with explicit label text (never hue-only).
 */
export function StatusText({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'positive' | 'warning' | 'danger' | 'accent';
}) {
  const toneClass: Record<typeof tone, string> = {
    neutral: 'text-[#94A3B8]',
    positive: 'text-[#34D399]',
    warning: 'text-[#FBBF24]',
    danger: 'text-[#F87171]',
    accent: 'text-[#60A5FA]',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${toneClass[tone]}`}>
      {label}
    </span>
  );
}

/**
 * Single-elevation metric display tile.
 * Strictly renders tabular numbers and '—' for null/unavailable values (No Fake Metrics).
 */
export function MetricTile({
  label,
  value,
  unit,
  deltaPct,
  source,
  note,
  onClick,
  emphasized = false,
}: {
  label: string;
  value: number | null | undefined;
  unit: MetricUnit;
  deltaPct?: number | null;
  source?: string;
  note?: string;
  onClick?: () => void;
  emphasized?: boolean;
}) {
  const formatted = formatMetricValue(value, unit);
  const deltaText = deltaPct !== undefined ? formatDelta(deltaPct) : null;
  const deltaTone =
    deltaPct === null || deltaPct === undefined
      ? 'text-[#64748B]'
      : deltaPct > 0
      ? 'text-[#34D399]'
      : deltaPct < 0
      ? 'text-[#F87171]'
      : 'text-[#94A3B8]';

  const content = (
    <div className="flex flex-col justify-between gap-3 h-full">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-[#94A3B8] truncate">{label}</span>
        {source && (
          <span className="text-[11px] text-[#64748B] font-mono whitespace-nowrap shrink-0">
            {source}
          </span>
        )}
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <span
          className={`font-mono tabular-nums tracking-tight ${
            emphasized ? 'text-3xl font-semibold text-[#F8FAFC]' : 'text-2xl font-semibold text-[#EDF1F7]'
          }`}
        >
          {formatted}
        </span>
        {deltaText && (
          <span className={`text-xs font-mono tabular-nums whitespace-nowrap ${deltaTone}`}>
            {deltaText}
          </span>
        )}
      </div>
      {note && <p className="text-xs text-[#64748B] leading-snug">{note}</p>}
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left p-5 bg-[#121620] border border-white/[0.07] rounded-xl hover:border-white/[0.16] hover:bg-[#151B27] transition-colors focus-visible:outline-2 focus-visible:outline-[#3B82F6]"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="p-5 bg-[#121620] border border-white/[0.07] rounded-xl">
      {content}
    </div>
  );
}

/**
 * Progressive Disclosure wrapper: keeps secondary analytical layers collapsed
 * by default until the user explicitly requests them.
 */
export function ProgressiveSection({
  title,
  summary,
  expanded,
  onToggle,
  children,
  actionLabel = 'Expand details',
  collapseLabel = 'Hide details',
}: {
  title: string;
  summary?: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  actionLabel?: string;
  collapseLabel?: string;
}) {
  return (
    <section className="border-t border-white/[0.07] pt-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-[#EDF1F7]">{title}</h2>
          {summary && <p className="text-xs text-[#64748B] mt-0.5">{summary}</p>}
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#CBD5E1] hover:text-white bg-[#121620] hover:bg-[#181E2B] border border-white/[0.08] rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <span>{expanded ? collapseLabel : actionLabel}</span>
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
      </div>
      {expanded && <div className="mt-5">{children}</div>}
    </section>
  );
}

/**
 * Clean segmented interactive tab control (functional <button> elements).
 */
export function SegmentedTabs<T extends string>({
  tabs,
  active,
  onChange,
  ariaLabel = 'Section tabs',
}: {
  tabs: { id: T; label: string; count?: number }[];
  active: T;
  onChange: (id: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-0.5 sm:gap-1 p-1 bg-[#121620] border border-white/[0.07] rounded-lg overflow-x-auto max-w-full"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              isActive
                ? 'bg-[#1F2737] text-white'
                : 'text-[#94A3B8] hover:text-[#EDF1F7]'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 font-mono text-[11px] text-[#64748B] tabular-nums">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Slide-over detail layer for progressive inspection without losing page context.
 */
export function SlideOverPanel({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Close detail panel backdrop"
        onClick={onClose}
        className="flex-1 cursor-default"
      />
      <div className="w-full max-w-xl bg-[#0F131C] border-l border-white/[0.09] h-full flex flex-col shadow-2xl">
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-white/[0.07]">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-white leading-snug">{title}</h2>
            {subtitle && <p className="text-xs text-[#94A3B8] mt-1">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="p-2 text-[#94A3B8] hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-white/[0.07] bg-[#0B0E14]/80 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="p-10 border border-dashed border-white/[0.1] rounded-xl text-center bg-[#121620]/50">
      <h3 className="text-sm font-semibold text-[#EDF1F7]">{title}</h3>
      <p className="text-xs text-[#94A3B8] mt-1.5 max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 px-4 py-2 text-xs font-medium text-white bg-[#3B82F6] hover:bg-[#2563EB] rounded-lg transition-colors whitespace-nowrap"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function SectionDividerHeader({
  title,
  meta,
  action,
}: {
  title: string;
  meta?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.07]">
      <div className="flex items-baseline gap-2.5">
        <h2 className="text-sm font-semibold text-[#EDF1F7]">{title}</h2>
        {meta && <span className="text-xs text-[#64748B]">{meta}</span>}
      </div>
      {action}
    </div>
  );
}

export function formatShortTimestamp(iso: string | null): string {
  if (!iso) return 'Never synced';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
