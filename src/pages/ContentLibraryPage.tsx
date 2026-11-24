import React, { useMemo, useState } from 'react';
import { Columns3, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { filterContentItems, formatMetricValue } from '../lib/analyticsEngine';
import type { PlatformId } from '../types/analytics';
import { EmptyState, StatusText } from '../components/ui/Primitives';

export function ContentLibraryPage() {
  const { state, navigate, setQuickActionModal } = useWorkspace();

  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);

  const [formatFilter, setFormatFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState<PlatformId | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const [milestoneFilter, setMilestoneFilter] = useState('all');

  const [extraColumns, setExtraColumns] = useState({
    topics: false,
    milestone: false,
    created: false,
  });

  const allTopics = useMemo(
    () => Array.from(new Set(state.contentItems.flatMap((c) => c.topics))).sort(),
    [state.contentItems]
  );

  const filteredItems = useMemo(
    () =>
      filterContentItems(state.contentItems, {
        query,
        format: formatFilter,
        platform: platformFilter,
        status: statusFilter,
        topic: topicFilter,
        milestoneId: milestoneFilter,
      }),
    [state.contentItems, query, formatFilter, platformFilter, statusFilter, topicFilter, milestoneFilter]
  );

  const activeFiltersCount = [
    formatFilter !== 'all',
    platformFilter !== 'all',
    statusFilter !== 'all',
    topicFilter !== 'all',
    milestoneFilter !== 'all',
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[#64748B]">
            Central Content Registry · Content items remain separated from platform publications
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white mt-1">
            Content Library
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setQuickActionModal('content')}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#3B82F6] hover:bg-[#2563EB] rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Content</span>
        </button>
      </div>

      {/* Minimal Search + Hidden-by-Default Filters & Columns */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search content items"
            placeholder="Search by title, topic, or description..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-[#121620] border border-white/[0.08] rounded-lg text-white placeholder:text-[#64748B] focus:border-[#3B82F6] focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
            filtersOpen || activeFiltersCount > 0
              ? 'bg-[#3B82F6]/15 border-[#3B82F6]/40 text-[#60A5FA]'
              : 'bg-[#121620] border-white/[0.08] text-[#CBD5E1] hover:text-white'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}</span>
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setColumnsOpen((v) => !v)}
            aria-expanded={columnsOpen}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-[#121620] border border-white/[0.08] text-[#CBD5E1] hover:text-white rounded-lg transition-colors whitespace-nowrap"
          >
            <Columns3 className="w-3.5 h-3.5" />
            <span>Columns</span>
          </button>
          {columnsOpen && (
            <div className="absolute right-0 mt-1.5 w-48 p-3 bg-[#121620] border border-white/[0.1] rounded-lg shadow-xl z-20 space-y-2 text-xs">
              <p className="text-[11px] font-medium text-[#64748B]">Additional Columns</p>
              {(['topics', 'milestone', 'created'] as const).map((col) => (
                <label key={col} className="flex items-center gap-2 text-[#CBD5E1] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={extraColumns[col]}
                    onChange={(e) =>
                      setExtraColumns((prev) => ({ ...prev, [col]: e.target.checked }))
                    }
                    className="accent-[#3B82F6]"
                  />
                  <span className="capitalize">{col === 'created' ? 'Created Date' : col}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expandable Filter Panel */}
      {filtersOpen && (
        <div className="p-4 bg-[#121620] border border-white/[0.08] rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label htmlFor="f-format" className="block text-[11px] text-[#64748B] mb-1">
              Content Type
            </label>
            <select
              id="f-format"
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-[#0B0E14] border border-white/[0.08] rounded-md text-[#EDF1F7]"
            >
              <option value="all">All formats</option>
              <option value="Video">Video</option>
              <option value="Reel / Short">Reel / Short</option>
              <option value="Article">Article</option>
              <option value="Thread">Thread</option>
              <option value="Carousel">Carousel</option>
            </select>
          </div>
          <div>
            <label htmlFor="f-platform" className="block text-[11px] text-[#64748B] mb-1">
              Platform
            </label>
            <select
              id="f-platform"
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value as PlatformId | 'all')}
              className="w-full px-2.5 py-1.5 text-xs bg-[#0B0E14] border border-white/[0.08] rounded-md text-[#EDF1F7]"
            >
              <option value="all">All platforms</option>
              {state.platforms.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="f-status" className="block text-[11px] text-[#64748B] mb-1">
              Publication Status
            </label>
            <select
              id="f-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-[#0B0E14] border border-white/[0.08] rounded-md text-[#EDF1F7]"
            >
              <option value="all">All statuses</option>
              <option value="Published">Published</option>
              <option value="In Review">In Review</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
          <div>
            <label htmlFor="f-topic" className="block text-[11px] text-[#64748B] mb-1">
              Topic
            </label>
            <select
              id="f-topic"
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-[#0B0E14] border border-white/[0.08] rounded-md text-[#EDF1F7]"
            >
              <option value="all">All topics</option>
              {allTopics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="f-milestone" className="block text-[11px] text-[#64748B] mb-1">
              Linked Milestone
            </label>
            <select
              id="f-milestone"
              value={milestoneFilter}
              onChange={(e) => setMilestoneFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-[#0B0E14] border border-white/[0.08] rounded-md text-[#EDF1F7]"
            >
              <option value="all">All milestones</option>
              {state.milestones.map((m) => (
                <option key={m.id} value={m.id}>
                  M0{m.sequence} — {m.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Content Items Table */}
      {filteredItems.length === 0 ? (
        <EmptyState
          title="No content items match these criteria"
          description="Adjust your search query or filters, or register a new piece of content."
          actionLabel="Reset filters"
          onAction={() => {
            setQuery('');
            setFormatFilter('all');
            setPlatformFilter('all');
            setStatusFilter('all');
            setTopicFilter('all');
            setMilestoneFilter('all');
          }}
        />
      ) : (
        <div className="border border-white/[0.07] rounded-xl bg-[#121620] overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.07] text-[#64748B]">
                <th className="py-3 px-4 font-medium">Content Item</th>
                <th className="py-3 px-4 font-medium">Format</th>
                <th className="py-3 px-4 font-medium">Publications</th>
                <th className="py-3 px-4 font-medium">Status</th>
                {extraColumns.topics && <th className="py-3 px-4 font-medium">Topics</th>}
                {extraColumns.milestone && <th className="py-3 px-4 font-medium">Milestone</th>}
                {extraColumns.created && <th className="py-3 px-4 font-medium">Created</th>}
                <th className="py-3 px-4 font-medium text-right">Lead Publication Metric</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {filteredItems.map((item) => {
                const leadPub = item.publications[0];
                const linkedMs = state.milestones.find((m) => item.milestoneIds.includes(m.id));
                return (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 max-w-md">
                      <button
                        type="button"
                        onClick={() => navigate('content-detail', item.id)}
                        className="font-medium text-[#EDF1F7] hover:text-[#60A5FA] text-left block"
                      >
                        {item.title}
                      </button>
                      <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                        {item.description}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-[#94A3B8] whitespace-nowrap">{item.format}</td>
                    <td className="py-3.5 px-4 text-[#CBD5E1] whitespace-nowrap">
                      {item.publications.length > 0
                        ? item.publications
                            .map(
                              (p) =>
                                state.platforms.find((pl) => pl.id === p.platform)?.name ?? p.platform
                            )
                            .join(' · ')
                        : 'Not published'}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusText
                        label={item.status}
                        tone={
                          item.status === 'Published'
                            ? 'positive'
                            : item.status === 'In Review'
                            ? 'warning'
                            : 'neutral'
                        }
                      />
                    </td>
                    {extraColumns.topics && (
                      <td className="py-3.5 px-4 text-[#94A3B8]">{item.topics.join(' · ')}</td>
                    )}
                    {extraColumns.milestone && (
                      <td className="py-3.5 px-4 text-[#94A3B8]">
                        {linkedMs ? `M0${linkedMs.sequence}` : '—'}
                      </td>
                    )}
                    {extraColumns.created && (
                      <td className="py-3.5 px-4 font-mono tabular-nums text-[#94A3B8]">
                        {item.createdAt}
                      </td>
                    )}
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#EDF1F7] whitespace-nowrap">
                      {leadPub
                        ? `${formatMetricValue(
                            leadPub.metrics.primaryValue,
                            leadPub.metrics.primaryUnit
                          )} ${leadPub.metrics.primaryLabel}`
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
