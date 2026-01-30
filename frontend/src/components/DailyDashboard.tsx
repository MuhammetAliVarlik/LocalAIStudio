import React, { useState, useEffect } from 'react';
import { CloudRain, TrendingUp, Calendar, CheckSquare, Bell, MoreHorizontal, ArrowUpRight, DollarSign, Newspaper, ExternalLink, Activity, Cpu, Sparkles, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Widget = ({ title, children, className = '', icon: Icon, headerAction }: { title: string, children: React.ReactNode, className?: string, icon: any, headerAction?: React.ReactNode }) => (
    <div className={`glass-panel rounded-2xl p-5 flex flex-col ${className} hover:border-white/20 transition-all duration-300 group shadow-lg`}>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 group-hover:text-zinc-300 transition-colors">
                <Icon size={14} className="text-zinc-500 group-hover:text-cyan-400 transition-colors" /> {title}
            </h3>
            {headerAction || <button className="text-zinc-600 hover:text-white transition-colors"><MoreHorizontal size={14}/></button>}
        </div>
        <div className="flex-1 flex flex-col">
            {children}
        </div>
    </div>
);

// Typewriter effect for the briefing
const Typewriter = ({ text }: { text: string }) => {
    const [displayed, setDisplayed] = useState('');
    
    useEffect(() => {
        setDisplayed('');
        let i = 0;
        const interval = setInterval(() => {
            if (i < text.length) {
                setDisplayed(prev => prev + text.charAt(i));
                i++;
            } else {
                clearInterval(interval);
            }
        }, 20); // Speed
        return () => clearInterval(interval);
    }, [text]);

    return <p className="text-zinc-300 leading-relaxed text-sm font-light font-sans">{displayed}</p>;
};

export const DailyDashboard: React.FC = () => {
  const { state, actions } = useAppContext();
  const { user, automationTasks, activeAgentId, agents } = state;
  const activeAgent = agents.find(a => a.id === activeAgentId) || agents[0];
  
  const [briefing, setBriefing] = useState<string>('');
  const [isLoadingBriefing, setIsLoadingBriefing] = useState(false);
  const [currentDate, setCurrentDate] = useState('');

  // 1. Fetch AI Briefing on Mount or Agent Switch
  useEffect(() => {
    const fetchBriefing = async () => {
        setIsLoadingBriefing(true);
        try {
            const res = await fetch(`${API_URL}/api/briefing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ persona_id: activeAgentId })
            });
            const data = await res.json();
            setBriefing(data.briefing || "Systems nominal. Ready for input.");
        } catch (e) {
            setBriefing("Unable to establish neural uplink for briefing.");
        } finally {
            setIsLoadingBriefing(false);
        }
    };
    fetchBriefing();

    // Date String
    const date = new Date();
    setCurrentDate(date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));
  }, [activeAgentId]);

  // Filter Tasks
  const activeTasks = automationTasks.filter(t => t.status === 'running');
  const recentTasks = automationTasks.slice(0, 5);

  return (
    <div className="w-full h-full p-6 md:p-10 overflow-y-auto custom-scrollbar bg-black/20">
        {/* Dynamic Header */}
        <header className="mb-10 animate-fade-in flex flex-col md:flex-row justify-between md:items-end gap-4">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                    Good Morning, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{user?.name || 'Architect'}</span>.
                </h1>
                <p className="text-zinc-500 font-mono text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    SYSTEM ONLINE • {currentDate.toUpperCase()}
                </p>
            </div>
            <div className="flex gap-2">
                 <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2">
                     <Calendar size={14} /> CALENDAR
                 </button>
                 <button className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-xs font-bold text-cyan-400 hover:bg-cyan-500/20 transition-all flex items-center gap-2">
                     <Terminal size={14} /> NEW SESSION
                 </button>
            </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-auto gap-6 pb-20">
            
            {/* 1. AI BRIEFING (Hero Card) */}
            <div className="md:col-span-2 md:row-span-1 glass-panel rounded-2xl p-6 relative overflow-hidden border border-white/10 bg-gradient-to-br from-indigo-900/10 to-transparent">
                 <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                 <div className="flex items-center gap-3 mb-4">
                     <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                         <Sparkles className="text-indigo-400" size={20} />
                     </div>
                     <div>
                         <h3 className="font-bold text-white text-sm">Daily Briefing</h3>
                         <div className="text-[10px] text-zinc-500 font-mono uppercase">Generated by {activeAgent.name}</div>
                     </div>
                 </div>
                 <div className="min-h-[80px]">
                     {isLoadingBriefing ? (
                         <div className="flex items-center gap-2 text-zinc-500 text-sm animate-pulse">
                             <Activity size={14} className="animate-spin" /> Analyzing neural patterns...
                         </div>
                     ) : (
                         <Typewriter text={briefing} />
                     )}
                 </div>
            </div>

            {/* 2. SYSTEM HEALTH (Mock) */}
            <Widget title="System Status" icon={Cpu} className="md:col-span-1 bg-black/40">
                <div className="space-y-4 mt-2">
                    <div>
                        <div className="flex justify-between text-[10px] text-zinc-500 font-bold mb-1 uppercase">
                            <span>CPU Load</span> <span>32%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-[32%] rounded-full" />
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-[10px] text-zinc-500 font-bold mb-1 uppercase">
                            <span>Memory</span> <span>12.4GB / 32GB</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-500 w-[45%] rounded-full" />
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-[10px] text-zinc-500 font-bold mb-1 uppercase">
                            <span>Storage</span> <span>1.2TB Free</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 w-[78%] rounded-full" />
                        </div>
                    </div>
                </div>
            </Widget>

            {/* 3. WEATHER (Mock) */}
            <Widget title="Atmosphere" icon={CloudRain} className="md:col-span-1 bg-gradient-to-b from-blue-900/10 to-transparent">
                <div className="flex flex-col items-center justify-center flex-1 text-center">
                    <CloudRain size={48} className="text-blue-400 mb-2 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]" />
                    <div className="text-4xl font-bold text-white">64°</div>
                    <div className="text-blue-300 text-xs font-bold uppercase tracking-wider mt-1">Heavy Rain</div>
                </div>
            </Widget>

            {/* 4. ACTIVE TASKS (Real Data) */}
            <Widget title="Active Protocols" icon={Activity} className="md:col-span-2 md:row-span-2" headerAction={<div className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-bold border border-amber-500/20">{activeTasks.length} RUNNING</div>}>
                 <div className="space-y-3 mt-2">
                     {recentTasks.length === 0 ? (
                         <div className="text-center text-zinc-600 text-sm py-8">No automation tasks in queue.</div>
                     ) : (
                         recentTasks.map(task => (
                             <div key={task.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                                  <div className={`p-2 rounded-lg ${task.status === 'running' ? 'bg-amber-500/10 text-amber-500' : task.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-500'}`}>
                                      {task.status === 'running' ? <Activity size={16} className="animate-spin-slow" /> : <CheckSquare size={16} />}
                                  </div>
                                  <div className="flex-1">
                                      <h4 className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">{task.name}</h4>
                                      <p className="text-[10px] text-zinc-500 font-mono">{task.type} • Last run: {task.lastRun}</p>
                                  </div>
                                  <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full ${task.efficiency > 90 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{width: `${task.efficiency}%`}} />
                                  </div>
                                  <span className="text-[10px] text-zinc-500 font-mono w-8 text-right">{task.efficiency}%</span>
                             </div>
                         ))
                     )}
                 </div>
                 <button onClick={() => actions.setMode('AUTOMATION' as any)} className="mt-auto w-full py-3 border-t border-white/5 text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors">
                     View All Automations
                 </button>
            </Widget>

            {/* 5. NEWS FEED (Mock Masonry) */}
            <Widget title="Global Intel" icon={Newspaper} className="md:col-span-2 md:row-span-2">
                 <div className="grid grid-cols-2 gap-4">
                     {[
                         { src: 'TechCrunch', title: 'Generative AI models reach new efficiency milestone in edge computing', img: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=400&auto=format&fit=crop' },
                         { src: 'The Verge', title: 'SpaceX launches new satellite constellation for global coverage', img: 'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?q=80&w=400&auto=format&fit=crop' },
                         { src: 'Wired', title: 'The future of neural interfaces: Direct brain-to-text communication', img: 'https://images.unsplash.com/photo-1555255707-c07966088b7b?q=80&w=400&auto=format&fit=crop' },
                         { src: 'Ars Technica', title: 'Quantum computing breakthrough enables new encryption standards', img: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=400&auto=format&fit=crop' },
                     ].map((n, i) => (
                         <div key={i} className="group cursor-pointer">
                              <div className="aspect-video rounded-lg overflow-hidden mb-2 border border-white/5 relative">
                                  <img src={n.img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-60 group-hover:opacity-100" />
                                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-white border border-white/10">{n.src}</div>
                              </div>
                              <h4 className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors leading-snug line-clamp-2">{n.title}</h4>
                         </div>
                     ))}
                 </div>
            </Widget>

            {/* 6. FINANCE (Mini) */}
            <Widget title="Market Watch" icon={TrendingUp} className="md:col-span-1">
                 <div className="flex flex-col gap-4 mt-2">
                     <div className="flex justify-between items-center group cursor-pointer">
                         <div className="flex flex-col">
                             <span className="text-xs font-bold text-zinc-300 group-hover:text-white">BTC</span>
                             <span className="text-[10px] text-zinc-500">Bitcoin</span>
                         </div>
                         <div className="flex flex-col items-end">
                             <span className="text-sm font-mono font-bold text-white">$64,230</span>
                             <span className="text-[10px] text-emerald-400 flex items-center">+1.2% <ArrowUpRight size={8} /></span>
                         </div>
                     </div>
                     <div className="w-full h-px bg-white/5" />
                     <div className="flex justify-between items-center group cursor-pointer">
                         <div className="flex flex-col">
                             <span className="text-xs font-bold text-zinc-300 group-hover:text-white">NVDA</span>
                             <span className="text-[10px] text-zinc-500">NVIDIA Corp</span>
                         </div>
                         <div className="flex flex-col items-end">
                             <span className="text-sm font-mono font-bold text-white">$892.10</span>
                             <span className="text-[10px] text-emerald-400 flex items-center">+3.4% <ArrowUpRight size={8} /></span>
                         </div>
                     </div>
                 </div>
            </Widget>

             {/* 7. QUICK ACTION */}
            <div className="md:col-span-1 glass-panel rounded-2xl p-5 border border-dashed border-zinc-700 hover:border-zinc-500 hover:bg-white/5 transition-all cursor-pointer flex flex-col items-center justify-center text-zinc-500 hover:text-white group">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <DollarSign size={20} />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest">Add Widget</span>
            </div>

        </div>
    </div>
  );
};