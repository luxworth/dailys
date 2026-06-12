import React from 'react';
import { ThemeId } from '../types';
import { Check, Settings2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface SettingsScreenProps {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
}

export function SettingsScreen({ theme, setTheme }: SettingsScreenProps) {
    const themes: { id: ThemeId; name: string; desc: string }[] = [
    { id: 'typewriter-ritual', name: 'Typewriter Ritual', desc: 'Focus and permanence of typed print.' },
    { id: 'arcade-ledger', name: 'Arcade Ledger', desc: 'The structured challenge and status of classic arcade interfaces.' },
    { id: 'field-notes', name: 'Field Notes', desc: 'Observation and cataloging, like a personal fieldwork journal.' },
    { id: 'analog-static', name: 'Analog Static', desc: 'Intentional signal from the noise, like a shortwave radio.' },
    { id: 'industrial', name: 'Industrial', desc: 'Utilitarian and sharp, blending concrete greys with vibrant orange.' },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-y-auto w-full max-w-full">
       <div className="px-6 py-12 flex flex-col items-center justify-center border-b border-app-border bg-app-surface transition-colors duration-300">
         <Settings2 size={48} className="text-app-accent mb-4 opacity-80" strokeWidth={1} />
         <div className="text-4xl font-display tracking-tight font-medium mb-2 theme-heading text-app-text">Settings</div>
         <div className="text-app-muted font-sans text-sm tracking-widest uppercase">Preferences</div>
       </div>

       <div className="p-6 pb-24">
         <h3 className="font-mono text-xs tracking-widest text-app-text uppercase mb-6 theme-heading">Themes</h3>
         
         <div className="flex flex-col gap-3">
           {themes.map((t) => (
             <button
               key={t.id}
               onClick={() => setTheme(t.id)}
               className={cn(
                 "p-4 border text-left transition-all flex justify-between items-center group iso-interactive technical-border",
                 theme === t.id 
                  ? "border-app-accent bg-app-surface text-app-text" 
                  : "border-app-border/50 text-app-muted hover:border-app-muted hover:text-app-text"
               )}
             >
               <div className="flex flex-col gap-1 w-full max-w-[80%]">
                 <span className="font-display text-sm tracking-wide uppercase transition-colors">{t.name}</span>
                 <span className="font-sans text-xs opacity-70 leading-relaxed">{t.desc}</span>
               </div>
               
               {theme === t.id && (
                 <Check className="text-app-accent shrink-0" size={18} />
               )}
             </button>
           ))}
         </div>
       </div>
    </div>
  );
}
