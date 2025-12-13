import React from 'react';
import { Search, Clock, ChevronRight, Archive, X } from 'lucide-react';
import { AppMode } from '../types';

interface HistoryItem {
    id: string;
    title: string;
    preview: string;
    mode: AppMode;
    time: string;
}

const MOCK_HISTORY: HistoryItem[] = [
    { id: '1', title: 'React Performance Tuning', preview: 'Analyzing useMemo in large lists...', mode: AppMode.CODING, time: '10:42 AM' },
    { id: '2', title: 'Weekly Workout Plan', preview: 'Focus on hypertrophy and mobility...', mode: AppMode.HEALTH, time: 'Yesterday' },
    { id: '3', title: 'Project Titan Brainstorm', preview: 'Key architecture decisions regarding...', mode: AppMode.NOTES, time: 'Yesterday' },
    { id: '4', title: 'French Grammar Check', preview: 'Correction for "Je suis allé"...', mode: AppMode.LANGUAGE, time: '2 days ago' },
    { id: '5', title: 'Morning Briefing', preview: 'Weather: Rain, Stocks: Up...', mode: AppMode.DAILY, time: '3 days ago' },
];

export const HistorySidebar: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
  return (
    <>
        {/* Backdrop */}
        <div 
            className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={onClose}
        />
        
        {/* Sidebar Panel */}
        <div 
            className={`fixed top-0 left-0 bottom-0 w-80 bg-[#09090b]/95 backdrop-blur-xl border-r border-white/10 z-50 transition-transform duration-300 transform shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-5 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <Clock size={16} className="text-zinc-400" /> Omni-Recall
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-zinc-500" size={14} />
                        <input type="text" placeholder="Search across all memories..." className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-9 text-xs text-white focus:border-white/30 outline-none" />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
                    <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Today</div>
                    <div className="space-y-1 mb-4">
                        {MOCK_HISTORY.filter(h => h.time.includes('AM') || h.time.includes('PM')).map(item => (
                            <HistoryItemCard key={item.id} item={item} />
                        ))}
                    </div>

                    <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Yesterday</div>
                    <div className="space-y-1 mb-4">
                        {MOCK_HISTORY.filter(h => h.time === 'Yesterday').map(item => (
                            <HistoryItemCard key={item.id} item={item} />
                        ))}
                    </div>

                    <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Previous 7 Days</div>
                    <div className="space-y-1 mb-4">
                        {MOCK_HISTORY.filter(h => h.time.includes('days')).map(item => (
                            <HistoryItemCard key={item.id} item={item} />
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-white/10">
                    <button className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs font-bold text-zinc-300 transition-colors flex items-center justify-center gap-2">
                        <Archive size={14} /> VIEW ARCHIVES
                    </button>
                </div>
            </div>
        </div>
    </>
  );
};

const HistoryItemCard = ({ item }: { item: HistoryItem }) => {
    let badgeColor = 'bg-zinc-800 text-zinc-400';
    if (item.mode === AppMode.CODING) badgeColor = 'bg-cyan-900/30 text-cyan-400';
    if (item.mode === AppMode.HEALTH) badgeColor = 'bg-emerald-900/30 text-emerald-400';
    if (item.mode === AppMode.NOTES) badgeColor = 'bg-amber-900/30 text-amber-400';

    return (
        <div className="group p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/5">
            <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-zinc-200 text-xs truncate max-w-[140px]">{item.title}</h4>
                <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-bold ${badgeColor}`}>{item.mode}</span>
            </div>
            <p className="text-[10px] text-zinc-500 line-clamp-1">{item.preview}</p>
            <div className="flex justify-between items-center mt-2 opacity-50 group-hover:opacity-100 transition-opacity">
                <span className="text-[9px] text-zinc-600">{item.time}</span>
                <ChevronRight size={12} className="text-zinc-500" />
            </div>
        </div>
    );
};