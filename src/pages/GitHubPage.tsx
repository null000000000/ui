import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { TrendChart } from '../components/charts/Charts';
import {
  formatShortTimestamp,
  MetricTile,
  SegmentedTabs,
  StatusText,
} from '../components/ui/Primitives';

export function GitHubPage() {
  const { state, navigate } = useWorkspace();
  const [selectedRepoId, setSelectedRepoId] = useState(state.repositories[0].id);
  const [activeTab, setActiveTab] = useState<'overview' | 'prs' | 'issues' | 'links'>('overview');

  const repo = state.repositories.find((r) => r.id === selectedRepoId) ?? state.repositories[0];
  const linkedSystem = state.systems.find((s) => s.id === repo.linkedSystemId);
  const linkedMilestones = state.milestones.filter((m) => repo.linkedMilestoneIds.includes(m.id));

  return (
    <div className="space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[#64748B]">
            Repository telemetry · Kept distinct from Engineering Quality reviews
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white mt-1">GitHub</h1>
        </div>

        <SegmentedTabs
          ariaLabel="Select repository"
          active={selectedRepoId}
          onChange={setSelectedRepoId}
          tabs={state.repositories.map((r) => ({ id: r.id, label: r.name }))}
        />
      </div>

      {/* Repository Header Strip */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-[#94A3B8]">
        <StatusText
          label={`Health: ${repo.healthStatus}`}
          tone={repo.healthStatus === 'Healthy' ? 'positive' : 'neutral'}
        />
        <span aria-hidden="true">·</span>
        <span className="font-mono">branch: {repo.defaultBranch}</span>
        <span aria-hidden="true">·</span>
        <span className="font-mono tabular-nums">
          +{repo.additions30d.toLocaleString()} / -{repo.deletions30d.toLocaleString()} lines (30d)
        </span>
        <span aria-hidden="true">·</span>
        <span>Last push: {formatShortTimestamp(repo.lastPushAt)}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTile label="Commits (30d)" value={repo.commits30d} unit="count" source="GitHub API" />
        <MetricTile label="Merged PRs (30d)" value={repo.mergedPrs30d} unit="count" source="GitHub API" />
        <MetricTile label="Open Pull Requests" value={repo.openPrs} unit="count" source="GitHub API" />
        <MetricTile label="Open Issues" value={repo.openIssues} unit="count" source="GitHub API" />
      </div>

      <SegmentedTabs
        ariaLabel="GitHub detail sections"
        active={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'overview', label: 'Commit Activity' },
          { id: 'prs', label: 'Pull Requests', count: repo.pullRequests.length },
          { id: 'issues', label: 'Issues', count: repo.issues.length },
          { id: 'links', label: 'Linked Systems & Milestones' },
        ]}
      />

      {activeTab === 'overview' && (
        <section className="p-6 bg-[#121620] border border-white/[0.07] rounded-xl space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-[#EDF1F7]">Commit Activity</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Commit cadence on {repo.name} ({repo.defaultBranch})
            </p>
          </div>
          <TrendChart
            data={repo.commitSeries}
            unit="count"
            primaryLabel="Commits"
            accentColor="#34D399"
            height={230}
          />
        </section>
      )}

      {activeTab === 'prs' && (
        <div className="border border-white/[0.07] rounded-xl bg-[#121620] divide-y divide-white/[0.06]">
          {repo.pullRequests.map((pr) => (
            <div key={pr.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <p className="text-sm font-medium text-[#EDF1F7]">
                  <span className="font-mono text-[#64748B] mr-2">{pr.id}</span>
                  {pr.title}
                </p>
                <p className="text-[#64748B] font-mono mt-0.5">
                  {pr.branch} · updated {pr.updatedAt}
                </p>
              </div>
              <StatusText
                label={pr.status}
                tone={pr.status === 'Merged' ? 'positive' : 'accent'}
              />
            </div>
          ))}
        </div>
      )}

      {activeTab === 'issues' && (
        <div className="border border-white/[0.07] rounded-xl bg-[#121620] divide-y divide-white/[0.06]">
          {repo.issues.map((iss) => (
            <div key={iss.id} className="p-4 flex items-center justify-between gap-4 text-xs">
              <div>
                <p className="text-sm font-medium text-[#EDF1F7]">
                  <span className="font-mono text-[#64748B] mr-2">{iss.id}</span>
                  {iss.title}
                </p>
                <p className="text-[#64748B] mt-0.5">
                  Priority: {iss.priority} · Opened {iss.createdAt}
                </p>
              </div>
              <StatusText
                label={iss.status}
                tone={iss.status === 'Open' ? 'warning' : 'positive'}
              />
            </div>
          ))}
        </div>
      )}

      {activeTab === 'links' && (
        <div className="p-6 bg-[#121620] border border-white/[0.07] rounded-xl space-y-4">
          {linkedSystem && (
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <p className="text-xs text-[#64748B]">Linked System</p>
                <p className="text-sm font-semibold text-white mt-0.5">
                  {linkedSystem.code} — {linkedSystem.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('system-detail', linkedSystem.id)}
                className="text-xs text-[#60A5FA] hover:text-[#93C5FD]"
              >
                Open System →
              </button>
            </div>
          )}
          <div className="space-y-2">
            <p className="text-xs text-[#64748B]">Linked Milestones</p>
            {linkedMilestones.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => navigate('milestone-detail', m.id)}
                className="w-full text-left py-2 flex items-center justify-between text-xs hover:text-[#60A5FA]"
              >
                <span className="text-[#EDF1F7]">
                  0{m.sequence}. {m.title}
                </span>
                <span className="font-mono text-[#64748B]">{m.githubCommits} commits →</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
