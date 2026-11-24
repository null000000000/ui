import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import type { PlatformId } from '../types/analytics';
import { formatShortTimestamp, SlideOverPanel, StatusText } from '../components/ui/Primitives';

interface IntegrationDetailTarget {
  type: 'platform' | 'github';
  platformId?: PlatformId;
}

export function IntegrationsPage() {
  const { state, togglePlatformConnection, syncNow, isSyncing } = useWorkspace();
  const [selected, setSelected] = useState<IntegrationDetailTarget | null>(null);

  const activePlatform =
    selected?.type === 'platform' && selected.platformId
      ? state.platforms.find((p) => p.id === selected.platformId) ?? null
      : null;

  const connectedPlatforms = state.platforms.filter((p) => p.connectionStatus === 'connected');
  const otherPlatforms = state.platforms.filter((p) => p.connectionStatus !== 'connected');

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-[#64748B]">
          OAuth connectors, permissions, and supported vs unavailable metrics · Credentials are encrypted and never logged
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-white mt-1">
          Integrations
        </h1>
      </div>

      {/* Connected Accounts */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[#EDF1F7]">
          Connected Accounts ({connectedPlatforms.length + 1})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connectedPlatforms.map((p) => (
            <div
              key={p.id}
              className="p-5 bg-[#121620] border border-white/[0.07] rounded-xl flex flex-col justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-base font-semibold text-white">{p.name}</span>
                  <StatusText label="Connected" tone="positive" />
                </div>
                <p className="text-xs text-[#94A3B8]">
                  {p.handle} · {p.syncSchedule}
                </p>
                <p className="text-[11px] font-mono text-[#64748B] tabular-nums">
                  Last successful sync: {formatShortTimestamp(p.lastSyncedAt)}
                </p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-xs">
                <button
                  type="button"
                  onClick={() => setSelected({ type: 'platform', platformId: p.id })}
                  className="text-[#60A5FA] hover:text-[#93C5FD]"
                >
                  Permissions & metrics →
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => syncNow(p.name)}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[#CBD5E1] hover:text-white bg-[#0B0E14] border border-white/[0.08] rounded-md"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Sync</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => togglePlatformConnection(p.id)}
                    className="px-2.5 py-1.5 text-[#F87171] hover:bg-[#F87171]/10 rounded-md transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* GitHub Engineering Connector */}
          <div className="p-5 bg-[#121620] border border-white/[0.07] rounded-xl flex flex-col justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-base font-semibold text-white">GitHub</span>
                <StatusText label="Connected" tone="positive" />
              </div>
              <p className="text-xs text-[#94A3B8]">
                {state.repositories.length} repositories tracked · Daily at 06:00 UTC + Manual
              </p>
              <p className="text-[11px] font-mono text-[#64748B] tabular-nums">
                Last successful sync: {formatShortTimestamp(state.repositories[0]?.lastPushAt ?? null)}
              </p>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-xs">
              <button
                type="button"
                onClick={() => setSelected({ type: 'github' })}
                className="text-[#60A5FA] hover:text-[#93C5FD]"
              >
                Permissions & metrics →
              </button>
              <button
                type="button"
                onClick={() => syncNow('GitHub')}
                disabled={isSyncing}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[#CBD5E1] hover:text-white bg-[#0B0E14] border border-white/[0.08] rounded-md"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Sync</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Available / Manual Integrations */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[#EDF1F7]">
          Available & Manual Integrations ({otherPlatforms.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {otherPlatforms.map((p) => (
            <div
              key={p.id}
              className="p-5 bg-[#121620] border border-white/[0.07] rounded-xl flex flex-col justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-base font-semibold text-white">{p.name}</span>
                  <StatusText
                    label={p.connectionStatus === 'manual_only' ? 'Manual Only' : 'Disconnected'}
                    tone={p.connectionStatus === 'manual_only' ? 'warning' : 'neutral'}
                  />
                </div>
                <p className="text-xs text-[#94A3B8]">
                  {p.handle} · {p.collectionMode}
                </p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-xs">
                <button
                  type="button"
                  onClick={() => setSelected({ type: 'platform', platformId: p.id })}
                  className="text-[#60A5FA] hover:text-[#93C5FD]"
                >
                  Inspect scopes →
                </button>
                <button
                  type="button"
                  onClick={() => togglePlatformConnection(p.id)}
                  className="px-3 py-1.5 font-medium text-white bg-[#3B82F6] hover:bg-[#2563EB] rounded-md"
                >
                  Connect {p.name}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Integration Detail Slide-over Panel */}
      <SlideOverPanel
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.type === 'github' ? 'GitHub Integration' : `${activePlatform?.name ?? ''} Integration`}
        subtitle={
          selected?.type === 'github'
            ? 'Engineering repository telemetry connector'
            : activePlatform
            ? `${activePlatform.handle} · ${activePlatform.collectionMode}`
            : undefined
        }
      >
        {selected?.type === 'github' ? (
          <div className="space-y-6 text-xs">
            <div>
              <h3 className="font-semibold text-[#EDF1F7] mb-2">Permissions</h3>
              <ul className="space-y-1.5 font-mono text-[#CBD5E1]">
                <li className="flex justify-between">
                  <span>repo:metadata (read-only)</span>
                  <StatusText label="Granted" tone="positive" />
                </li>
                <li className="flex justify-between">
                  <span>pull_requests:read</span>
                  <StatusText label="Granted" tone="positive" />
                </li>
                <li className="flex justify-between">
                  <span>issues:read</span>
                  <StatusText label="Granted" tone="positive" />
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-[#EDF1F7] mb-1.5">Supported Data</h3>
              <p className="text-[#CBD5E1] leading-relaxed">
                Commits · Pull Requests · Issues · Line Diffs · Branch Push Timestamps
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[#EDF1F7] mb-1.5">Unavailable / Excluded</h3>
              <p className="text-[#94A3B8] leading-relaxed">
                Code review quality rubrics and architecture compliance are measured separately in Engineering Quality.
              </p>
            </div>
          </div>
        ) : activePlatform ? (
          <div className="space-y-6 text-xs">
            <div>
              <h3 className="font-semibold text-[#EDF1F7] mb-2">OAuth Permissions</h3>
              <ul className="space-y-2 font-mono">
                {activePlatform.permissions.map((perm) => (
                  <li key={perm.scope} className="flex items-center justify-between">
                    <span className="text-[#CBD5E1]">{perm.scope}</span>
                    <StatusText
                      label={perm.granted ? 'Granted' : 'Not granted'}
                      tone={perm.granted ? 'positive' : 'neutral'}
                    />
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-[#34D399] mb-1.5">Supported Metrics</h3>
              <p className="text-[#CBD5E1] leading-relaxed">
                {activePlatform.supportedMetrics.join(' · ')}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[#FBBF24] mb-1.5">Missing / Unavailable Metrics</h3>
              <p className="text-[#94A3B8] leading-relaxed">
                {activePlatform.missingMetrics.join(' · ')}
              </p>
            </div>
            <div className="pt-3 border-t border-white/[0.06] text-[#64748B]">
              Credentials are stored encrypted in integration_credentials and excluded from sync logs.
            </div>
          </div>
        ) : null}
      </SlideOverPanel>
    </div>
  );
}
