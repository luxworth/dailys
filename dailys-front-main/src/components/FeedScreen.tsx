import React from 'react';
import { DailyTask } from '../types';
import { Focus, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';

interface FeedScreenProps {
  task: DailyTask;
  onNavigateToDaily: () => void;
}

export function FeedScreen({ task, onNavigateToDaily }: FeedScreenProps) {
  const isUnlocked = task.status === 'SUBMITTED';

  const posts = [
    { id: 1, user: "USER_849", time: "14:22", proof: "42 tiles", type: "NUMBER", emoji1: "🤯", emoji2: "😂", emoji3: "🫡" },
    { id: 2, user: "USER_012", time: "11:05", proof: "[IMAGE: Blueprints]", type: "IMAGE", emoji1: "🔥", emoji2: "🤯", emoji3: "👀" },
    { id: 3, user: "USER_773", time: "09:14", proof: "The walls are breathing.", type: "TEXT", emoji1: "👀", emoji2: "😂", emoji3: "🔥" },
    { id: 4, user: "USER_991", time: "08:00", proof: "18", type: "NUMBER", emoji1: "🫡", emoji2: "🔥", emoji3: "🫡" },
    { id: 5, user: "USER_044", time: "07:33", proof: "0", type: "NUMBER", emoji1: "😂", emoji2: "😂", emoji3: "👀" },
  ];

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-app-bg text-app-text">
       {/* Header */}
       <div className="flex justify-between items-center p-6 border-b border-app-border bg-app-bg z-10 shrink-0">
        <h1 className="font-mono text-sm tracking-widest uppercase theme-heading">Global Feed</h1>
        <div className="font-mono text-xs text-app-muted">DAY 042</div>
      </div>

      <div className="flex-1 overflow-y-auto w-full relative">
        <div className={cn(
          "flex flex-col p-4 gap-4 pb-20 transition-all duration-700 w-full max-w-full",
          !isUnlocked && "blur-[8px] opacity-40 scale-95 pointer-events-none select-none"
        )}>
          {posts.map((post) => (
             <div key={post.id} className="p-4 border border-app-border bg-app-surface gap-3 flex flex-col technical-border iso-interactive w-full">
               <div className="flex justify-between items-start">
                 <div className="font-mono text-[10px] text-app-muted uppercase tracking-widest flex items-center gap-1.5">
                    <Focus size={10} className="text-app-accent" />
                    {post.user}
                 </div>
                 <div className="font-mono text-[9px] text-app-muted">{post.time}</div>
               </div>
               <div className="font-mono text-xl py-4 pb-2 break-words">
                 {post.proof}
               </div>
               
               {/* Reactions */}
               <div className="flex gap-2 mt-2 pt-3 border-t border-app-border border-dashed">
                 {[post.emoji1, post.emoji2, post.emoji3].map((emoji, i) => (
                    <button key={i} className="flex items-center justify-center w-8 h-8 rounded-none border border-app-border bg-app-bg hover:bg-app-border hover:scale-110 active:scale-95 transition-all text-sm technical-border">
                      {emoji}
                    </button>
                 ))}
               </div>
             </div>
          ))}
        </div>

        {/* Lock Overlay */}
        {!isUnlocked && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-app-bg/50 backdrop-blur-sm">
             <div className="w-20 h-20 mb-6 flex items-center justify-center border border-app-border bg-app-surface technical-border">
               <EyeOff size={32} className="text-app-muted" />
             </div>
             <h2 className="font-display text-2xl tracking-tight mb-2 text-center theme-heading text-app-text">Feed Locked</h2>
             <p className="font-sans text-sm text-app-muted text-center max-w-[250px] mb-8">
               You must submit today's proof to unlock the global feed.
             </p>
             <button 
               onClick={onNavigateToDaily}
               className="w-full bg-app-text text-app-bg font-sans font-semibold py-4 uppercase tracking-[0.2em] text-sm hover:opacity-90 active:scale-[0.98] transition-all technical-border iso-interactive theme-heading"
             >
               Submit Proof
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
