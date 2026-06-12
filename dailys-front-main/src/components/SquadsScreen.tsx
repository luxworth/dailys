import React from 'react';
import { Flame, Crown, Hexagon } from 'lucide-react';
import { cn } from '../lib/utils';

export function SquadsScreen() {
  const squad = [
    { id: 1, name: "USER_042", streak: 34, status: 'SUBMITTED', isLeader: true },
    { id: 2, name: "USER_881", streak: 21, status: 'SUBMITTED', isLeader: false },
    { id: 3, name: "USER_993", streak: 18, status: 'PENDING', isLeader: false },
    { id: 4, name: "USER_112", streak: 12, status: 'SUBMITTED', isLeader: false },
    { id: 5, name: "USER_764", streak: 0, status: 'FAILED', isLeader: false },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-app-bg text-app-text w-full">
      {/* Header Profile / Streak Tier */}
      <div className="flex flex-col items-center justify-center p-8 pb-12 border-b border-app-border bg-app-surface relative overflow-hidden">
        {/* Decorative background grid/lines could go here depending on theme */}
        <div className="relative mb-6">
           {/* Plasma Flame Simulation (CSS shadows) */}
           <div className="absolute inset-0 blur-xl bg-blue-500/20 rounded-full animate-pulse"></div>
           <div className="w-24 h-24 flex items-center justify-center border border-blue-500/40 bg-app-bg relative z-10 technical-border iso-interactive">
             <Flame size={48} className="text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.8)]" strokeWidth={1.5} />
           </div>
        </div>
        
        <h2 className="font-display text-3xl tracking-tight mb-2 theme-heading">Flame Evolution</h2>
        <div className="font-mono text-xs tracking-widest text-[#60A5FA] uppercase border border-[#60A5FA]/30 bg-[#60A5FA]/5 px-3 py-1 mb-2">
          Tier 4: Plasma
        </div>
        <div className="font-sans text-sm text-app-muted mt-2">
          Streak: <span className="text-app-text font-mono">34 Days</span> (Top 3% of Finishers)
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-mono text-xs tracking-widest text-app-text uppercase theme-heading">Protocol Squad</h3>
          <span className="font-mono text-[10px] text-app-muted">5 / 5 ACTIVE</span>
        </div>

        <div className="flex flex-col gap-3 pb-20">
          {squad.map((member, idx) => (
             <div key={member.id} className="flex items-center p-3 border border-app-border bg-app-surface technical-border iso-interactive group">
                <div className="w-8 flex justify-center text-app-muted font-mono text-xs mr-2">
                  0{idx + 1}
                </div>
                
                {/* Avatar representation (Hexagon) */}
                <div className="w-10 h-10 border border-app-border flex items-center justify-center bg-app-bg mr-4 shrink-0 relative">
                  <Hexagon size={18} className="text-app-muted" />
                  {/* Status Indicator */}
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-3 h-3 border border-app-bg",
                    member.status === 'SUBMITTED' ? "bg-app-success" :
                    member.status === 'FAILED' ? "bg-app-danger" :
                    "bg-app-muted"
                  )}></div>
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                  <div className="font-mono text-sm tracking-wider uppercase truncate flex items-center gap-2">
                    {member.name}
                    {member.isLeader && <Crown size={12} className="text-app-accent" />}
                  </div>
                  <div className="font-mono text-[10px] text-app-muted">
                    STREAK: {member.streak}
                  </div>
                </div>
                
                <div className="font-mono text-xs opacity-0 group-hover:opacity-100 transition-opacity text-app-muted shrink-0 pl-2">
                  VIEW
                </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}
