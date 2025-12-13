import React from 'react';
import { Activity, Moon, Footprints, Flame, Heart, MessageSquare, ArrowUpRight } from 'lucide-react';

const VitalRing = ({ percent, color, icon: Icon, label, value, sub }: { percent: number, color: string, icon: any, label: string, value: string, sub: string }) => {
    const r = 36;
    const c = 2 * Math.PI * r;
    const off = c - (percent / 100) * c;
    
    return (
        <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center relative">
            <div className="relative w-24 h-24 flex items-center justify-center mb-3">
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r={r} stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="transparent" />
                    <circle cx="48" cy="48" r={r} stroke={color} strokeWidth="6" fill="transparent" strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                </svg>
                <div className={`absolute p-2 rounded-full bg-opacity-20 ${color.replace('stroke-', 'bg-')}`}>
                    <Icon size={20} style={{ color }} />
                </div>
            </div>
            <div className="text-center">
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{label}</div>
                <div className="text-[10px] text-zinc-600 mt-1">{sub}</div>
            </div>
        </div>
    );
};

export const BioHub: React.FC = () => {
  return (
    <div className="w-full h-full flex p-6 gap-6 overflow-hidden">
        
        {/* Main Dashboard */}
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
            <header>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Activity className="text-emerald-500" /> Biometric Status
                </h1>
                <p className="text-zinc-500 text-sm">Daily physiological telemetry.</p>
            </header>

            {/* Vitals Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <VitalRing percent={78} color="#34d399" icon={Moon} label="Sleep Score" value="7h 42m" sub="Deep Sleep: 1h 20m" />
                <VitalRing percent={65} color="#fbbf24" icon={Footprints} label="Movement" value="6,432" sub="Goal: 10,000 steps" />
                <VitalRing percent={92} color="#f472b6" icon={Flame} label="Active Energy" value="840 cal" sub="High Intensity" />
            </div>

            {/* Chart Area */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 flex-1 min-h-[300px] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="font-bold text-white">Weight Trend</h3>
                        <p className="text-xs text-zinc-500">Last 7 Days</p>
                    </div>
                    <div className="px-3 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center gap-1">
                        <ArrowUpRight size={12} /> -1.2 kg
                    </div>
                </div>
                <div className="flex-1 relative flex items-end gap-2 px-2">
                    {/* Mock Chart Bars */}
                    {[40, 45, 30, 60, 55, 70, 65].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col justify-end group">
                            <div 
                                style={{ height: `${h}%` }} 
                                className="w-full bg-emerald-500/20 border-t-2 border-emerald-500 rounded-t-sm transition-all duration-500 hover:bg-emerald-500/40 relative"
                            >
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    {70 + (h/10)}kg
                                </div>
                            </div>
                            <div className="text-center text-[10px] text-zinc-600 mt-2">
                                {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Coach Sidebar */}
        <div className="w-80 glass-panel border border-white/5 rounded-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-emerald-900/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_15px_#10b981]">
                    <Heart className="text-white" size={20} fill="currentColor" />
                </div>
                <div>
                    <h3 className="font-bold text-emerald-100 text-sm">Coach Apex</h3>
                    <p className="text-xs text-emerald-400/70">Fitness Intelligence</p>
                </div>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                <div className="bg-white/5 p-3 rounded-xl rounded-tl-none border border-white/5">
                    <p className="text-xs text-zinc-300">Your heart rate recovery has improved by 5% this week. I suggest increasing interval intensity today.</p>
                </div>
                <div className="bg-emerald-500/10 p-3 rounded-xl rounded-tr-none border border-emerald-500/20 ml-8">
                    <p className="text-xs text-emerald-100">Should I focus on cardio or weights?</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl rounded-tl-none border border-white/5">
                    <p className="text-xs text-zinc-300">Given your sleep data (7h 42m), you are primed for a heavy compound lift session. Let's do Squats and Deadlifts.</p>
                </div>
            </div>

            <div className="p-4 bg-black/40 border-t border-white/5">
                <div className="relative">
                    <input type="text" placeholder="Ask coach..." className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-4 pr-10 text-xs text-white focus:border-emerald-500/50 outline-none" />
                    <button className="absolute right-2 top-2 p-1 bg-emerald-500 rounded text-black hover:bg-emerald-400 transition-colors">
                        <MessageSquare size={14} />
                    </button>
                </div>
            </div>
        </div>

    </div>
  );
};