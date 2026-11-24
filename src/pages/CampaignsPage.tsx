import React, { useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { formatMetricValue } from '../lib/analyticsEngine';
import type { PlatformId } from '../types/analytics';
import {
  ProgressiveSection,
  SlideOverPanel,
  StatusText,
} from '../components/ui/Primitives';

export function CampaignsPage({ campaignId }: { campaignId: string | null }) {
  const { state, navigate, createCampaign } = useWorkspace();
  const [newOpen, setNewOpen] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [objective, setObjective] = useState('');
  const [startDate, setStartDate] = useState('2026-11-24');
  const [endDate, setEndDate] = useState('2026-12-31');
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformId[]>(['youtube', 'linkedin']);
  const [formError, setFormError] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Campaign name is required.');
      return;
    }
    const created = createCampaign({
      name,
      description,
      objective,
      startDate,
      endDate,
      platforms: selectedPlatforms.length > 0 ? selectedPlatforms : ['youtube'],
    });
    setName('');
    setDescription('');
    setObjective('');
    setFormError('');
    setNewOpen(false);
    navigate('campaign-detail', created.id);
  };

  // Detail View
  if (campaignId) {
    const campaign = state.campaigns.find((c) => c.id === campaignId) ?? state.campaigns[0];
    const linkedContent = state.contentItems.filter((c) =>
      campaign.contentIds.includes(c.id) || c.campaignIds.includes(campaign.id)
    );

    const platformBreakdown = campaign.platforms.map((pid) => {
      const platform = state.platforms.find((p) => p.id === pid)!;
      const pubs = linkedContent.flatMap((c) => c.publications.filter((pub) => pub.platform === pid));
      const sumVal = pubs.reduce((acc, p) => acc + (p.metrics.primaryValue ?? 0), 0);
      return {
        platformName: platform.name,
        metricLabel: platform.primaryMetricLabel,
        publicationsCount: pubs.length,
        totalValue: pubs.length > 0 ? sumVal : null,
      };
    });

    return (
      <div className="space-y-8">
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => navigate('campaigns')}
            className="inline-flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Campaigns</span>
          </button>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
            <StatusText
              label={campaign.status}
              tone={campaign.status === 'Active' ? 'positive' : 'neutral'}
            />
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {campaign.startDate} to {campaign.endDate}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white">{campaign.name}</h1>
          <p className="text-sm text-[#94A3B8] max-w-3xl">{campaign.description}</p>
          <p className="text-xs text-[#CBD5E1]">
            <span className="text-[#64748B]">Objective:</span> {campaign.objective}
          </p>
        </div>

        {/* Platform Distribution (Non-blended) */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[#EDF1F7]">Platform Distribution</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {platformBreakdown.map((pb) => (
              <div
                key={pb.platformName}
                className="p-5 bg-[#121620] border border-white/[0.07] rounded-xl space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#EDF1F7]">{pb.platformName}</span>
                  <span className="font-mono text-[#64748B] tabular-nums">
                    {pb.publicationsCount} pubs
                  </span>
                </div>
                <p className="text-2xl font-mono tabular-nums font-semibold text-white">
                  {formatMetricValue(pb.totalValue, 'count')}
                </p>
                <p className="text-[11px] text-[#64748B]">{pb.metricLabel} (native unit)</p>
              </div>
            ))}
          </div>
        </section>

        {/* Linked Content */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[#EDF1F7]">
            Linked Content ({linkedContent.length})
          </h2>
          <div className="border border-white/[0.07] rounded-xl bg-[#121620] divide-y divide-white/[0.06]">
            {linkedContent.length === 0 ? (
              <p className="p-6 text-xs text-[#64748B]">No content items linked to this campaign yet.</p>
            ) : (
              linkedContent.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate('content-detail', item.id)}
                  className="w-full text-left p-4 hover:bg-white/[0.02] flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#EDF1F7] truncate">{item.title}</p>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      {item.format} · {item.publications.length} publications
                    </p>
                  </div>
                  <StatusText
                    label={item.status}
                    tone={item.status === 'Published' ? 'positive' : 'warning'}
                  />
                </button>
              ))
            )}
          </div>
        </section>
      </div>
    );
  }

  // Campaign List View
  return (
    <div className="space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[#64748B]">
            Group related multi-platform content under measurable editorial themes
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white mt-1">Campaigns</h1>
        </div>
        <button
          type="button"
          onClick={() => setNewOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#3B82F6] hover:bg-[#2563EB] rounded-lg whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Campaign</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {state.campaigns.map((camp) => {
          const items = state.contentItems.filter(
            (c) => camp.contentIds.includes(c.id) || c.campaignIds.includes(camp.id)
          );
          const pubCount = items.reduce((acc, c) => acc + c.publications.length, 0);

          return (
            <button
              key={camp.id}
              type="button"
              onClick={() => navigate('campaign-detail', camp.id)}
              className="text-left p-6 bg-[#121620] border border-white/[0.07] hover:border-white/[0.16] rounded-xl space-y-3 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <StatusText
                  label={camp.status}
                  tone={camp.status === 'Active' ? 'positive' : 'neutral'}
                />
                <span className="font-mono text-[#64748B] tabular-nums">
                  {camp.startDate} – {camp.endDate}
                </span>
              </div>
              <h2 className="text-base font-semibold text-white">{camp.name}</h2>
              <p className="text-xs text-[#94A3B8] leading-relaxed">{camp.description}</p>
              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#CBD5E1]">
                <span className="font-mono tabular-nums">
                  {items.length} content items · {pubCount} publications
                </span>
                <span className="text-[#60A5FA]">Inspect →</span>
              </div>
            </button>
          );
        })}
      </div>

      <ProgressiveSection
        title="Campaign Comparison"
        summary="Compare content volume and platform coverage side by side"
        expanded={showCompare}
        onToggle={() => setShowCompare((v) => !v)}
        actionLabel="Compare campaigns"
      >
        <div className="overflow-x-auto border border-white/[0.07] rounded-xl bg-[#121620]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.07] text-[#64748B]">
                <th className="py-3 px-4 font-medium">Campaign</th>
                <th className="py-3 px-4 font-medium">Window</th>
                <th className="py-3 px-4 font-medium text-right">Content Items</th>
                <th className="py-3 px-4 font-medium text-right">Platforms</th>
                <th className="py-3 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {state.campaigns.map((camp) => {
                const count = state.contentItems.filter(
                  (c) => camp.contentIds.includes(c.id) || c.campaignIds.includes(camp.id)
                ).length;
                return (
                  <tr key={camp.id}>
                    <td className="py-3 px-4 font-medium text-[#EDF1F7]">{camp.name}</td>
                    <td className="py-3 px-4 font-mono tabular-nums text-[#94A3B8]">
                      {camp.startDate} → {camp.endDate}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-[#EDF1F7]">
                      {count}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-[#CBD5E1]">
                      {camp.platforms.length}
                    </td>
                    <td className="py-3 px-4">
                      <StatusText
                        label={camp.status}
                        tone={camp.status === 'Active' ? 'positive' : 'neutral'}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ProgressiveSection>

      <SlideOverPanel
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="New Campaign"
        subtitle="Create a structured campaign container to link multi-platform publications."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label htmlFor="camp-name" className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
              Campaign Name
            </label>
            <input
              id="camp-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setFormError('');
              }}
              placeholder="e.g., PostgreSQL Performance Deep Dives"
              className="w-full px-3.5 py-2 text-sm bg-[#121620] border border-white/[0.1] rounded-lg text-white"
            />
          </div>
          <div>
            <label htmlFor="camp-desc" className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
              Description
            </label>
            <textarea
              id="camp-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-[#121620] border border-white/[0.1] rounded-lg text-white"
            />
          </div>
          <div>
            <label htmlFor="camp-obj" className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
              Objective
            </label>
            <input
              id="camp-obj"
              type="text"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-[#121620] border border-white/[0.1] rounded-lg text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="camp-start" className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                Start Date
              </label>
              <input
                id="camp-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-[#121620] border border-white/[0.1] rounded-lg text-white"
              />
            </div>
            <div>
              <label htmlFor="camp-end" className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                End Date
              </label>
              <input
                id="camp-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-[#121620] border border-white/[0.1] rounded-lg text-white"
              />
            </div>
          </div>
          <div>
            <span className="block text-xs font-medium text-[#CBD5E1] mb-2">Target Platforms</span>
            <div className="flex flex-wrap gap-2">
              {state.platforms.map((p) => {
                const checked = selectedPlatforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      setSelectedPlatforms((prev) =>
                        checked ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                      )
                    }
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                      checked
                        ? 'bg-[#3B82F6]/15 border-[#3B82F6]/50 text-[#60A5FA]'
                        : 'bg-[#121620] border-white/[0.08] text-[#94A3B8]'
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>
          {formError && <p className="text-xs text-[#F87171]">{formError}</p>}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setNewOpen(false)}
              className="px-4 py-2 text-xs font-medium text-[#CBD5E1] bg-[#121620] border border-white/[0.08] rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-[#3B82F6] hover:bg-[#2563EB] rounded-lg"
            >
              Create Campaign
            </button>
          </div>
        </form>
      </SlideOverPanel>
    </div>
  );
}
