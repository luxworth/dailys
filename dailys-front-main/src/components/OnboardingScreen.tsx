import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Lock, ShieldAlert, Award, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const STORY_DURATION = 8000; // 8 seconds per slide

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const isPausedRef = useRef(false);

  const totalSlides = 5;

  const slides = [
    {
      id: 1,
      headline: "DIRECTIVE 01: THE PROTOCOL",
      body: "Every day at 00:00, a single, cryptic task is issued globally. (e.g., \"Count the tiles in your bathroom\"). You have until midnight to execute and submit proof—be it text, a number, or a photographic capture.",
      visual: (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-black/40 border-2 border-app-border relative overflow-hidden">
          <Terminal className="text-app-muted absolute top-4 left-4" size={20} />
          <div className="font-mono text-app-accent mb-4 tracking-[0.2em] text-xs">COUNTDOWN</div>
          <div className="font-mono text-5xl sm:text-6xl text-app-text font-bold mb-8">14:59:59</div>
          <div className="w-full bg-app-surface p-4 border border-app-border flex items-center justify-center">
            <span className="font-mono text-sm bg-black text-white px-2 py-1 select-none">████████ MISSION ████████</span>
          </div>
        </div>
      )
    },
    {
      id: 2,
      headline: "DIRECTIVE 02: EARN YOUR FEED",
      body: "The global network is dark by default. The main feed is locked, encrypted, and blurred. Access is earned, not given. Submit your daily proof to decrypt the feed and witness how the rest of the world executed the protocol.",
      visual: (
        <div className="w-full h-full relative border-2 border-app-border overflow-hidden bg-black/40">
           {/* Mock blurred grid */}
           <div className="absolute inset-0 grid grid-cols-2 gap-2 p-2 blur-[6px] opacity-50 pointer-events-none">
             {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-app-surface border border-app-border h-24"></div>
             ))}
           </div>
           {/* Lock Overlay */}
           <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-app-bg/60">
              <Lock size={48} className="text-app-muted mb-4" />
              <div className="font-mono text-xs text-app-text tracking-[0.2em] text-center border-t border-b border-app-border py-2 px-4 bg-app-surface">
                LOCKED<br/>AWAITING DATA SUBMISSION
              </div>
           </div>
        </div>
      )
    },
    {
      id: 3,
      headline: "DIRECTIVE 03: ZERO TOLERANCE",
      body: "Accountability is absolute. Missing a single day permanently terminates your streak. Your only defense is 'Ghost Mode'—rare, earned tokens that shield your history when operational deployment is impossible.",
      visual: (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-black/40 border-2 border-app-border">
          <div className="text-app-muted font-mono text-[10px] mb-2 tracking-[0.3em]">CURRENT STREAK</div>
          <div className="text-[5rem] font-mono tracking-tighter text-app-text font-medium leading-none mb-8">42</div>
          
          <button className="flex items-center gap-2 font-mono text-xs text-white bg-app-surface px-4 py-3 border border-app-accent hover:bg-white/5 transition-colors technical-border w-full justify-center opacity-80">
            <ShieldAlert size={14} className="text-app-accent" /> DEPLOY GHOST TOKEN
          </button>
        </div>
      )
    },
    {
      id: 4,
      headline: "DIRECTIVE 04: THE LEDGER",
      body: "You do not operate alone. Compete in hyper-localized micro-leaderboards (Squads). Rise through prestige tiers—from baseline status up to 'Plasma Flame'—and archive your operational history with 3D digital trophies stored securely in your Ledger.",
      visual: (
        <div className="w-full h-full flex flex-col p-4 bg-black/40 border-2 border-app-border">
          <div className="flex border-b border-app-border pb-4 mb-4 items-center gap-4">
             <div className="w-12 h-12 border border-blue-500/40 bg-app-bg flex items-center justify-center relative">
               <div className="absolute inset-0 shadow-[0_0_10px_rgba(96,165,250,0.5)]"></div>
               <Award className="text-blue-400" size={24} />
             </div>
             <div>
                <div className="font-mono text-xs text-[#60A5FA]">PLASMA FLAME TIER</div>
                <div className="font-mono text-[10px] text-app-muted">TOP 3%</div>
             </div>
          </div>
          
          <div className="flex-1 flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-app-border bg-app-surface p-2 flex justify-between items-center opacity-70">
                 <span className="font-mono text-xs">USER_00{i}</span>
                 <span className="font-mono text-[10px] text-app-muted">{50 - i * 5} DAYS</span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 5,
      headline: "INITIALIZE ACCESS",
      body: "Establish your secure connection to the network.",
      visual: null // Auth UI goes directly in the body
    }
  ];

  // Auto-advance logic
  useEffect(() => {
    if (currentSlide === totalSlides - 1) {
      setProgress(100);
      return; // Stop at auth screen
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      
      if (!isPausedRef.current) {
        const elapsed = timestamp - startTimeRef.current;
        const currentProgress = Math.min((elapsed / STORY_DURATION) * 100, 100);
        setProgress(currentProgress);

        if (currentProgress >= 100) {
          handleNext();
        }
      } else {
         // adjust start time so progress doesn't jump when unpaused
         startTimeRef.current = timestamp - (progress / 100) * STORY_DURATION;
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [currentSlide, progress]);

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(s => s + 1);
      setProgress(0);
      startTimeRef.current = undefined;
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(s => s - 1);
      setProgress(0);
      startTimeRef.current = undefined;
    }
  };

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    // If we're on the last slide, let the Auth form handle its own clicks
    if (currentSlide === totalSlides - 1) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) {
      handlePrev();
    } else {
      handleNext();
    }
  };

  const handlePointerDown = () => { isPausedRef.current = true; };
  const handlePointerUp = () => { isPausedRef.current = false; };

  const current = slides[currentSlide];

  return (
    <div className="w-full h-full flex flex-col bg-app-bg text-app-text absolute inset-0 z-50">
      
      {/* Progress Bars */}
      <div className="flex gap-1 p-4 pt-6 shrink-0 z-10 w-full relative">
        {slides.map((slide, index) => (
          <div key={slide.id} className="h-1 flex-1 bg-app-border/40 overflow-hidden technical-border relative">
            <div 
              className="h-full bg-app-text transition-all duration-[50ms] linear"
              style={{ 
                width: index < currentSlide ? '100%' : index === currentSlide ? `${progress}%` : '0%' 
              }}
            />
          </div>
        ))}
      </div>

      <div 
        className="flex-1 flex flex-col relative w-full h-full overflow-hidden"
        onClick={handleTap}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >

        {/* Content Area */}
        <div className="flex-1 flex flex-col justify-between p-6 overflow-y-auto w-full max-w-lg mx-auto pointer-events-none">
           <div>
             {currentSlide < totalSlides - 1 ? (
               <div className="font-mono text-xs tracking-widest text-app-muted mb-6 uppercase">
                 INIT SEQUENCE [{currentSlide + 1}/{totalSlides - 1}]
               </div>
             ) : (
               <div className="font-mono text-xs tracking-widest text-app-accent mb-6 uppercase">
                 SECURE TERMINAL
               </div>
             )}
             
             <h1 className="font-display text-3xl font-bold uppercase tracking-tight mb-4 theme-heading leading-tight">
               {current.headline}
             </h1>
             
             <p className="font-sans text-sm text-app-muted leading-relaxed">
               {current.body}
             </p>
           </div>
           
           <div className="flex-1 flex items-center justify-center my-8">
              {currentSlide < totalSlides - 1 ? (
                <div className="w-full aspect-[4/5] sm:aspect-square">
                  {current.visual}
                </div>
              ) : (
                <div className="w-full pt-8 pointer-events-auto">
                   {/* Auth UI */}
                   <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); onComplete(); }}>
                     <div className="flex flex-col gap-1">
                       <label className="font-mono text-[10px] text-app-muted tracking-[0.2em] uppercase">IDENTIFICATION</label>
                       <input 
                         type="text" 
                         placeholder="USER_ID OR EMAIL" 
                         className="w-full bg-black/40 border-2 border-app-border p-4 font-mono text-white outline-none focus:border-app-accent transition-colors"
                         required
                       />
                     </div>
                     
                     <div className="flex flex-col gap-1">
                       <label className="font-mono text-[10px] text-app-muted tracking-[0.2em] uppercase">PASSPHRASE</label>
                       <input 
                         type="password" 
                         placeholder="••••••••••" 
                         className="w-full bg-black/40 border-2 border-app-border p-4 font-mono text-white outline-none focus:border-app-accent transition-colors"
                         required
                       />
                     </div>

                     <button 
                       type="submit"
                       className="w-full bg-app-text text-app-bg font-sans font-bold py-5 mt-4 uppercase tracking-[0.2em] text-sm hover:opacity-90 active:scale-[0.98] transition-all technical-border iso-interactive theme-heading"
                     >
                       INITIALIZE
                     </button>
                     
                     <div className="flex items-center gap-4 my-4">
                        <div className="flex-1 h-px bg-app-border"></div>
                        <span className="font-mono text-[10px] text-app-muted tracking-widest">OR</span>
                        <div className="flex-1 h-px bg-app-border"></div>
                     </div>

                     <button 
                       type="button"
                       onClick={onComplete}
                       className="w-full bg-transparent border-2 border-app-border text-app-text font-mono font-bold py-4 uppercase tracking-[0.1em] text-xs hover:bg-app-surface active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                     >
                       <Terminal size={14} /> AUTHENTICATE VIA SSO
                     </button>
                   </form>
                </div>
              )}
           </div>

        </div>

      </div>

      {/* Footer Controls (for accessibility / explicit actions) */}
      {currentSlide < totalSlides - 1 && (
        <div className="absolute bottom-6 right-6 z-20 pointer-events-auto flex items-center gap-4">
           {currentSlide < totalSlides - 2 && (
             <button 
                onClick={() => setCurrentSlide(totalSlides - 1)}
                className="font-mono text-[10px] tracking-widest text-app-muted hover:text-white uppercase px-2 py-1"
             >
               SKIP
             </button>
           )}
           <button 
              onClick={handleNext}
              className="flex items-center justify-center w-12 h-12 bg-app-surface border border-app-border text-app-text hover:bg-app-border hover:scale-105 active:scale-95 transition-all technical-border"
           >
             <ChevronRight size={20} />
           </button>
        </div>
      )}
      
    </div>
  );
}
