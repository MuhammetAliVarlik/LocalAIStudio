import React from 'react';
import { Calendar as CalIcon, Clock, MoreHorizontal, Wand2, ChevronLeft, ChevronRight } from 'lucide-react';

const TimeBlock = ({ start, duration, title, color }: { start: number, duration: number, title: string, color: string }) => {
    // 1 hour = 120px width
    const left = (start - 8) * 120; // Starts at 8AM
    const width = duration * 120;
    
    return (
        <div 
            className={`absolute top-4 h-24 rounded-xl p-3 border-l-4 ${color} bg-opacity-20 backdrop-blur-sm hover:scale-[1.02] transition-transform cursor-pointer group`}
            style={{ left: `${left}px`, width: `${width}px`, backgroundColor: color.replace('border-', 'bg-').replace('500', '500/20') }}
        >
            <div className="text-xs font-bold text-white mb-1">{title}</div>
            <div className="text-[10px] text-white/70 group-hover:text-white">
                {start}:00 - {start + duration}:00
            </div>
        </div>
    );
};

export const TemporalCalendar: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col p-6 overflow-hidden">
        <header className="flex justify-between items-end mb-8">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <CalIcon className="text-violet-400" /> Temporal Nexus
                </h1>
                <p className="text-zinc-500 text-sm mt-1">Schedule optimization engine.</p>
            </div>
            <div className="flex gap-4">
                <div className="flex items-center gap-2 text-white font-mono bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                    <ChevronLeft size={16} className="cursor-pointer hover:text-violet-400"/>
                    <span>Oct 24, 2024</span>
                    <ChevronRight size={16} className="cursor-pointer hover:text-violet-400"/>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-violet-500/10 text-violet-300 border border-violet-500/20 rounded-lg text-xs font-bold hover:bg-violet-500/20 transition-all animate-pulse">
                    <Wand2 size={14} /> OPTIMIZE DAY
                </button>
            </div>
        </header>

        {/* Timeline Container */}
        <div className="flex-1 glass-panel rounded-2xl border border-white/5 relative overflow-x-auto custom-scrollbar overflow-y-hidden">
            <div className="min-w-[1400px] h-full relative p-6">
                
                {/* Time Markers */}
                <div className="absolute top-0 left-0 right-0 h-8 border-b border-white/5 flex">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="w-[120px] text-[10px] text-zinc-600 font-mono pl-2 border-l border-white/5 h-full pt-2">
                            {i + 8}:00
                        </div>
                    ))}
                </div>

                {/* Grid Lines */}
                <div className="absolute top-8 bottom-0 left-0 right-0 flex pointer-events-none">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="w-[120px] border-l border-white/5 h-full" />
                    ))}
                </div>

                {/* Events Layer */}
                <div className="absolute top-12 left-0 right-0 h-40">
                    <TimeBlock start={9} duration={1.5} title="Deep Work: Coding" color="border-cyan-500" />
                    <TimeBlock start={11} duration={1} title="Team Sync" color="border-pink-500" />
                    <TimeBlock start={13} duration={1} title="Lunch Break" color="border-zinc-500" />
                    <TimeBlock start={14.5} duration={2} title="Project Titan" color="border-amber-500" />
                    
                    {/* Free Slot Indicator */}
                    <div className="absolute top-4 left-[960px] w-[120px] h-24 border-2 border-dashed border-emerald-500/30 rounded-xl flex items-center justify-center">
                        <span className="text-emerald-500/50 text-xs font-bold uppercase">Focus Slot</span>
                    </div>
                </div>

                {/* Current Time Line */}
                <div className="absolute top-8 bottom-0 left-[300px] w-0.5 bg-red-500 z-10">
                    <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full" />
                </div>

            </div>
        </div>
    </div>
  );
};