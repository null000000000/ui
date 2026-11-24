import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  SEED_ANALYSIS_RUNS,
  SEED_CAMPAIGNS,
  SEED_CONTENT_ITEMS,
  SEED_DELIVERABLES,
  SEED_INSIGHTS,
  SEED_METRIC_DEFINITIONS,
  SEED_MILESTONES,
  SEED_NOTIFICATIONS,
  SEED_PLATFORMS,
  SEED_QUALITY_METRICS,
  SEED_RECOMMENDATIONS,
  SEED_REPORTS,
  SEED_REPOSITORIES,
  SEED_SETTINGS,
  SEED_SYNC_RUNS,
  SEED_SYSTEMS,
  SEED_TIME_ENTRIES,
} from '../data/seedData';
import { canTransitionRecommendation, createSyncRunRecord } from '../lib/analyticsEngine';
import type {
  AnalysisRun,
  AppNotification,
  AppSettings,
  Campaign,
  ContentItem,
  DateRangeOption,
  Deliverable,
  EngineeringSystem,
  Insight,
  MetricDefinition,
  Milestone,
  PageRouteId,
  PlatformAccount,
  PlatformId,
  QualityMetric,
  Recommendation,
  RecommendationStatus,
  ReportSnapshot,
  Repository,
  SyncRun,
  TimeEntry,
} from '../types/analytics';

interface NavigationState {
  route: PageRouteId;
  entityId: string | null;
}

interface WorkspaceState {
  platforms: PlatformAccount[];
  contentItems: ContentItem[];
  campaigns: Campaign[];
  systems: EngineeringSystem[];
  milestones: Milestone[];
  deliverables: Deliverable[];
  repositories: Repository[];
  qualityMetrics: QualityMetric[];
  metricDefinitions: MetricDefinition[];
  insights: Insight[];
  recommendations: Recommendation[];
  analysisRuns: AnalysisRun[];
  reports: ReportSnapshot[];
  syncRuns: SyncRun[];
  notifications: AppNotification[];
  timeEntries: TimeEntry[];
  settings: AppSettings;
}

const STORAGE_KEY = 'personal_analytics_workspace_v1';

const DEFAULT_STATE: WorkspaceState = {
  platforms: SEED_PLATFORMS,
  contentItems: SEED_CONTENT_ITEMS,
  campaigns: SEED_CAMPAIGNS,
  systems: SEED_SYSTEMS,
  milestones: SEED_MILESTONES,
  deliverables: SEED_DELIVERABLES,
  repositories: SEED_REPOSITORIES,
  qualityMetrics: SEED_QUALITY_METRICS,
  metricDefinitions: SEED_METRIC_DEFINITIONS,
  insights: SEED_INSIGHTS,
  recommendations: SEED_RECOMMENDATIONS,
  analysisRuns: SEED_ANALYSIS_RUNS,
  reports: SEED_REPORTS,
  syncRuns: SEED_SYNC_RUNS,
  notifications: SEED_NOTIFICATIONS,
  timeEntries: SEED_TIME_ENTRIES,
  settings: SEED_SETTINGS,
};

interface NewContentInput {
  title: string;
  description: string;
  format: ContentItem['format'];
  platform: PlatformId;
  topics: string[];
  milestoneId?: string;
  campaignId?: string;
  initialPrimaryValue?: number | null;
}

interface NewReportInput {
  title: string;
  type: ReportSnapshot['type'];
  dateRange: DateRangeOption;
  selectedScope: string[];
  metricsIncluded: string[];
  includesAiInsights: boolean;
}

interface NewTimeEntryInput {
  milestoneId: string;
  hours: number;
  activityType: TimeEntry['activityType'];
  note: string;
}

interface WorkspaceContextValue {
  nav: NavigationState;
  navigate: (route: PageRouteId, entityId?: string | null) => void;
  dateRange: DateRangeOption;
  setDateRange: (range: DateRangeOption) => void;
  state: WorkspaceState;
  isSyncing: boolean;
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
  quickActionModal: 'content' | 'activity' | null;
  setQuickActionModal: (mode: 'content' | 'activity' | null) => void;
  unreadNotificationsCount: number;
  lastGlobalSyncAt: string;
  syncNow: (source?: string) => void;
  addContentItem: (input: NewContentInput) => ContentItem;
  logManualPlatformMetric: (platformId: PlatformId, metricKey: string, value: number) => void;
  createCampaign: (input: { name: string; description: string; objective: string; startDate: string; endDate: string; platforms: PlatformId[] }) => Campaign;
  toggleDeliverableStatus: (deliverableId: string) => void;
  logTimeEntry: (input: NewTimeEntryInput) => void;
  updateInsightStatus: (insightId: string, status: Insight['status']) => void;
  createRecommendationFromInsight: (insight: Insight) => Recommendation;
  advanceRecommendation: (recId: string, nextStatus: RecommendationStatus, evaluation?: { actualResult: string; difference: string; conclusion: Recommendation['conclusion'] }) => void;
  runIntelligenceAnalysis: (analysisType: AnalysisRun['analysisType'], scope: string) => AnalysisRun;
  generateReport: (input: NewReportInput) => ReportSnapshot;
  toggleReportSaved: (reportId: string) => void;
  togglePlatformConnection: (platformId: PlatformId) => void;
  retrySyncRun: (syncRunId: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  resetDemoData: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function loadInitialState(): WorkspaceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<WorkspaceState>;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      settings: { ...DEFAULT_STATE.settings, ...(parsed.settings ?? {}) },
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WorkspaceState>(loadInitialState);
  const [nav, setNav] = useState<NavigationState>({ route: 'command-center', entityId: null });
  const [dateRange, setDateRange] = useState<DateRangeOption>(state.settings.defaultDateRange);
  const [isSyncing, setIsSyncing] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [quickActionModal, setQuickActionModal] = useState<'content' | 'activity' | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors in sandboxed iframes
    }
  }, [state]);

  const navigate = (route: PageRouteId, entityId: string | null = null) => {
    setNav({ route, entityId });
    setNotificationsOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const syncNow = (source = 'All Connected Sources') => {
    if (isSyncing) return;
    setIsSyncing(true);
    const nowIso = new Date().toISOString();

    window.setTimeout(() => {
      const records = source === 'All Connected Sources' ? 32 : 12;
      const newRun = createSyncRunRecord(source, 'Manual', records, nowIso);

      setState((prev) => ({
        ...prev,
        syncRuns: [newRun, ...prev.syncRuns],
        platforms: prev.platforms.map((p) => {
          if (p.connectionStatus !== 'connected') return p;
          if (source !== 'All Connected Sources' && p.name.toLowerCase() !== source.toLowerCase()) {
            return p;
          }
          return {
            ...p,
            lastSyncedAt: nowIso,
          };
        }),
      }));
      setIsSyncing(false);
    }, 320);
  };

  const addContentItem = (input: NewContentInput): ContentItem => {
    const id = `cnt-${Date.now()}`;
    const today = new Date().toISOString().slice(0, 10);
    const platform = state.platforms.find((p) => p.id === input.platform);
    const primaryLabel = platform?.primaryMetricLabel ?? 'Views';
    const primaryUnit = platform?.primaryMetricUnit ?? 'count';

    const newItem: ContentItem = {
      id,
      title: input.title.trim(),
      description: input.description.trim() || 'Logged manually in Content Registry.',
      format: input.format,
      status: 'Published',
      createdAt: today,
      topics: input.topics.length > 0 ? input.topics : ['Engineering'],
      campaignIds: input.campaignId ? [input.campaignId] : [],
      milestoneIds: input.milestoneId ? [input.milestoneId] : [],
      publications: [
        {
          id: `pub-${Date.now()}`,
          contentItemId: id,
          platform: input.platform,
          externalPostId: `manual_${Date.now().toString().slice(-5)}`,
          url: '#',
          publishedAt: today,
          status: 'Published',
          sourceType: 'Manual',
          metrics: {
            primaryLabel,
            primaryValue: input.initialPrimaryValue ?? null,
            primaryUnit,
            watchTimeSeconds: null,
            retentionPct: null,
            engagementRatePct: null,
            likes: null,
            comments: null,
            shares: null,
          },
          timeline:
            input.initialPrimaryValue !== null && input.initialPrimaryValue !== undefined
              ? [{ date: today, label: 'Day 1', value: input.initialPrimaryValue, source: 'Manual' }]
              : [],
        },
      ],
      aiNote: null,
    };

    setState((prev) => ({
      ...prev,
      contentItems: [newItem, ...prev.contentItems],
      campaigns: input.campaignId
        ? prev.campaigns.map((c) =>
            c.id === input.campaignId ? { ...c, contentIds: [id, ...c.contentIds] } : c
          )
        : prev.campaigns,
      milestones: input.milestoneId
        ? prev.milestones.map((m) =>
            m.id === input.milestoneId
              ? { ...m, linkedContentIds: [id, ...m.linkedContentIds] }
              : m
          )
        : prev.milestones,
    }));

    return newItem;
  };

  const logManualPlatformMetric = (platformId: PlatformId, metricKey: string, value: number) => {
    const nowIso = new Date().toISOString();
    const today = nowIso.slice(0, 10);

    setState((prev) => ({
      ...prev,
      platforms: prev.platforms.map((p) => {
        if (p.id !== platformId) return p;
        const updatedMetrics = p.metrics.map((m) =>
          m.key === metricKey
            ? { ...m, value, source: 'Manual' as const, note: `Logged manually on ${today}` }
            : m
        );
        const isPrimary = p.metrics[0]?.key === metricKey;
        const updatedTrend = isPrimary
          ? [...p.trendSeries, { date: today, label: 'Today', value, source: 'Manual' as const }]
          : p.trendSeries;

        return {
          ...p,
          lastSyncedAt: nowIso,
          metrics: updatedMetrics,
          trendSeries: updatedTrend,
        };
      }),
    }));
  };

  const createCampaign = (input: {
    name: string;
    description: string;
    objective: string;
    startDate: string;
    endDate: string;
    platforms: PlatformId[];
  }): Campaign => {
    const newCamp: Campaign = {
      id: `camp-${Date.now()}`,
      name: input.name.trim(),
      description: input.description.trim(),
      objective: input.objective.trim(),
      status: 'Active',
      startDate: input.startDate,
      endDate: input.endDate,
      platforms: input.platforms,
      contentIds: [],
    };
    setState((prev) => ({
      ...prev,
      campaigns: [newCamp, ...prev.campaigns],
    }));
    return newCamp;
  };

  const toggleDeliverableStatus = (deliverableId: string) => {
    const today = new Date().toISOString().slice(0, 10);
    setState((prev) => {
      const nextDeliverables = prev.deliverables.map((d) => {
        if (d.id !== deliverableId) return d;
        const nextStatus: Deliverable['status'] =
          d.status === 'Completed' ? 'In Progress' : 'Completed';
        return {
          ...d,
          status: nextStatus,
          completedAt: nextStatus === 'Completed' ? today : null,
        };
      });

      const targetDel = nextDeliverables.find((d) => d.id === deliverableId);
      const nextMilestones = prev.milestones.map((m) => {
        if (!targetDel || m.id !== targetDel.milestoneId) return m;
        const mDels = nextDeliverables.filter((d) => d.milestoneId === m.id);
        const allDone = mDels.length > 0 && mDels.every((d) => d.status === 'Completed');
        const anyBlocked = mDels.some((d) => d.status === 'Blocked');
        const nextStatus: Milestone['status'] = allDone
          ? 'Completed'
          : anyBlocked
          ? 'Blocked'
          : 'In Progress';
        return { ...m, status: nextStatus };
      });

      return {
        ...prev,
        deliverables: nextDeliverables,
        milestones: nextMilestones,
      };
    });
  };

  const logTimeEntry = (input: NewTimeEntryInput) => {
    const milestone = state.milestones.find((m) => m.id === input.milestoneId);
    if (!milestone) return;
    const entry: TimeEntry = {
      id: `te-${Date.now()}`,
      milestoneId: input.milestoneId,
      systemId: milestone.systemId,
      date: new Date().toISOString().slice(0, 10),
      hours: input.hours,
      activityType: input.activityType,
      note: input.note.trim(),
    };

    setState((prev) => ({
      ...prev,
      timeEntries: [entry, ...prev.timeEntries],
      milestones: prev.milestones.map((m) =>
        m.id === input.milestoneId
          ? { ...m, actualHours: Number((m.actualHours + input.hours).toFixed(1)) }
          : m
      ),
    }));
  };

  const updateInsightStatus = (insightId: string, status: Insight['status']) => {
    setState((prev) => ({
      ...prev,
      insights: prev.insights.map((ins) => (ins.id === insightId ? { ...ins, status } : ins)),
    }));
  };

  const createRecommendationFromInsight = (insight: Insight): Recommendation => {
    const existing = state.recommendations.find((r) => r.insightId === insight.id);
    if (existing) return existing;

    const rec: Recommendation = {
      id: `rec-${Date.now()}`,
      insightId: insight.id,
      title: insight.suggestedAction.slice(0, 88),
      domain: insight.domain,
      expectedOutcome: 'Validate hypothesis with measurable post-intervention snapshot.',
      successMetric: insight.relatedMetrics.join(', ') || 'Primary Metric',
      measurementPeriod: '14 days',
      status: 'Proposed',
      createdAt: new Date().toISOString().slice(0, 10),
      baselineValue: insight.evidence[0]?.observedValue ?? 'Current baseline',
      targetValue: 'Measurable uplift vs baseline',
      actualResult: null,
      difference: null,
      conclusion: null,
    };

    setState((prev) => ({
      ...prev,
      recommendations: [rec, ...prev.recommendations],
      insights: prev.insights.map((i) => (i.id === insight.id ? { ...i, status: 'Actioned' } : i)),
    }));

    return rec;
  };

  const advanceRecommendation = (
    recId: string,
    nextStatus: RecommendationStatus,
    evaluation?: { actualResult: string; difference: string; conclusion: Recommendation['conclusion'] }
  ) => {
    setState((prev) => ({
      ...prev,
      recommendations: prev.recommendations.map((rec) => {
        if (rec.id !== recId) return rec;
        if (!canTransitionRecommendation(rec.status, nextStatus)) return rec;
        return {
          ...rec,
          status: nextStatus,
          ...(evaluation ?? {}),
        };
      }),
    }));
  };

  const runIntelligenceAnalysis = (
    analysisType: AnalysisRun['analysisType'],
    scope: string
  ): AnalysisRun => {
    const nowIso = new Date().toISOString();
    const run: AnalysisRun = {
      id: `run-${Date.now().toString().slice(-4)}`,
      analysisType,
      scope,
      executedAt: nowIso,
      dataSources: ['Metric Observations', 'Content Registry', 'Deliverables', 'GitHub'],
      findingsCount: 2,
      resultSummary: `Evaluated ${state.contentItems.length} content items and ${state.deliverables.length} engineering deliverables; verified evidence links intact.`,
      confidence: 'High',
      status: 'Completed',
    };

    setState((prev) => ({
      ...prev,
      analysisRuns: [run, ...prev.analysisRuns],
    }));

    return run;
  };

  const generateReport = (input: NewReportInput): ReportSnapshot => {
    const nowIso = new Date().toISOString();
    const completedDels = state.deliverables.filter((d) => d.status === 'Completed').length;
    const ytViews = state.platforms.find((p) => p.id === 'youtube')?.metrics[0]?.value ?? null;
    const liImpressions = state.platforms.find((p) => p.id === 'linkedin')?.metrics[0]?.value ?? null;

    const newReport: ReportSnapshot = {
      id: `rep-${Date.now()}`,
      title: input.title.trim() || `${input.type} — ${nowIso.slice(0, 10)}`,
      type: input.type,
      dateRange: input.dateRange,
      generatedAt: nowIso,
      saved: true,
      selectedScope: input.selectedScope,
      metricsIncluded: input.metricsIncluded,
      includesAiInsights: input.includesAiInsights,
      summary: `Snapshot compiled across ${input.selectedScope.join(', ')} for the ${input.dateRange} window. ${
        input.includesAiInsights
          ? `Includes ${state.insights.length} evidence-backed insights and ${state.recommendations.filter((r) => r.status === 'Running').length} active experiments.`
          : 'Raw computed metrics only (AI narrative excluded).'
      }`,
      highlights: [
        { label: 'YouTube Views', value: ytViews !== null ? ytViews.toLocaleString() : '—', source: 'API' },
        { label: 'LinkedIn Impressions', value: liImpressions !== null ? liImpressions.toLocaleString() : '—', source: 'API' },
        { label: 'Engineering Deliverables', value: `${completedDels} / ${state.deliverables.length} completed`, source: 'Calculated' },
      ],
    };

    setState((prev) => ({
      ...prev,
      reports: [newReport, ...prev.reports],
    }));

    return newReport;
  };

  const toggleReportSaved = (reportId: string) => {
    setState((prev) => ({
      ...prev,
      reports: prev.reports.map((r) => (r.id === reportId ? { ...r, saved: !r.saved } : r)),
    }));
  };

  const togglePlatformConnection = (platformId: PlatformId) => {
    const nowIso = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      platforms: prev.platforms.map((p) => {
        if (p.id !== platformId) return p;
        const willConnect = p.connectionStatus !== 'connected';
        if (willConnect) {
          return {
            ...p,
            connectionStatus: 'connected',
            collectionMode: 'API + Manual',
            lastSyncedAt: nowIso,
            syncSchedule: 'Daily at 06:00 UTC + Manual',
            permissions: p.permissions.map((perm) => ({ ...perm, granted: true })),
            metrics: p.metrics.map((m, idx) =>
              m.value === null && idx === 0
                ? { ...m, value: 4180, source: 'API', deltaPct: null, note: 'Fresh baseline established' }
                : m.value === null && idx === 2
                ? { ...m, value: 1290, source: 'API', deltaPct: null, note: 'Fresh baseline established' }
                : m
            ),
            trendSeries:
              p.trendSeries.length === 0
                ? [{ date: nowIso.slice(0, 10), label: 'Baseline', value: 4180, source: 'API' }]
                : p.trendSeries,
          };
        }
        return {
          ...p,
          connectionStatus: 'disconnected',
          collectionMode: 'Not Connected',
          syncSchedule: 'Not scheduled',
          permissions: p.permissions.map((perm) => ({ ...perm, granted: false })),
        };
      }),
    }));
  };

  const retrySyncRun = (syncRunId: string) => {
    const run = state.syncRuns.find((r) => r.id === syncRunId);
    if (!run) return;
    syncNow(run.source);
  };

  const markNotificationRead = (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  };

  const markAllNotificationsRead = () => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  };

  const updateSettings = (patch: Partial<AppSettings>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...patch },
    }));
    if (patch.defaultDateRange) {
      setDateRange(patch.defaultDateRange);
    }
  };

  const resetDemoData = () => {
    setState(DEFAULT_STATE);
    localStorage.removeItem(STORAGE_KEY);
  };

  const unreadNotificationsCount = useMemo(
    () => state.notifications.filter((n) => !n.read).length,
    [state.notifications]
  );

  const lastGlobalSyncAt = useMemo(() => {
    const latest = state.syncRuns.find((r) => r.status === 'Succeeded' || r.status === 'Partial');
    return latest?.completedAt ?? '2026-11-23T09:42:00Z';
  }, [state.syncRuns]);

  return (
    <WorkspaceContext.Provider
      value={{
        nav,
        navigate,
        dateRange,
        setDateRange,
        state,
        isSyncing,
        notificationsOpen,
        setNotificationsOpen,
        quickActionModal,
        setQuickActionModal,
        unreadNotificationsCount,
        lastGlobalSyncAt,
        syncNow,
        addContentItem,
        logManualPlatformMetric,
        createCampaign,
        toggleDeliverableStatus,
        logTimeEntry,
        updateInsightStatus,
        createRecommendationFromInsight,
        advanceRecommendation,
        runIntelligenceAnalysis,
        generateReport,
        toggleReportSaved,
        togglePlatformConnection,
        retrySyncRun,
        markNotificationRead,
        markAllNotificationsRead,
        updateSettings,
        resetDemoData,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspace must be used inside WorkspaceProvider');
  }
  return ctx;
}
