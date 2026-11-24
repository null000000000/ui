export type DateRangeOption = '7d' | '30d' | '90d' | '180d' | 'all';

export type PlatformId =
  | 'youtube'
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'linkedin'
  | 'x';

export type SourceType = 'API' | 'Manual' | 'Calculated';

export type ConnectionStatus = 'connected' | 'manual_only' | 'disconnected' | 'error';

export type PageRouteId =
  | 'command-center'
  | 'brand-youtube'
  | 'brand-instagram'
  | 'brand-facebook'
  | 'brand-tiktok'
  | 'brand-linkedin'
  | 'brand-x'
  | 'content-library'
  | 'content-detail'
  | 'campaigns'
  | 'campaign-detail'
  | 'roadmap'
  | 'systems'
  | 'system-detail'
  | 'milestones'
  | 'milestone-detail'
  | 'deliverables'
  | 'github'
  | 'engineering-quality'
  | 'cross-analytics'
  | 'insights'
  | 'recommendations'
  | 'analysis-runs'
  | 'verification'
  | 'reports'
  | 'integrations'
  | 'sync-history'
  | 'notifications'
  | 'settings';

export type MetricUnit = 'count' | 'seconds' | 'percentage' | 'hours' | 'score';

export interface MetricDefinition {
  id: string;
  name: string;
  unit: MetricUnit;
  domain: 'Brand' | 'Engineering';
  sourcePlatform: string;
  aggregationType: 'sum' | 'average' | 'latest' | 'rate';
  isCumulative: boolean;
  definitionVersion: string;
  description: string;
}

export interface TimeSeriesPoint {
  date: string;
  label: string;
  value: number | null;
  secondaryValue?: number | null;
  source?: SourceType;
}

export interface PlatformMetricValue {
  key: string;
  label: string;
  value: number | null;
  unit: MetricUnit;
  deltaPct: number | null;
  source: SourceType | 'Unavailable';
  note?: string;
}

export interface PlatformAccount {
  id: PlatformId;
  name: string;
  handle: string;
  connectionStatus: ConnectionStatus;
  collectionMode: 'API + Manual' | 'Manual Only' | 'Not Connected';
  lastSyncedAt: string | null;
  primaryMetricLabel: string;
  primaryMetricUnit: MetricUnit;
  metrics: PlatformMetricValue[];
  trendSeries: TimeSeriesPoint[];
  audience: {
    topRegions: { name: string; sharePct: number }[];
    returningSharePct: number | null;
    activeHours: string | null;
    available: boolean;
  };
  engagement: {
    likes: number | null;
    comments: number | null;
    shares: number | null;
    saves: number | null;
    ratePct: number | null;
  };
  growth: {
    netFollowers: number | null;
    growthRatePct: number | null;
    monthlySeries: TimeSeriesPoint[];
  };
  permissions: { scope: string; granted: boolean }[];
  supportedMetrics: string[];
  missingMetrics: string[];
  syncSchedule: string;
}

export interface Publication {
  id: string;
  contentItemId: string;
  platform: PlatformId;
  externalPostId: string;
  url: string;
  publishedAt: string;
  status: 'Published' | 'Scheduled' | 'Draft';
  sourceType: SourceType;
  metrics: {
    primaryLabel: string;
    primaryValue: number | null;
    primaryUnit: MetricUnit;
    watchTimeSeconds: number | null;
    retentionPct: number | null;
    engagementRatePct: number | null;
    likes: number | null;
    comments: number | null;
    shares: number | null;
  };
  timeline: TimeSeriesPoint[];
}

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  format: 'Video' | 'Reel / Short' | 'Article' | 'Thread' | 'Carousel';
  status: 'Published' | 'In Review' | 'Draft';
  createdAt: string;
  topics: string[];
  campaignIds: string[];
  milestoneIds: string[];
  publications: Publication[];
  aiNote: {
    observation: string;
    hypothesis: string;
    confidence: 'High' | 'Medium' | 'Low';
    comparisonDelta: string;
  } | null;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  status: 'Active' | 'Completed' | 'Planned';
  startDate: string;
  endDate: string;
  objective: string;
  platforms: PlatformId[];
  contentIds: string[];
}

export interface Deliverable {
  id: string;
  milestoneId: string;
  systemId: string;
  title: string;
  status: 'Completed' | 'In Progress' | 'Pending' | 'Blocked';
  completedAt: string | null;
  files: string[];
  gitRef: string | null;
  testSummary: string | null;
  evidenceNote: string;
  reviewHistory: {
    date: string;
    reviewer: string;
    outcome: 'Approved' | 'Changes Requested' | 'Logged';
    note: string;
  }[];
}

export interface Milestone {
  id: string;
  systemId: string;
  sequence: number;
  title: string;
  objective: string;
  status: 'Completed' | 'In Progress' | 'Planned' | 'Blocked';
  plannedHours: number;
  actualHours: number;
  estimatedProgressPct: number | null;
  skillsCovered: string[];
  blockers: string[];
  qualityScore: number | null;
  qualityReviewNote: string | null;
  githubCommits: number;
  githubPrs: number;
  linkedContentIds: string[];
  aiEvaluation: string | null;
}

export interface EngineeringSystem {
  id: string;
  code: string;
  name: string;
  subtitle: string;
  description: string;
  status: 'Active' | 'Planned' | 'Completed';
  startDate: string;
  targetEndDate: string;
  architectureStyle: string;
  stack: string[];
  architectureNotes: string[];
  repositoryId: string;
  qualitySummary: {
    testCoveragePct: number | null;
    buildPassing: boolean | null;
    docsCompletenessPct: number | null;
    techDebtItems: number | null;
  };
}

export interface Repository {
  id: string;
  name: string;
  provider: 'GitHub';
  url: string;
  defaultBranch: string;
  linkedSystemId: string;
  linkedMilestoneIds: string[];
  commits30d: number;
  openPrs: number;
  mergedPrs30d: number;
  openIssues: number;
  additions30d: number;
  deletions30d: number;
  healthStatus: 'Healthy' | 'Attention' | 'Pending';
  lastPushAt: string;
  commitSeries: TimeSeriesPoint[];
  pullRequests: {
    id: string;
    title: string;
    status: 'Merged' | 'Open';
    branch: string;
    updatedAt: string;
    milestoneId: string;
  }[];
  issues: {
    id: string;
    title: string;
    priority: 'High' | 'Medium' | 'Low';
    status: 'Open' | 'Closed';
    createdAt: string;
  }[];
}

export interface QualityMetric {
  id: string;
  name: string;
  value: number | null;
  unit: MetricUnit;
  target: string;
  status: 'Healthy' | 'Watch' | 'Action Needed' | 'Not Measured';
  measurementMethod: string;
  lastEvaluatedAt: string;
  trend: TimeSeriesPoint[];
}

export interface InsightEvidence {
  id: string;
  metricName: string;
  period: string;
  observedValue: string;
  baselineValue: string;
  source: SourceType;
  entityRef: string;
}

export interface Insight {
  id: string;
  title: string;
  domain: 'Brand' | 'Engineering' | 'Cross-Domain';
  priority: 'High' | 'Medium' | 'Low';
  confidence: 'High' | 'Medium' | 'Low';
  status: 'New' | 'Reviewed' | 'Actioned' | 'Dismissed';
  createdAt: string;
  observation: string;
  possibleExplanation: string;
  suggestedAction: string;
  relatedMetrics: string[];
  evidence: InsightEvidence[];
}

export type RecommendationStatus = 'Proposed' | 'Accepted' | 'Running' | 'Evaluated';

export interface Recommendation {
  id: string;
  insightId: string | null;
  title: string;
  domain: 'Brand' | 'Engineering' | 'Cross-Domain';
  expectedOutcome: string;
  successMetric: string;
  measurementPeriod: string;
  status: RecommendationStatus;
  createdAt: string;
  baselineValue: string;
  targetValue: string;
  actualResult: string | null;
  difference: string | null;
  conclusion: 'Validated' | 'Inconclusive' | 'Not Met' | null;
}

export interface AnalysisRun {
  id: string;
  analysisType: 'Brand Performance' | 'Engineering Velocity' | 'Cross-Domain Correlation' | 'Full Intelligence Sweep';
  scope: string;
  executedAt: string;
  dataSources: string[];
  findingsCount: number;
  resultSummary: string;
  confidence: 'High' | 'Medium' | 'Low';
  status: 'Completed' | 'Partial' | 'Failed';
}

export interface ReportSnapshot {
  id: string;
  title: string;
  type: 'Brand Report' | 'Engineering Report' | 'Cross Report' | 'Intelligence Report' | 'Custom Report';
  dateRange: DateRangeOption;
  generatedAt: string;
  saved: boolean;
  selectedScope: string[];
  metricsIncluded: string[];
  includesAiInsights: boolean;
  summary: string;
  highlights: { label: string; value: string; source: string }[];
}

export interface SyncStageLog {
  stage: 'Trigger' | 'Fetch' | 'Validate' | 'Normalize' | 'Deduplicate' | 'Persist' | 'Analyze' | 'Complete';
  status: 'Completed' | 'Failed' | 'Skipped';
  durationMs: number;
  note: string;
}

export interface SyncRun {
  id: string;
  source: string;
  trigger: 'Scheduled' | 'Manual';
  status: 'Succeeded' | 'Partial' | 'Failed';
  startedAt: string;
  completedAt: string;
  recordsProcessed: number;
  recordsSkipped: number;
  errors: { code: string; message: string }[];
  stages: SyncStageLog[];
}

export interface AppNotification {
  id: string;
  category: 'Critical Error' | 'Sync Failure' | 'Important Insight' | 'Experiment Result' | 'System Warning';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  targetRoute: PageRouteId;
}

export interface TimeEntry {
  id: string;
  milestoneId: string;
  systemId: string;
  date: string;
  hours: number;
  activityType: 'Architecture' | 'Implementation' | 'Testing' | 'Documentation' | 'Review';
  note: string;
}

export interface AppSettings {
  workspaceName: string;
  ownerName: string;
  timezone: string;
  defaultDateRange: DateRangeOption;
  minimalDefaultMode: boolean;
  showSourceIndicators: boolean;
  aiEvidenceRequired: boolean;
  aiAutoRunOnSync: boolean;
  aiConfidenceThreshold: 'High' | 'Medium' | 'Low';
  notifySyncFailures: boolean;
  notifyHighPriorityInsights: boolean;
  notifyExperimentMilestones: boolean;
  retentionPolicy: 'Keep all snapshots' | '24 months' | '12 months';
  encryptionEnabled: boolean;
  auditLoggingEnabled: boolean;
}
