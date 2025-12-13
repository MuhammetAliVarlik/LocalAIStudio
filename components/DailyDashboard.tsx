import React from 'react';
import { CloudRain, TrendingUp, Calendar, CheckSquare, Bell, MoreHorizontal, ArrowUpRight, DollarSign, Newspaper } from 'lucide-react';
import { motion } from 'framer-motion';

const Widget = ({ title, children, className = '', icon: Icon }: { title: string, children: React.ReactNode, className?: string, icon: any }) => (
    <div className={`glass-panel rounded-2xl p-5 flex flex-col ${className} hover:border-white/20 transition-colors group`}>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 group-hover:text-zinc-300 transition-colors">
                <Icon size={14} /> {title}
            </h3>
            <button className="text-zinc-600 hover:text-white"><MoreHorizontal size={14}/></button>
        </div>
        <div className="flex-1 flex flex-col">
            {children}
        </div>
    </div>
);

export const DailyDashboard: React.FC = () => {
  return (
    <div className="w-full h-full p-8 overflow-y-auto custom-scrollbar">
        <header className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Good Morning, Architect.</h1>
            <p className="text-zinc-500 font-mono text-sm">Here is your daily briefing.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-4 gap-4 h-[800px]">
            {/* Weather */}
            <Widget title="Atmosphere" icon={CloudRain} className="md:col-span-1 md:row-span-2 bg-gradient-to-br from-blue-900/10 to-transparent">
                <div className="flex flex-col items-center justify-center flex-1 text-center">
                    <CloudRain size={64} className="text-blue-400 mb-4 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                    <div className="text-5xl font-bold text-white mb-1">64°</div>
                    <div className="text-blue-300 font-medium">Heavy Rain</div>
                    <div className="mt-6 w-full grid grid-cols-3 text-xs text-zinc-500 border-t border-white/5 pt-4">
                         <div>
                             <div className="font-bold text-white">88%</div>
                             <div>Hum</div>
                         </div>
                         <div>
                             <div className="font-bold text-white">12mph</div>
                             <div>Wind</div>
                         </div>
                         <div>
                             <div className="font-bold text-white">0.8"</div>
                             <div>Prec</div>
                         </div>
                    </div>
                </div>
            </Widget>

            {/* Finance */}
            <Widget title="Market Watch" icon={TrendingUp} className="md:col-span-2 md:row-span-2">
                 <div className="flex gap-4 mb-6">
                     <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/5">
                         <div className="text-xs text-zinc-500 mb-1">NASDAQ</div>
                         <div className="text-xl font-bold text-white">14,892.21</div>
                         <div className="text-emerald-400 text-xs flex items-center mt-1"><ArrowUpRight size={12}/> +1.24%</div>
                     </div>
                     <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/5">
                         <div className="text-xs text-zinc-500 mb-1">BTC/USD</div>
                         <div className="text-xl font-bold text-white">$64,230</div>
                         <div className="text-red-400 text-xs flex items-center mt-1"><ArrowUpRight size={12} className="rotate-90"/> -0.45%</div>
                     </div>
                     <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/5">
                         <div className="text-xs text-zinc-500 mb-1">ETH</div>
                         <div className="text-xl font-bold text-white">$3,450</div>
                         <div className="text-emerald-400 text-xs flex items-center mt-1"><ArrowUpRight size={12}/> +2.10%</div>
                     </div>
                 </div>
                 <div className="flex-1 bg-gradient-to-t from-emerald-500/10 to-transparent rounded-lg border border-white/5 relative overflow-hidden flex items-end">
                      {/* Fake Chart */}
                      <svg className="w-full h-32 text-emerald-500" preserveAspectRatio="none" viewBox="0 0 100 100">
                          <path d="M0 100 L0 80 L10 75 L20 85 L30 60 L40 65 L50 40 L60 45 L70 20 L80 25 L90 10 L100 5 L100 100 Z" fill="currentColor" fillOpacity="0.2" />
                          <path d="M0 80 L10 75 L20 85 L30 60 L40 65 L50 40 L60 45 L70 20 L80 25 L90 10 L100 5" fill="none" stroke="currentColor" strokeWidth="2" />
                      </svg>
                 </div>
            </Widget>

            {/* Tasks */}
            <Widget title="Priority Queue" icon={CheckSquare} className="md:col-span-1 md:row-span-4">
                 <div className="space-y-2">
                     {[
                         { txt: 'Code Review: Neural Core', done: true },
                         { txt: 'Update System Prompts', done: false },
                         { txt: 'Weekly Sync with Sage', done: false },
                         { txt: 'Deploy Agent V3', done: false },
                         { txt: 'Research Quantum ML', done: false },
                     ].map((t, i) => (
                         <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                             <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${t.done ? 'bg-cyan-500 border-cyan-500' : 'border-zinc-600 group-hover:border-zinc-400'}`}>
                                 {t.done && <ArrowUpRight size={14} className="text-black rotate-45" />}
                             </div>
                             <span className={`text-sm ${t.done ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>{t.txt}</span>
                         </div>
                     ))}
                 </div>
            </Widget>

            {/* News */}
            <Widget title="Global Intel" icon={Newspaper} className="md:col-span-2 md:row-span-2">
                 <div className="space-y-4">
                     {[
                         { src: 'TechCrunch', title: 'Generative AI models reach new efficiency milestone', time: '10m ago' },
                         { src: 'The Verge', title: 'Local LLMs are the future of privacy, study says', time: '1h ago' },
                         { src: 'Wired', title: 'New neural hardware accelerates edge computing', time: '3h ago' },
                     ].map((n, i) => (
                         <div key={i} className="flex gap-4 border-b border-white/5 pb-4 last:border-0 last:pb-0 group cursor-pointer">
                              <div className="w-16 h-16 bg-zinc-800 rounded-lg flex-shrink-0"></div>
                              <div>
                                  <div className="flex items-center gap-2 mb-1">
                                      <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-zinc-300">{n.src}</span>
                                      <span className="text-[10px] text-zinc-600">{n.time}</span>
                                  </div>
                                  <h4 className="text-sm font-medium text-zinc-200 group-hover:text-cyan-400 transition-colors leading-snug">{n.title}</h4>
                              </div>
                         </div>
                     ))}
                 </div>
            </Widget>

            {/* Calendar */}
            <Widget title="Schedule" icon={Calendar} className="md:col-span-1 md:row-span-2">
                 <div className="flex flex-col gap-3">
                     <div className="p-3 bg-cyan-500/10 border-l-2 border-cyan-500 rounded-r-lg">
                         <div className="text-xs text-cyan-500 font-bold mb-0.5">10:00 AM</div>
                         <div className="text-sm text-cyan-100">Deep Work: Coding</div>
                     </div>
                     <div className="p-3 bg-white/5 border-l-2 border-zinc-500 rounded-r-lg">
                         <div className="text-xs text-zinc-500 font-bold mb-0.5">02:00 PM</div>
                         <div className="text-sm text-zinc-300">System Maintenance</div>
                     </div>
                 </div>
            </Widget>

        </div>
    </div>
  );
};