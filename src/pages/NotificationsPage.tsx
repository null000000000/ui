import React, { useMemo, useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import type { AppNotification } from '../types/analytics';
import { formatShortTimestamp, SegmentedTabs, StatusText } from '../components/ui/Primitives';

export function NotificationsPage() {
  const { state, markNotificationRead, markAllNotificationsRead, navigate } = useWorkspace();
  const [filter, setFilter] = useState<'all' | AppNotification['category']>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return state.notifications;
    return state.notifications.filter((n) => n.category === filter);
  }, [state.notifications, filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[#64748B]">
            System alerts, sync failures, high-priority insights, and experiment conclusions
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white mt-1">
            Notifications
          </h1>
        </div>
        <button
          type="button"
          onClick={markAllNotificationsRead}
          className="px-3.5 py-2 text-xs font-medium text-[#CBD5E1] bg-[#121620] border border-white/[0.08] hover:text-white rounded-lg self-start sm:self-auto"
        >
          Mark all as read
        </button>
      </div>

      <SegmentedTabs
        ariaLabel="Filter notifications by category"
        active={filter}
        onChange={setFilter}
        tabs={[
          { id: 'all', label: 'All', count: state.notifications.length },
          { id: 'Important Insight', label: 'Insights' },
          { id: 'Experiment Result', label: 'Experiments' },
          { id: 'Sync Failure', label: 'Sync Failures' },
          { id: 'System Warning', label: 'Warnings' },
        ]}
      />

      <div className="space-y-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              item.read
                ? 'bg-[#121620] border-white/[0.07]'
                : 'bg-[#151B27] border-[#3B82F6]/30'
            }`}
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <StatusText
                  label={item.category}
                  tone={
                    item.category === 'Critical Error' || item.category === 'Sync Failure'
                      ? 'danger'
                      : item.category === 'System Warning'
                      ? 'warning'
                      : item.category === 'Experiment Result'
                      ? 'positive'
                      : 'accent'
                  }
                />
                <span aria-hidden="true" className="text-[#475569]">·</span>
                <span className="font-mono text-[#64748B] tabular-nums">
                  {formatShortTimestamp(item.createdAt)}
                </span>
                {!item.read && (
                  <>
                    <span aria-hidden="true" className="text-[#475569]">·</span>
                    <span className="text-[#60A5FA] font-medium">Unread</span>
                  </>
                )}
              </div>
              <h2 className="text-sm font-semibold text-white">{item.title}</h2>
              <p className="text-xs text-[#94A3B8] max-w-2xl leading-relaxed">{item.message}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!item.read && (
                <button
                  type="button"
                  onClick={() => markNotificationRead(item.id)}
                  className="px-3 py-1.5 text-xs text-[#94A3B8] hover:text-white"
                >
                  Mark read
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  markNotificationRead(item.id);
                  navigate(item.targetRoute);
                }}
                className="px-3.5 py-1.5 text-xs font-medium text-[#EDF1F7] bg-[#0B0E14] border border-white/[0.08] hover:border-white/[0.18] rounded-lg whitespace-nowrap"
              >
                Open →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
