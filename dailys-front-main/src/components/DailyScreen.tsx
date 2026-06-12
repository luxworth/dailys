import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Flame, Focus, Monitor, Camera, Lock, XCircle, Ghost } from 'lucide-react';
import { cn, getMidnightCountdown } from '../lib/utils';
import { DailyTask, TaskType } from '../types';

interface DailyScreenProps {
  task: DailyTask;
  setTask: React.Dispatch<React.SetStateAction<DailyTask>>;
}

export function DailyScreen({ task, setTask }: DailyScreenProps) {
  const [timeLeft, setTimeLeft] = useState(getMidnightCountdown());
  const [inputValue, setInputValue] = useState('');
  const [ghostsRemaining, setGhostsRemaining] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getMidnightCountdown());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = () => {
    if (!inputValue && task.type !== 'IMAGE') return;
    setTask(prev => ({ ...prev, status: 'SUBMITTED', submission: inputValue, completedAt: Date.now() }));
  };

  const handleSimulateFail = () => {
    setTask(prev => ({ ...prev, status: 'FAILED' }));
  };
  
  const handleDeployGhost = () => {
    if (ghostsRemaining > 0) {
      setGhostsRemaining(prev => prev - 1);
      setTask(prev => ({ ...prev, status: 'SUBMITTED', submission: '[GHOST MODE DEPLOYED]', completedAt: Date.now() }));
    }
  }

  const renderInputArea = () => {
    if (task.status === 'SUBMITTED') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 rounded-full border border-app-border flex items-center justify-center bg-app-surface mb-6 iso-interactive technical-border">
            {task.submission === '[GHOST MODE DEPLOYED]' ? (
              <Ghost className="text-app-success opacity-80" size={32} />
            ) : (
              <Lock className="text-app-success" size={32} />
            )}
          </div>
          <div className="font-mono text-app-success tracking-widest text-sm mb-2 uppercase theme-heading">
            {task.submission === '[GHOST MODE DEPLOYED]' ? 'Streak Saved' : 'Proof Recorded'}
          </div>
          <div className="font-sans text-app-muted text-sm text-center">
            {task.submission === '[GHOST MODE DEPLOYED]' ? 'The ghost walks in your place. Return tomorrow.' : 'Day secured. Return tomorrow.'}
          </div>
          
          <div className="mt-8 font-mono text-3xl text-app-text py-4 px-8 border border-app-border bg-app-bg text-center min-w-[200px] technical-border iso-interactive">
             <span className="opacity-70">{task.submission}</span>
          </div>
        </div>
      );
    }

    if (task.status === 'FAILED') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 rounded-full border border-app-border flex items-center justify-center bg-app-surface mb-6 iso-interactive technical-border">
            <XCircle className="text-app-danger" size={32} />
          </div>
          <div className="font-mono text-app-danger tracking-widest text-sm mb-2 uppercase theme-heading">Deadline Missed</div>
          <div className="font-sans text-app-muted text-sm text-center">The day is lost. Try again tomorrow.</div>
          
          {ghostsRemaining > 0 && (
             <button 
               onClick={handleDeployGhost}
               className="mt-8 flex items-center gap-2 font-mono text-xs text-white bg-app-surface px-4 py-2 border border-app-border hover:bg-white/5 transition-colors technical-border iso-interactive"
             >
                <Ghost size={14} className="text-white/80" /> Deploy Ghost Mode
             </button>
          )}
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col justify-end pb-4 pt-8">
        {task.type === 'NUMBER' && (
          <input 
            type="number" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="0" 
            className="typewriter-input w-full bg-transparent text-center font-mono text-7xl text-app-text placeholder:text-app-muted/50 border-b-2 border-app-border focus:border-app-accent outline-none pb-4 transition-colors" 
          />
        )}
        
        {task.type === 'TEXT' && (
           <textarea 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your response..." 
            className="typewriter-input w-full h-32 bg-transparent font-sans text-lg text-app-text placeholder:text-app-muted/50 border border-app-border p-4 focus:border-app-accent outline-none transition-colors resize-none technical-border" 
          />
        )}
        
        {task.type === 'IMAGE' && (
           <button className="w-full aspect-video border-2 border-dashed border-app-border focus:border-app-accent hover:border-app-muted text-app-muted flex flex-col items-center justify-center gap-3 transition-colors iso-interactive technical-border">
              <Camera size={32} />
              <span className="font-mono text-xs tracking-widest">TAP TO CAPTURE</span>
           </button>
        )}

        <button 
          onClick={handleSubmit}
          disabled={!inputValue && task.type !== 'IMAGE'}
          className="w-full bg-app-text text-app-bg font-sans font-semibold py-5 mt-8 uppercase tracking-[0.2em] text-sm hover:opacity-90 active:scale-[0.98] disabled:opacity-30 disabled:active:scale-100 transition-all select-none iso-interactive technical-border theme-heading"
        >
          Submit Proof
        </button>
        
        {/* Dev tool for exploring states */}
        <div className="mt-8 flex justify-center gap-4">
           {['NUMBER', 'TEXT', 'IMAGE'].map((t) => (
             <button key={t} onClick={() => { setTask(p => ({...p, type: t as TaskType, status: 'PENDING'})); setInputValue(''); }} className={cn("text-[10px] font-mono", task.type === t ? "text-app-accent underline" : "text-app-muted hover:text-app-text")}>
               USE {t}
             </button>
           ))}
           <button onClick={handleSimulateFail} className="text-[10px] font-mono text-app-danger hover:text-red-400">SIMULATE FAIL</button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-app-border bg-app-bg">
        <h1 className="font-mono text-sm tracking-widest text-app-text uppercase theme-heading">dailys.</h1>
        <div className="flex items-center gap-4">
          {ghostsRemaining > 0 && (
             <button onClick={handleDeployGhost} className="relative group transition-transform active:scale-95" title="Ghost Mode (Streak Saver)">
               <Ghost size={16} className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] opacity-80 group-hover:opacity-100" />
               <span className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full flex items-center justify-center text-[8px] font-mono text-black font-bold">1</span>
             </button>
          )}
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-app-muted">STREAK</span>
            <span className="text-app-text bg-app-surface px-3 py-1.5 border border-app-border flex items-center gap-1.5 technical-border">
              <Flame size={12} className="text-app-accent" /> 12
            </span>
          </div>
        </div>
      </div>

      {/* Date / Countdown */}
      <div className="px-6 py-10 flex flex-col items-center justify-center border-b border-app-border bg-app-surface transition-colors duration-300">
         <div className="text-app-muted font-mono text-[10px] mb-3 tracking-[0.3em]">TIME REMAINING</div>
         <div className="text-6xl font-mono tracking-tighter text-app-text font-medium drop-shadow-sm theme-heading">{timeLeft}</div>
         <div className="text-app-muted font-mono text-xs mt-5 uppercase tracking-[0.2em]">{format(new Date(), 'EEEE')} &rsaquo; {format(new Date(), 'MMM do')}</div>
      </div>

      {/* Task Content */}
      <div className="p-6 flex-1 flex flex-col">
         <div className="inline-block bg-app-surface border border-app-border text-app-muted px-2.5 py-1 text-[10px] font-mono mb-6 uppercase tracking-wider self-start flex items-center gap-1.5 technical-border">
           <Focus size={10} className={task.status === 'PENDING' ? 'text-app-accent' : (task.status === 'SUBMITTED' ? 'text-app-success' : 'text-app-danger')} /> 
           TASK 042 &mdash; {task.type}
         </div>
         <h2 className="font-display text-4xl leading-[1.1] tracking-tight mb-2 theme-heading text-app-text">
           {task.title}
         </h2>
         
         {renderInputArea()}
      </div>
    </div>
  );
}
