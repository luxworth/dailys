import React from 'react';
import { format, subDays } from 'date-fns';
import { Flame, Target, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

export function HistoryScreen() {
  // Mock last 30 days
  const today = new Date();
  const calendarDays = Array.from({ length: 30 }).map((_, i) => {
    const d = subDays(today, 29 - i);
    // Randomize status for visual impact, keeping recent mostly green to reflect the streak of 12
    let status = 'empty';
    if (i === 29) status = 'empty'; // Today
    else if (i >= 17) status = 'completed'; // Streak of 12 days
    else if (i === 16) status = 'failed';
    else if (i > 0 && Math.random() > 0.4) status = 'completed';
    else status = 'failed';
    
    return { date: d, status };
  });

  const recentHistory = [
    { date: subDays(today, 1), title: "Photograph your current footwear.", status: "completed", type: "IMAGE", submission: "[Image]" },
    { date: subDays(today, 2), title: "Write one thing you are grateful for today.", status: "completed", type: "TEXT", submission: "The morning light." },
    { date: subDays(today, 3), title: "Drink a glass of water, record how many ounces.", status: "completed", type: "NUMBER", submission: "12" },
    { date: subDays(today, 4), title: "Describe the view from your nearest window.", status: "completed", type: "TEXT", submission: "Brick wall and a single pigeon." },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      {/* Hero Streak */}
      <div className="px-6 py-12 flex flex-col items-center justify-center border-b border-app-border bg-app-surface transition-colors duration-300">
        <Flame size={48} className="text-app-accent mb-4 opacity-80" strokeWidth={1} />
        <div className="theme-heading text-[5rem] font-mono tracking-tighter text-app-text font-medium leading-none mb-1">12</div>
        <div className="text-app-muted font-sans text-sm tracking-widest uppercase">Current Streak</div>
      </div>

      {/* 30 Day Grid */}
      <div className="p-6 border-b border-app-border">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-mono text-xs tracking-widest text-app-text uppercase theme-heading">30-Day Activity</h3>
          <span className="font-mono text-[10px] text-app-muted">{format(subDays(today, 29), 'MMM d')} &mdash; {format(today, 'MMM d')}</span>
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((d, i) => (
            <div 
              key={i} 
              className={cn(
                "aspect-square flex items-center justify-center text-[10px] font-mono border transition-colors hover:scale-105 active:scale-95 cursor-pointer iso-interactive",
                d.status === 'completed' ? "bg-app-success/10 border-app-success/30 text-app-success" : 
                d.status === 'failed' ? "bg-app-danger/5 border-app-danger/20 text-app-danger/80" : 
                "bg-transparent border-app-border/50 text-app-muted/30"
              )}
            >
              {format(d.date, 'd')}
            </div>
          ))}
        </div>
      </div>

      {/* Trophy Room (AR Tokens) */}
      <div className="p-6 border-b border-app-border overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-mono text-xs tracking-widest text-app-text uppercase theme-heading">Trophy Room</h3>
          <span className="font-mono text-[10px] text-app-muted">DIGITAL TOYS</span>
        </div>
        
        <div className="grid grid-cols-2 gap-6 sm:gap-8 pt-4 pb-8 perspective-1000">
           {/* Trophy 1 */}
           <div className="aspect-square flex items-center justify-center relative group">
              {/* 3D Porcelain Golden Tile CSS Construct */}
              <div 
                className="w-20 h-20 transition-transform duration-700 group-hover:rotate-x-12 group-hover:rotate-z-[-30deg] rotate-x-60 rotate-z-[-45deg] preserve-3d"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: 'rotateX(60deg) rotateZ(-45deg)',
                  boxShadow: '-15px 15px 25px rgba(0,0,0,0.6), inset 0 0 10px rgba(255,255,255,0.2)',
                  background: 'linear-gradient(135deg, #F9D423 0%, #FF4E50 100%)', // premium golden tile
                  border: '1px solid rgba(255,255,255,0.4)',
                }}
              >
                {/* 3D Depth faces */}
                <div className="absolute top-full left-0 w-full h-[15px] origin-top bg-[#B33739]" style={{ transform: 'rotateX(-90deg)' }}></div>
                <div className="absolute top-0 left-full w-[15px] h-full origin-left bg-[#DA8F15]" style={{ transform: 'rotateY(90deg)' }}></div>
                <div className="absolute inset-0 flex items-center justify-center font-mono text-white/50 text-xs transform -translate-z-px">042</div>
              </div>
           </div>

           {/* Trophy 2 */}
           <div className="aspect-square flex items-center justify-center relative group">
              <div 
                className="w-20 h-20 transition-transform duration-700 rotate-x-60 rotate-z-[-45deg]"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: 'rotateX(60deg) rotateZ(-45deg)',
                  boxShadow: '-15px 15px 25px rgba(0,0,0,0.6), inset 0 0 10px rgba(255,255,255,0.2)',
                  background: 'linear-gradient(135deg, #E2E2E2 0%, #999999 100%)', // Silver tile
                  border: '1px solid rgba(255,255,255,0.4)',
                }}
              >
                <div className="absolute top-full left-0 w-full h-[15px] origin-top bg-[#777777]" style={{ transform: 'rotateX(-90deg)' }}></div>
                <div className="absolute top-0 left-full w-[15px] h-full origin-left bg-[#AAAAAA]" style={{ transform: 'rotateY(90deg)' }}></div>
                <div className="absolute inset-0 flex items-center justify-center font-mono text-white/50 text-xs">030</div>
              </div>
           </div>
        </div>
      </div>

      {/* Ledger List */}
      <div className="p-6 pb-24">
         <h3 className="font-mono text-xs tracking-widest text-app-text uppercase mb-6 theme-heading">The Ledger</h3>
         
         <div className="flex flex-col gap-4">
           {recentHistory.map((item, i) => (
             <div key={i} className="p-4 border border-app-border bg-app-surface gap-3 flex flex-col select-none transition-colors technical-border hover:bg-app-bg iso-interactive">
               <div className="flex justify-between items-start">
                 <div className="font-mono text-[10px] text-app-muted uppercase tracking-widest flex items-center gap-1.5">
                    <Target size={10} className="text-app-success" />
                    {format(item.date, 'MMM do, yyyy')}
                 </div>
                 <div className="font-mono text-[9px] px-1.5 py-0.5 border border-app-border text-app-muted uppercase tracking-[0.2em] theme-heading">{item.type}</div>
               </div>
               <div className="font-sans text-sm leading-relaxed text-app-text theme-heading">
                 {item.title}
               </div>
               <div className="pt-3 mt-1 border-t border-app-border border-dashed font-mono text-xs text-app-muted transition-colors">
                 Proof: <span className="text-app-text">{item.submission}</span>
               </div>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
}
