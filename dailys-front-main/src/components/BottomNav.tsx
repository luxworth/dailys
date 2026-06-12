import React from 'react';
import { Target, AlignLeft, Settings2, Globe, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { AppState } from '../types';

interface BottomNavProps {
  currentTab: AppState['currentTab'];
  onChange: (tab: AppState['currentTab']) => void;
}

export function BottomNav({ currentTab, onChange }: BottomNavProps) {
  return (
    <div className="h-16 border-t border-app-border bg-app-bg flex px-1 sm:px-2 transition-colors duration-300 z-50">
      <button 
        onClick={() => onChange('DAILY')}
        className={cn(
          "flex-1 flex flex-col items-center justify-center gap-1 transition-colors iso-interactive",
          currentTab === 'DAILY' ? "text-app-text" : "text-app-muted hover:text-app-text/80"
        )}
      >
        <Target strokeWidth={currentTab === 'DAILY' ? 2 : 1.5} size={20} />
        <span className="font-mono text-[8px] uppercase tracking-widest hidden sm:block mt-1">Daily</span>
      </button>

      <button 
        onClick={() => onChange('FEED')}
        className={cn(
          "flex-1 flex flex-col items-center justify-center gap-1 transition-colors iso-interactive",
          currentTab === 'FEED' ? "text-app-text" : "text-app-muted hover:text-app-text/80"
        )}
      >
        <Globe strokeWidth={currentTab === 'FEED' ? 2 : 1.5} size={20} />
        <span className="font-mono text-[8px] uppercase tracking-widest hidden sm:block mt-1">Feed</span>
      </button>

      <button 
        onClick={() => onChange('SQUADS')}
        className={cn(
          "flex-1 flex flex-col items-center justify-center gap-1 transition-colors iso-interactive",
          currentTab === 'SQUADS' ? "text-app-text" : "text-app-muted hover:text-app-text/80"
        )}
      >
        <Users strokeWidth={currentTab === 'SQUADS' ? 2 : 1.5} size={20} />
        <span className="font-mono text-[8px] uppercase tracking-widest hidden sm:block mt-1">Squads</span>
      </button>
      
      <button 
        onClick={() => onChange('HISTORY')}
        className={cn(
          "flex-1 flex flex-col items-center justify-center gap-1 transition-colors iso-interactive",
          currentTab === 'HISTORY' ? "text-app-text" : "text-app-muted hover:text-app-text/80"
        )}
      >
        <AlignLeft strokeWidth={currentTab === 'HISTORY' ? 2 : 1.5} size={20} />
        <span className="font-mono text-[8px] uppercase tracking-widest hidden sm:block mt-1">Ledger</span>
      </button>

      <button 
        onClick={() => onChange('SETTINGS')}
        className={cn(
          "flex-1 flex flex-col items-center justify-center gap-1 transition-colors iso-interactive",
          currentTab === 'SETTINGS' ? "text-app-text" : "text-app-muted hover:text-app-text/80"
        )}
      >
        <Settings2 strokeWidth={currentTab === 'SETTINGS' ? 2 : 1.5} size={20} />
        <span className="font-mono text-[8px] uppercase tracking-widest hidden sm:block mt-1">Settings</span>
      </button>
    </div>
  );
}
