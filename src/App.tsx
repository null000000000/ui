import React from 'react';
import { AppShell } from './components/layout/AppShell';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import { AnalysisRunsPage } from './pages/AnalysisRunsPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { CommandCenterPage } from './pages/CommandCenterPage';
import { ContentDetailPage } from './pages/ContentDetailPage';
import { ContentLibraryPage } from './pages/ContentLibraryPage';
import { CrossAnalyticsPage } from './pages/CrossAnalyticsPage';
import { DeliverablesPage } from './pages/DeliverablesPage';
import { EngineeringQualityPage } from './pages/EngineeringQualityPage';
import { GitHubPage } from './pages/GitHubPage';
import { InsightsPage } from './pages/InsightsPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { MilestonesPage } from './pages/MilestonesPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { PlatformAnalyticsPage } from './pages/PlatformAnalyticsPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { ReportsPage } from './pages/ReportsPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { SettingsPage } from './pages/SettingsPage';
import { SyncHistoryPage } from './pages/SyncHistoryPage';
import { SystemsPage } from './pages/SystemsPage';
import { VerificationPage } from './pages/VerificationPage';

function ActiveRouteView() {
  const { nav } = useWorkspace();

  switch (nav.route) {
    case 'command-center':
      return <CommandCenterPage />;
    case 'brand-youtube':
      return <PlatformAnalyticsPage platformId="youtube" />;
    case 'brand-instagram':
      return <PlatformAnalyticsPage platformId="instagram" />;
    case 'brand-facebook':
      return <PlatformAnalyticsPage platformId="facebook" />;
    case 'brand-tiktok':
      return <PlatformAnalyticsPage platformId="tiktok" />;
    case 'brand-linkedin':
      return <PlatformAnalyticsPage platformId="linkedin" />;
    case 'brand-x':
      return <PlatformAnalyticsPage platformId="x" />;
    case 'content-library':
      return <ContentLibraryPage />;
    case 'content-detail':
      return <ContentDetailPage contentId={nav.entityId} />;
    case 'campaigns':
      return <CampaignsPage campaignId={null} />;
    case 'campaign-detail':
      return <CampaignsPage campaignId={nav.entityId} />;
    case 'roadmap':
      return <RoadmapPage />;
    case 'systems':
      return <SystemsPage systemId={null} />;
    case 'system-detail':
      return <SystemsPage systemId={nav.entityId} />;
    case 'milestones':
      return <MilestonesPage milestoneId={null} />;
    case 'milestone-detail':
      return <MilestonesPage milestoneId={nav.entityId} />;
    case 'deliverables':
      return <DeliverablesPage />;
    case 'github':
      return <GitHubPage />;
    case 'engineering-quality':
      return <EngineeringQualityPage />;
    case 'cross-analytics':
      return <CrossAnalyticsPage />;
    case 'insights':
      return <InsightsPage initialInsightId={nav.entityId} />;
    case 'recommendations':
      return <RecommendationsPage />;
    case 'analysis-runs':
      return <AnalysisRunsPage />;
    case 'verification':
      return <VerificationPage />;
    case 'reports':
      return <ReportsPage />;
    case 'integrations':
      return <IntegrationsPage />;
    case 'sync-history':
      return <SyncHistoryPage />;
    case 'notifications':
      return <NotificationsPage />;
    case 'settings':
      return <SettingsPage />;
    default:
      return <CommandCenterPage />;
  }
}

export default function App() {
  return (
    <WorkspaceProvider>
      <AppShell>
        <ActiveRouteView />
      </AppShell>
    </WorkspaceProvider>
  );
}
