/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { DailyScreen } from './components/DailyScreen';
import { FeedScreen } from './components/FeedScreen';
import { SquadsScreen } from './components/SquadsScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { BottomNav } from './components/BottomNav';
import { OnboardingScreen } from './components/OnboardingScreen';
import { AppState, ThemeId, DailyTask } from './types';
import { cn } from './lib/utils';

export default function App() {
  const [tab, setTab] = useState<AppState['currentTab']>('DAILY');
  const [theme, setTheme] = useState<ThemeId>('industrial');
  const [isOnboarded, setIsOnboarded] = useState(false);
  
  const [task, setTask] = useState<DailyTask>({
    id: format(new Date(), 'yyyy-MM-dd'),
    date: new Date().toISOString(),
    title: "Count the tiles in your bathroom.",
    type: 'NUMBER',
    status: 'PENDING',
  });

  useEffect(() => {
    // Apply the theme class to the body element so all CSS variables cascade correctly
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Force re-render of crt overlay when theme changes, but only momentarily
  const [crtKey, setCrtKey] = useState(0);
  useEffect(() => {
    if (theme === 'analog-static') {
      setCrtKey(k => k + 1);
    }
  }, [theme, tab]);

  return (
    <div className="flex justify-center min-h-screen text-app-text font-sans transition-colors duration-300"
      style={{ backgroundColor: 'var(--color-app-bg)' }}
    >
      {/* Mobile constraint container simulating the device */}
      <div className={cn(
        "app-container w-full max-w-[400px] bg-app-bg relative flex flex-col shadow-2xl border-x border-app-border h-[100dvh] max-h-screen sm:my-4 sm:h-[850px] sm:rounded-3xl sm:border sm:overflow-hidden transition-colors duration-300",
        theme === 'arcade-ledger' && "theme-container"
      )}>
        
        {theme === 'analog-static' && <div key={crtKey} className="crt-overlay" />}

        {!isOnboarded ? (
          <OnboardingScreen onComplete={() => setIsOnboarded(true)} />
        ) : (
          <>
            {/* Main Content Area */}
            {tab === 'DAILY' && <DailyScreen task={task} setTask={setTask} />}
            {tab === 'FEED' && <FeedScreen task={task} onNavigateToDaily={() => setTab('DAILY')} />}
            {tab === 'SQUADS' && <SquadsScreen />}
            {tab === 'HISTORY' && <HistoryScreen />}
            {tab === 'SETTINGS' && <SettingsScreen theme={theme} setTheme={setTheme} />}

            {/* Navigation */}
            <BottomNav currentTab={tab} onChange={setTab} />
          </>
        )}
      </div>
    </div>
  );
}
