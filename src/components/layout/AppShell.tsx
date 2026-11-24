import React, { useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  Bell,
  Box,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Compass,
  FileText,
  Flag,
  FolderKanban,
  GitBranch,
  GitCompare,
  History,
  Layers,
  LayoutDashboard,
  Lightbulb,
  Menu,
  Megaphone,
  Plug,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import type { DateRangeOption, PageRouteId } from '../../types/analytics';
import { formatShortTimestamp, SlideOverPanel, StatusText } from '../ui/Primitives';
import { QuickActionModals } from './QuickActionModals';

interface NavItem {
  id: PageRouteId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    items: [{ id: 'command-center', label: 'Command Center', icon: LayoutDashboard }],
  },
  {
    id: 'brand',
    label: 'Brand',
    items: [
      { id: 'brand-youtube', label: 'YouTube', icon: BarChart3 },
      { id: 'brand-instagram', label: 'Instagram', icon: BarChart3 },
      { id: 'brand-facebook', label: 'Facebook', icon: BarChart3 },
      { id: 'brand-tiktok', label: 'TikTok', icon: BarChart3 },
      { id: 'brand-linkedin', label: 'LinkedIn', icon: BarChart3 },
      { id: 'brand-x', label: 'X', icon: BarChart3 },
    ],
  },
  {
    id: 'content',
    label: 'Content',
    items: [
      { id: 'content-library', label: 'Content Library', icon: FolderKanban },
      { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
    ],
  },
  {
    id: 'engineering',
    label: 'Engineering',
    items: [
      { id: 'roadmap', label: 'Roadmap', icon: Compass },
      { id: 'systems', label: 'Systems', icon: Box },
      { id: 'milestones', label: 'Milestones', icon: Flag },
      { id: 'deliverables', label: 'Deliverables', icon: CheckCircle2 },
      { id: 'github', label: 'GitHub', icon: GitBranch },
      { id: 'engineering-quality', label: 'Quality', icon: ShieldCheck },
    ],
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    items: [
      { id: 'cross-analytics', label: 'Cross Analytics', icon: GitCompare },
      { id: 'insights', label: 'Insights', icon: Lightbulb },
      { id: 'recommendations', label: 'Recommendations', icon: Target },
      { id: 'analysis-runs', label: 'Analysis Runs', icon: Activity },
      { id: 'verification', label: 'Verification', icon: Sparkles },
      { id: 'reports', label: 'Reports', icon: FileText },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      { id: 'integrations', label: 'Integrations', icon: Plug },
      { id: 'sync-history', label: 'Sync History', icon: History },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];

const ROUTE_META: Record<
  PageRouteId,
  { group: string; title: string; showDateRange: boolean; showSync: boolean }
> = {
  'command-center': { group: 'Workspace', title: 'Command Center', showDateRange: true, showSync: true },
  'brand-youtube': { group: 'Brand', title: 'YouTube', showDateRange: true, showSync: true },
  'brand-instagram': { group: 'Brand', title: 'Instagram', showDateRange: true, showSync: true },
  'brand-facebook': { group: 'Brand', title: 'Facebook', showDateRange: true, showSync: true },
  'brand-tiktok': { group: 'Brand', title: 'TikTok', showDateRange: true, showSync: false },
  'brand-linkedin': { group: 'Brand', title: 'LinkedIn', showDateRange: true, showSync: true },
  'brand-x': { group: 'Brand', title: 'X', showDateRange: true, showSync: false },
  'content-library': { group: 'Content', title: 'Content Library', showDateRange: true, showSync: false },
  'content-detail': { group: 'Content', title: 'Content Details', showDateRange: true, showSync: false },
  campaigns: { group: 'Content', title: 'Campaigns', showDateRange: true, showSync: false },
  'campaign-detail': { group: 'Content', title: 'Campaign Details', showDateRange: true, showSync: false },
  roadmap: { group: 'Engineering', title: 'Roadmap', showDateRange: false, showSync: false },
  systems: { group: 'Engineering', title: 'Systems', showDateRange: false, showSync: false },
  'system-detail': { group: 'Engineering', title: 'System Details', showDateRange: false, showSync: false },
  milestones: { group: 'Engineering', title: 'Milestones', showDateRange: false, showSync: false },
  'milestone-detail': { group: 'Engineering', title: 'Milestone Details', showDateRange: false, showSync: false },
  deliverables: { group: 'Engineering', title: 'Deliverables', showDateRange: false, showSync: false },
  github: { group: 'Engineering', title: 'GitHub', showDateRange: true, showSync: true },
  'engineering-quality': { group: 'Engineering', title: 'Engineering Quality', showDateRange: true, showSync: false },
  'cross-analytics': { group: 'Intelligence', title: 'Cross Analytics', showDateRange: true, showSync: false },
  insights: { group: 'Intelligence', title: 'Insights', showDateRange: true, showSync: false },
  recommendations: { group: 'Intelligence', title: 'Recommendations', showDateRange: false, showSync: false },
  'analysis-runs': { group: 'Intelligence', title: 'Analysis Runs', showDateRange: false, showSync: false },
  verification: { group: 'Intelligence', title: 'Verification', showDateRange: false, showSync: false },
  reports: { group: 'Intelligence', title: 'Reports', showDateRange: true, showSync: false },
  integrations: { group: 'System', title: 'Integrations', showDateRange: false, showSync: true },
  'sync-history': { group: 'System', title: 'Sync History', showDateRange: false, showSync: true },
  notifications: { group: 'System', title: 'Notifications', showDateRange: false, showSync: false },
  settings: { group: 'System', title: 'Settings', showDateRange: false, showSync: false },
};

const DATE_RANGE_LABELS: Record<DateRangeOption, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  '180d': 'Last 180 days',
  all: 'All snapshots',
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    nav,
    navigate,
    dateRange,
    setDateRange,
    state,
    isSyncing,
    syncNow,
    lastGlobalSyncAt,
    notificationsOpen,
    setNotificationsOpen,
    unreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useWorkspace();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dateMenuOpen, setDateMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    workspace: true,
    brand: true,
    content: true,
    engineering: true,
    intelligence: true,
    system: false,
  });

  const routeMeta = ROUTE_META[nav.route];

  const activeParentRoute = useMemo<PageRouteId>(() => {
    if (nav.route === 'content-detail') return 'content-library';
    if (nav.route === 'campaign-detail') return 'campaigns';
    if (nav.route === 'system-detail') return 'systems';
    if (nav.route === 'milestone-detail') return 'milestones';
    return nav.route;
  }, [nav.route]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleSelectNav = (id: PageRouteId) => {
    navigate(id);
    setMobileMenuOpen(false);
  };

  const syncSourceForRoute = useMemo(() => {
    if (nav.route.startsWith('brand-')) {
      return routeMeta.title;
    }
    if (nav.route === 'github') return 'GitHub';
    return 'All Connected Sources';
  }, [nav.route, routeMeta.title]);

  const renderSidebarContent = (isCompact: boolean) => (
    <div className="flex flex-col h-full">
      <div className="h-14 px-4 flex items-center justify-between border-b border-white/[0.07] shrink-0">
        {!isCompact ? (
          <button
            type="button"
            onClick={() => handleSelectNav('command-center')}
            className="flex items-center gap-2.5 text-left min-w-0 group"
          >
            <div className="w-6 h-6 rounded-md bg-[#3B82F6] flex items-center justify-center shrink-0">
              <Layers className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-white tracking-tight whitespace-nowrap truncate">
              {state.settings.workspaceName}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleSelectNav('command-center')}
            aria-label="Go to Command Center"
            className="w-8 h-8 mx-auto rounded-md bg-[#3B82F6] flex items-center justify-center"
          >
            <Layers className="w-4 h-4 text-white" />
          </button>
        )}

        {!isCompact && (
          <button
            type="button"
            onClick={() => setSidebarCollapsed(true)}
            aria-label="Collapse sidebar"
            className="hidden lg:inline-flex p-1.5 text-[#64748B] hover:text-[#EDF1F7] hover:bg-white/[0.05] rounded-md transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      <nav
        aria-label="Workspace navigation"
        className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4"
      >
        {NAV_GROUPS.map((group) => {
          const groupHasActive = group.items.some((item) => item.id === activeParentRoute);
          const isOpen = isCompact || expandedGroups[group.id] || groupHasActive;

          return (
            <div key={group.id} className="space-y-1">
              {!isCompact && group.id !== 'workspace' && (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-medium text-[#64748B] hover:text-[#CBD5E1] transition-colors"
                >
                  <span>{group.label}</span>
                  {isOpen ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </button>
              )}

              {isOpen && (
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.id === activeParentRoute;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectNav(item.id)}
                          title={isCompact ? item.label : undefined}
                          aria-label={item.label}
                          aria-current={isActive ? 'page' : undefined}
                          className={`w-full flex items-center ${
                            isCompact ? 'justify-center px-0' : 'gap-2.5 px-2.5'
                          } py-1.5 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap ${
                            isActive
                              ? 'bg-[#3B82F6]/15 text-[#60A5FA]'
                              : 'text-[#94A3B8] hover:text-[#EDF1F7] hover:bg-white/[0.04]'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          {!isCompact && <span className="truncate">{item.label}</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/[0.07] shrink-0">
        {isCompact ? (
          <button
            type="button"
            onClick={() => setSidebarCollapsed(false)}
            aria-label="Expand sidebar"
            className="w-full flex items-center justify-center py-2 text-[#94A3B8] hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#EDF1F7] truncate">
                {state.settings.ownerName}
              </p>
              <p className="text-[11px] text-[#64748B] truncate">Single-user scope</p>
            </div>
            <button
              type="button"
              onClick={() => handleSelectNav('settings')}
              aria-label="Open Settings"
              className="p-1.5 text-[#64748B] hover:text-white hover:bg-white/[0.05] rounded-md transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#EDF1F7] flex">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-[#0D1119] border-r border-white/[0.07] sticky top-0 h-screen transition-[width] duration-200 ${
          sidebarCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        {renderSidebarContent(sidebarCollapsed)}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-64 bg-[#0D1119] border-r border-white/[0.08] h-full flex flex-col">
            <div className="flex items-center justify-between px-4 h-14 border-b border-white/[0.07]">
              <span className="text-sm font-semibold text-white">
                {state.settings.workspaceName}
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="p-2 text-[#94A3B8] hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{renderSidebarContent(false)}</div>
          </div>
          <button
            type="button"
            aria-label="Close navigation backdrop"
            onClick={() => setMobileMenuOpen(false)}
            className="flex-1 bg-black/60"
          />
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Contextual Top Header */}
        <header className="sticky top-0 z-30 h-14 bg-[#0B0E14]/90 backdrop-blur-md border-b border-white/[0.07] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-2 text-[#94A3B8] hover:text-white rounded-lg"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
              <span className="text-[#64748B] whitespace-nowrap hidden sm:inline">
                {routeMeta.group}
              </span>
              <span className="text-[#475569] hidden sm:inline" aria-hidden="true">
                /
              </span>
              <span className="font-medium text-[#EDF1F7] truncate">{routeMeta.title}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {routeMeta.showDateRange && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDateMenuOpen((v) => !v)}
                  aria-expanded={dateMenuOpen}
                  aria-label="Select date range"
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-[#CBD5E1] bg-[#121620] hover:bg-[#181E2B] border border-white/[0.08] rounded-lg transition-colors whitespace-nowrap"
                >
                  <span className="sm:hidden uppercase font-mono">{dateRange}</span>
                  <span className="hidden sm:inline">{DATE_RANGE_LABELS[dateRange]}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
                </button>
                {dateMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-40 py-1 bg-[#121620] border border-white/[0.1] rounded-lg shadow-xl z-40">
                    {(Object.keys(DATE_RANGE_LABELS) as DateRangeOption[]).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setDateRange(opt);
                          setDateMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                          dateRange === opt
                            ? 'text-[#60A5FA] bg-[#3B82F6]/10 font-medium'
                            : 'text-[#CBD5E1] hover:bg-white/[0.05]'
                        }`}
                      >
                        {DATE_RANGE_LABELS[opt]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {routeMeta.showSync && (
              <button
                type="button"
                onClick={() => syncNow(syncSourceForRoute)}
                disabled={isSyncing}
                aria-label="Sync Now"
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-white bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isSyncing ? 'Syncing' : 'Sync Now'}</span>
                <span className="sm:hidden">{isSyncing ? '…' : 'Sync'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              aria-label={`Notifications (${unreadNotificationsCount} unread)`}
              className="relative p-2 text-[#94A3B8] hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
              )}
            </button>
          </div>
        </header>

        {/* Main Workspace Viewport */}
        <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-9">
          {children}
        </main>
      </div>

      {/* Notifications Slide-Over Drawer (Hidden by Default per Spec 9.4) */}
      <SlideOverPanel
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        title="Notifications"
        subtitle={`Last global sync: ${formatShortTimestamp(lastGlobalSyncAt)}`}
        footer={
          <div className="w-full flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={markAllNotificationsRead}
              className="text-xs text-[#94A3B8] hover:text-white transition-colors"
            >
              Mark all read
            </button>
            <button
              type="button"
              onClick={() => navigate('notifications')}
              className="text-xs font-medium text-[#60A5FA] hover:text-[#93C5FD] transition-colors"
            >
              Open full notifications view →
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          {state.notifications.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                markNotificationRead(item.id);
                navigate(item.targetRoute);
              }}
              className={`w-full text-left p-4 rounded-xl border transition-colors ${
                item.read
                  ? 'bg-[#121620]/60 border-white/[0.06] hover:border-white/[0.12]'
                  : 'bg-[#151B27] border-[#3B82F6]/30 hover:border-[#3B82F6]/50'
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-xs">
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
                <span className="font-mono text-[11px] text-[#64748B] tabular-nums">
                  {formatShortTimestamp(item.createdAt)}
                </span>
              </div>
              <p className="text-sm font-medium text-[#EDF1F7] mt-1.5">{item.title}</p>
              <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">{item.message}</p>
            </button>
          ))}
        </div>
      </SlideOverPanel>

      <QuickActionModals />
    </div>
  );
}
