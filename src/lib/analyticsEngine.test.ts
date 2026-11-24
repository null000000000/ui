import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMilestoneProgress,
  calculateSystemProgress,
  calculateTimeVariance,
  canTransitionRecommendation,
  computeSeriesDeltaPct,
  createSyncRunRecord,
  filterContentItems,
  formatDelta,
  formatMetricValue,
  getNextRecommendationStatus,
  sliceSeriesByDateRange,
} from './analyticsEngine';
import type { ContentItem, Deliverable, Milestone } from '../types/analytics';

test('formatMetricValue enforces No Fake Metrics rule by returning em-dash for null/undefined', () => {
  assert.equal(formatMetricValue(null, 'count'), '—');
  assert.equal(formatMetricValue(undefined, 'percentage'), '—');
  assert.equal(formatMetricValue(Number.NaN, 'seconds'), '—');
  assert.equal(formatMetricValue(14850, 'count'), '14,850');
  assert.equal(formatMetricValue(6.42, 'percentage'), '6.4%');
  assert.equal(formatMetricValue(4350, 'seconds'), '1h 12m');
  assert.equal(formatMetricValue(245, 'seconds'), '4m 05s');
  assert.equal(formatMetricValue(18.5, 'hours'), '18.5h');
});

test('formatDelta handles null baselines safely', () => {
  assert.equal(formatDelta(null), 'No baseline');
  assert.equal(formatDelta(12.4), '+12.4%');
  assert.equal(formatDelta(-4.2), '-4.2%');
});

test('calculateMilestoneProgress computes from deliverables and returns null when empty', () => {
  assert.deepEqual(calculateMilestoneProgress([]), {
    percentage: null,
    completed: 0,
    total: 0,
    source: 'Not Calculated',
  });

  const deliverables: Deliverable[] = [
    {
      id: 'd1',
      milestoneId: 'm1',
      systemId: 's1',
      title: 'Schema migration',
      status: 'Completed',
      completedAt: '2026-11-10',
      files: [],
      gitRef: null,
      testSummary: null,
      evidenceNote: '',
      reviewHistory: [],
    },
    {
      id: 'd2',
      milestoneId: 'm1',
      systemId: 's1',
      title: 'Auth guard',
      status: 'In Progress',
      completedAt: null,
      files: [],
      gitRef: null,
      testSummary: null,
      evidenceNote: '',
      reviewHistory: [],
    },
    {
      id: 'd3',
      milestoneId: 'm1',
      systemId: 's1',
      title: 'Integration tests',
      status: 'Completed',
      completedAt: '2026-11-12',
      files: [],
      gitRef: null,
      testSummary: null,
      evidenceNote: '',
      reviewHistory: [],
    },
  ];

  const result = calculateMilestoneProgress(deliverables);
  assert.equal(result.percentage, 67);
  assert.equal(result.completed, 2);
  assert.equal(result.total, 3);
  assert.equal(result.source, 'Calculated');
});

test('calculateSystemProgress aggregates across milestones cleanly', () => {
  const milestones: Milestone[] = [
    {
      id: 'm1',
      systemId: 's1',
      sequence: 1,
      title: 'Foundation',
      objective: 'Core setup',
      status: 'Completed',
      plannedHours: 20,
      actualHours: 22,
      estimatedProgressPct: null,
      skillsCovered: [],
      blockers: [],
      qualityScore: 8.5,
      qualityReviewNote: null,
      githubCommits: 12,
      githubPrs: 2,
      linkedContentIds: [],
      aiEvaluation: null,
    },
    {
      id: 'm2',
      systemId: 's1',
      sequence: 2,
      title: 'Auth',
      objective: 'Tenant auth',
      status: 'In Progress',
      plannedHours: 16,
      actualHours: 10,
      estimatedProgressPct: null,
      skillsCovered: [],
      blockers: [],
      qualityScore: null,
      qualityReviewNote: null,
      githubCommits: 8,
      githubPrs: 1,
      linkedContentIds: [],
      aiEvaluation: null,
    },
  ];
  const deliverables: Deliverable[] = [
    {
      id: 'd1',
      milestoneId: 'm1',
      systemId: 's1',
      title: 'DB Schema',
      status: 'Completed',
      completedAt: '2026-11-01',
      files: [],
      gitRef: null,
      testSummary: null,
      evidenceNote: '',
      reviewHistory: [],
    },
    {
      id: 'd2',
      milestoneId: 'm2',
      systemId: 's1',
      title: 'RBAC',
      status: 'In Progress',
      completedAt: null,
      files: [],
      gitRef: null,
      testSummary: null,
      evidenceNote: '',
      reviewHistory: [],
    },
  ];

  const summary = calculateSystemProgress(milestones, deliverables);
  assert.equal(summary.percentage, 50);
  assert.equal(summary.completedMilestones, 1);
  assert.equal(summary.totalMilestones, 2);
});

test('recommendation lifecycle enforces Proposed -> Accepted -> Running -> Evaluated', () => {
  assert.equal(canTransitionRecommendation('Proposed', 'Accepted'), true);
  assert.equal(canTransitionRecommendation('Proposed', 'Evaluated'), false);
  assert.equal(canTransitionRecommendation('Accepted', 'Running'), true);
  assert.equal(canTransitionRecommendation('Running', 'Evaluated'), true);
  assert.equal(canTransitionRecommendation('Evaluated', 'Running'), false);
  assert.equal(getNextRecommendationStatus('Proposed'), 'Accepted');
  assert.equal(getNextRecommendationStatus('Evaluated'), null);
});

test('filterContentItems filters by query, platform, topic, and milestone', () => {
  const items: ContentItem[] = [
    {
      id: 'c1',
      title: 'TypeScript Fundamentals',
      description: 'Type safety patterns',
      format: 'Video',
      status: 'Published',
      createdAt: '2026-11-01',
      topics: ['TypeScript', 'Architecture'],
      campaignIds: [],
      milestoneIds: ['m1'],
      publications: [
        {
          id: 'p1',
          contentItemId: 'c1',
          platform: 'youtube',
          externalPostId: 'yt-1',
          url: '#',
          publishedAt: '2026-11-02',
          status: 'Published',
          sourceType: 'API',
          metrics: {
            primaryLabel: 'Views',
            primaryValue: 4100,
            primaryUnit: 'count',
            watchTimeSeconds: 18400,
            retentionPct: 54.2,
            engagementRatePct: 6.1,
            likes: 310,
            comments: 42,
            shares: 28,
          },
          timeline: [],
        },
      ],
      aiNote: null,
    },
  ];

  assert.equal(
    filterContentItems(items, {
      query: 'typescript',
      format: 'all',
      platform: 'youtube',
      status: 'Published',
      topic: 'TypeScript',
      milestoneId: 'm1',
    }).length,
    1
  );

  assert.equal(
    filterContentItems(items, {
      query: '',
      format: 'all',
      platform: 'linkedin',
      status: 'all',
      topic: 'all',
      milestoneId: 'all',
    }).length,
    0
  );
});

test('computeSeriesDeltaPct and createSyncRunRecord work deterministically', () => {
  const delta = computeSeriesDeltaPct([
    { date: '2026-11-01', label: 'Nov 1', value: 1000 },
    { date: '2026-11-02', label: 'Nov 2', value: null },
    { date: '2026-11-03', label: 'Nov 3', value: 1250 },
  ]);
  assert.equal(delta, 25);

  const run = createSyncRunRecord('YouTube', 'Manual', 14, '2026-11-23T11:30:00Z');
  assert.equal(run.stages.length, 8);
  assert.equal(run.status, 'Succeeded');
  assert.equal(run.recordsProcessed, 14);

  const variance = calculateTimeVariance(20, 24);
  assert.equal(variance.diffHours, 4);
  assert.equal(variance.label, '+4h over plan');
});

test('sliceSeriesByDateRange trims to recent window for 7d while preserving full series for 30d+', () => {
  const series = Array.from({ length: 8 }, (_, idx) => ({
    date: `2026-11-0${idx + 1}`,
    label: `Nov ${idx + 1}`,
    value: (idx + 1) * 100,
  }));
  assert.equal(sliceSeriesByDateRange(series, '7d').length, 4);
  assert.equal(sliceSeriesByDateRange(series, '30d').length, 8);
});
