import React, { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { formatMetricValue } from '../lib/analyticsEngine';
import { TrendChart } from '../components/charts/Charts';
import { EmptyState, MetricTile, SegmentedTabs, StatusText } from '../components/ui/Primitives';

export function ContentDetailPage({ contentId }: { contentId: string | null }) {
  const { state, navigate } = useWorkspace();

  const item =
    state.contentItems.find((c) => c.id === contentId) ?? state.contentItems[0];

  const [selectedPubId, setSelectedPubId] = useState<string>(
    item?.publications[0]?.id ?? ''
  );

  const activePub = useMemo(() => {
    if (!item || item.publications.length === 0) return null;
    return item.publications.find((p) => p.id === selectedPubId) ?? item.publications[0];
  }, [item, selectedPubId]);

  const linkedMilestones = state.milestones.filter((m) =>
    item?.milestoneIds.includes(m.id)
  );
  const linkedCampaigns = state.campaigns.filter((c) =>
    item?.campaignIds.includes(c.id)
  );
  const similarItems = state.contentItems.filter(
    (c) =>
      c.id !== item?.id &&
      c.topics.some((t) => item?.topics.includes(t))
  );

  if (!item) {
    return (
      <EmptyState
        title="Content item not found"
        description="Return to the Content Library to select an existing item."
        actionLabel="Back to Content Library"
        onAction={() => navigate('content-library')}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => navigate('content-library')}
          className="inline-flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Content Library</span>
        </button>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
            <span>{item.format}</span>
            <span aria-hidden="true">·</span>
            <StatusText
              label={item.status}
              tone={item.status === 'Published' ? 'positive' : 'warning'}
            />
            <span aria-hidden="true">·</span>
            <span>Created {item.createdAt}</span>
            <span aria-hidden="true">·</span>
            <span>{item.topics.join(' / ')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white">{item.title}</h1>
          <p className="text-sm text-[#94A3B8] max-w-3xl leading-relaxed">{item.description}</p>
        </div>

        {/* Traceable Links to Engineering Milestones & Campaigns */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs text-[#94A3B8]">
          {linkedMilestones.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[#64748B]">Linked Milestones:</span>
              {linkedMilestones.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => navigate('milestone-detail', m.id)}
                  className="text-[#60A5FA] hover:text-[#93C5FD]"
                >
                  M0{m.sequence} — {m.title}
                </button>
              ))}
            </div>
          )}
          {linkedCampaigns.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[#64748B]">Campaigns:</span>
              {linkedCampaigns.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => navigate('campaign-detail', c.id)}
                  className="text-[#CBD5E1] hover:text-white underline underline-offset-2"
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Separated Publications Selector (Content vs Publication separation per spec) */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[#EDF1F7]">Platform Publications</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Each publication keeps its own native metrics and timeline without cross-platform blending.
            </p>
          </div>
          {item.publications.length > 0 && (
            <SegmentedTabs
              ariaLabel="Select platform publication"
              active={activePub?.id ?? ''}
              onChange={setSelectedPubId}
              tabs={item.publications.map((pub, idx) => {
                const pName =
                  state.platforms.find((p) => p.id === pub.platform)?.name ?? pub.platform;
                return { id: pub.id, label: `0${idx + 1}. ${pName}` };
              })}
            />
          )}
        </div>

        {!activePub ? (
          <EmptyState
            title="No publications linked yet"
            description="This content item is currently in draft/review and has not been published to any platform."
          />
        ) : (
          <div className="space-y-6">
            {/* Publication Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricTile
                label={activePub.metrics.primaryLabel}
                value={activePub.metrics.primaryValue}
                unit={activePub.metrics.primaryUnit}
                source={activePub.sourceType}
              />
              <MetricTile
                label="Watch Time"
                value={activePub.metrics.watchTimeSeconds}
                unit="seconds"
                source={activePub.metrics.watchTimeSeconds !== null ? activePub.sourceType : 'Unavailable'}
                note={activePub.metrics.watchTimeSeconds === null ? 'Not provided on this platform' : undefined}
              />
              <MetricTile
                label="Retention"
                value={activePub.metrics.retentionPct}
                unit="percentage"
                source={activePub.metrics.retentionPct !== null ? activePub.sourceType : 'Unavailable'}
              />
              <MetricTile
                label="Engagement Rate"
                value={activePub.metrics.engagementRatePct}
                unit="percentage"
                source="Calculated"
              />
            </div>

            {/* Performance Timeline & Engagement Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 p-6 bg-[#121620] border border-white/[0.07] rounded-xl space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#EDF1F7]">Performance Timeline</span>
                  <span className="font-mono text-[#64748B]">
                    ID: {activePub.externalPostId} · Published {activePub.publishedAt}
                  </span>
                </div>
                <TrendChart
                  data={activePub.timeline}
                  unit={activePub.metrics.primaryUnit}
                  primaryLabel={activePub.metrics.primaryLabel}
                  height={220}
                />
              </div>

              <div className="p-6 bg-[#121620] border border-white/[0.07] rounded-xl space-y-4">
                <h3 className="text-sm font-semibold text-[#EDF1F7]">Engagement Breakdown</h3>
                <dl className="space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-white/[0.05]">
                    <dt className="text-[#94A3B8]">Likes / Reactions</dt>
                    <dd className="font-mono tabular-nums text-[#EDF1F7]">
                      {formatMetricValue(activePub.metrics.likes, 'count')}
                    </dd>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/[0.05]">
                    <dt className="text-[#94A3B8]">Comments</dt>
                    <dd className="font-mono tabular-nums text-[#EDF1F7]">
                      {formatMetricValue(activePub.metrics.comments, 'count')}
                    </dd>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/[0.05]">
                    <dt className="text-[#94A3B8]">Shares / Reposts</dt>
                    <dd className="font-mono tabular-nums text-[#EDF1F7]">
                      {formatMetricValue(activePub.metrics.shares, 'count')}
                    </dd>
                  </div>
                  <div className="flex justify-between py-2">
                    <dt className="text-[#94A3B8]">Data Source</dt>
                    <dd className="font-mono text-[#CBD5E1]">{activePub.sourceType}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Separated AI Analysis & Comparison With Similar Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="p-6 bg-[#121620] border border-white/[0.07] rounded-xl space-y-3">
          <div className="flex items-center justify-between text-xs">
            <h2 className="text-sm font-semibold text-[#EDF1F7]">AI Analysis</h2>
            <span className="text-[#64748B]">Separated from computed metrics</span>
          </div>
          {item.aiNote ? (
            <div className="space-y-3 text-xs">
              <div>
                <p className="text-[#64748B] mb-1">Observation</p>
                <p className="text-[#EDF1F7] leading-relaxed">{item.aiNote.observation}</p>
              </div>
              <div>
                <p className="text-[#64748B] mb-1">Possible Explanation (Hypothesis)</p>
                <p className="text-[#CBD5E1] leading-relaxed">{item.aiNote.hypothesis}</p>
              </div>
              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[#94A3B8]">
                <span>Confidence: {item.aiNote.confidence}</span>
                <span className="font-mono tabular-nums text-[#60A5FA]">
                  {item.aiNote.comparisonDelta}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#64748B]">
              No AI analysis generated yet for this content item.
            </p>
          )}
        </section>

        <section className="p-6 bg-[#121620] border border-white/[0.07] rounded-xl space-y-3">
          <h2 className="text-sm font-semibold text-[#EDF1F7]">Comparison With Similar Content</h2>
          {similarItems.length === 0 ? (
            <p className="text-xs text-[#64748B]">No similar topic items available for comparison.</p>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {similarItems.map((sim) => {
                const simPub = sim.publications[0];
                return (
                  <button
                    key={sim.id}
                    type="button"
                    onClick={() => navigate('content-detail', sim.id)}
                    className="w-full py-3 flex items-center justify-between gap-4 text-left hover:bg-white/[0.02] -mx-2 px-2 rounded-lg"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#EDF1F7] truncate">{sim.title}</p>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        {sim.format} · {sim.topics.join(' · ')}
                      </p>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-[#CBD5E1] shrink-0">
                      {simPub
                        ? `${formatMetricValue(simPub.metrics.primaryValue, simPub.metrics.primaryUnit)} ${simPub.metrics.primaryLabel}`
                        : '—'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
