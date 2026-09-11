/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { authService, AuthUser } from './firebase/authService';
import { firestoreService } from './firebase/firestoreService';
import { MaintenanceTask, Train, BlockWindow, BlockPlan, Asset, AiRecommendation } from './types';
import { INITIAL_SECTIONS } from './data/simulatedData';

import { Header } from './components/Header';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { HackathonDemoGuide } from './components/HackathonDemoGuide';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { MaintenanceTasksPage } from './pages/MaintenanceTasksPage';
import { BlockPlannerPage } from './pages/BlockPlannerPage';
import { MapPage } from './pages/MapPage';
import { AiRecommendationsPage } from './pages/AiRecommendationsPage';
import { WhatIfSimulationPage } from './pages/WhatIfSimulationPage';
import { PlanningCalendarPage } from './pages/PlanningCalendarPage';
import { AnalyticsPage } from './pages/AnalyticsPage';

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedPlannerSection, setSelectedPlannerSection] = useState<string>('A-B');
  const [isSeeding, setIsSeeding] = useState(false);

  // Firestore Real-time Collections State
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [trains, setTrains] = useState<Train[]>([]);
  const [windows, setWindows] = useState<BlockWindow[]>([]);
  const [plans, setPlans] = useState<BlockPlan[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [recommendations, setRecommendations] = useState<AiRecommendation[]>([]);

  // 1. Auth Listener
  useEffect(() => {
    const unsubAuth = authService.onAuthState(firebaseUser => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return () => unsubAuth();
  }, []);

  // 2. Data Initialization & Firestore Subscriptions
  useEffect(() => {
    // Seed initial data if empty
    firestoreService.seedInitialDataIfNeeded().catch(err => {
      console.warn('Initial seed check notice:', err);
    });

    // Real-time Firestore Subscriptions
    const unsubTasks = firestoreService.subscribeTasks(data => setTasks(data));
    const unsubTrains = firestoreService.subscribeTrains(data => setTrains(data));
    const unsubWindows = firestoreService.subscribeBlockWindows(data => setWindows(data));
    const unsubPlans = firestoreService.subscribeBlockPlans(data => setPlans(data));
    const unsubAssets = firestoreService.subscribeAssets(data => setAssets(data));
    const unsubRecs = firestoreService.subscribeRecommendations(data => setRecommendations(data));

    return () => {
      unsubTasks();
      unsubTrains();
      unsubWindows();
      unsubPlans();
      unsubAssets();
      unsubRecs();
    };
  }, []);

  // Reset seed data
  const handleResetSeedData = useCallback(async () => {
    setIsSeeding(true);
    try {
      await firestoreService.forceSeedData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSeeding(false);
    }
  }, []);

  // Logout
  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Navigate to block planner with section pre-selected
  const handleSelectSectionFromMap = useCallback((sectionCode: string) => {
    setSelectedPlannerSection(sectionCode);
    setActiveTab('planner');
  }, []);

  // Loading spinner during initial auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-slate-300">Initializing RailOpt AI Session...</span>
        </div>
      </div>
    );
  }

  // Not authenticated: render AuthPage
  if (!user) {
    return <AuthPage />;
  }

  const pendingTasksCount = tasks.filter(t => t.status === 'Pending' || t.status === 'Bundled').length;
  const activeRecommendationsCount = recommendations.filter(r => r.status === 'Pending').length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900">
      {/* Header */}
      <Header
        user={user}
        onLogout={handleLogout}
        onResetSeedData={handleResetSeedData}
        isSeeding={isSeeding}
      />

      {/* SIH 2026 9-Step Hackathon Demo Walkthrough Guide */}
      <HackathonDemoGuide
        activeTab={activeTab}
        onNavigate={(tab, section) => {
          if (section) setSelectedPlannerSection(section);
          setActiveTab(tab);
        }}
      />

      {/* Main Layout: Sidebar + Active View */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          pendingCount={pendingTasksCount}
          recommendationsCount={activeRecommendationsCount}
        />

        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <DashboardPage
              tasks={tasks}
              plans={plans}
              sections={INITIAL_SECTIONS}
              onNavigate={setActiveTab}
              onSelectSection={handleSelectSectionFromMap}
            />
          )}

          {activeTab === 'tasks' && (
            <MaintenanceTasksPage
              tasks={tasks}
              onNavigateToOptimizer={(sec) => {
                setSelectedPlannerSection(sec);
                setActiveTab('planner');
              }}
            />
          )}

          {activeTab === 'planner' && (
            <BlockPlannerPage
              tasks={tasks}
              trains={trains}
              windows={windows}
              plans={plans}
              initialSection={selectedPlannerSection}
            />
          )}

          {activeTab === 'map' && (
            <MapPage
              assets={assets}
              sections={INITIAL_SECTIONS}
              tasks={tasks}
              onSelectSectionForPlanner={(sec) => {
                setSelectedPlannerSection(sec);
                setActiveTab('planner');
              }}
            />
          )}

          {activeTab === 'recommendations' && (
            <AiRecommendationsPage recommendations={recommendations} />
          )}

          {activeTab === 'simulation' && (
            <WhatIfSimulationPage trains={trains} tasks={tasks} />
          )}

          {activeTab === 'calendar' && (
            <PlanningCalendarPage plans={plans} tasks={tasks} />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsPage tasks={tasks} plans={plans} />
          )}
        </main>
      </div>
    </div>
  );
}
