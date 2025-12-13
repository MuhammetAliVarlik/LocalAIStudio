import React from 'react';
import { Wallet, TrendingUp, TrendingDown, Upload, FileText, AlertCircle, PieChart, ArrowUpRight, DollarSign } from 'lucide-react';

const HeatmapCell = ({ intensity }: { intensity: number }) => {
    let color = 'bg-white/5';
    if (intensity > 0) color = 'bg-emerald-900/40';
    if (intensity > 25) color = 'bg-emerald-700/50';
    if (intensity > 50) color = 'bg-emerald-500/60';
    if (intensity > 75) color = 'bg-emerald-400';
    
    return (
        <div className={`w-full aspect-square rounded-sm ${color} hover:ring-1 hover:ring-white transition-all cursor-default relative group`}>
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black px-2 py-1 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/10 z-10">
                Spend: ${intensity * 12}
            </div>
        </div>
    );
};

export const FinanceVault: React.FC = () => {
  return (
    <div className="w-full h-full p-8 overflow-y-auto bg-gradient-to-br from-[#0a0a0a] to-[#111] relative">
        <div className="max-w-6xl mx-auto space-y-6">
            
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Wallet className="text-emerald-400" /> The Vault
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">Private Ledger & Asset Management</p>
                </div>
                <div className="flex gap-4">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/10 transition-all">
                        <Upload size={14} /> IMPORT CSV
                    </button>
                </div>
            </header>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass-panel p-5 rounded-xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-20 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/10 transition-colors" />
                    <div className="relative z-10">
                        <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Net Worth</div>
                        <div className="text-2xl font-bold text-white font-mono">$142,894.00</div>
                        <div className="flex items-center gap-1 text-emerald-400 text-xs mt-2">
                            <TrendingUp size={12} /> +4.2% this month
                        </div>
                    </div>
                </div>
                <div className="glass-panel p-5 rounded-xl border border-white/5">
                    <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Monthly Spend</div>
                    <div className="text-2xl font-bold text-white font-mono">$3,240.50</div>
                    <div className="flex items-center gap-1 text-red-400 text-xs mt-2">
                        <TrendingUp size={12} /> +12% vs last month
                    </div>
                </div>
                <div className="glass-panel p-5 rounded-xl border border-white/5">
                    <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Investments</div>
                    <div className="text-2xl font-bold text-white font-mono">$89,102.20</div>
                    <div className="flex items-center gap-1 text-emerald-400 text-xs mt-2">
                        <TrendingUp size={12} /> +1.8% today
                    </div>
                </div>
                <div className="glass-panel p-5 rounded-xl border border-white/5 flex flex-col justify-center items-center border-dashed cursor-pointer hover:bg-white/5 transition-colors">
                    <Upload className="text-zinc-600 mb-2" />
                    <div className="text-zinc-500 text-xs font-bold">DROP STATEMENT</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Main Viz: Heatmap */}
                <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/5">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-white flex items-center gap-2"><PieChart size={16} className="text-emerald-400"/> Spending Velocity</h3>
                        <div className="flex gap-2">
                            <span className="w-3 h-3 bg-white/5 rounded-sm"></span>
                            <span className="w-3 h-3 bg-emerald-500 rounded-sm"></span>
                        </div>
                    </div>
                    
                    {/* Fake Calendar Grid */}
                    <div className="grid grid-cols-12 gap-1 mb-2">
                        {Array.from({ length: 12 * 7 }).map((_, i) => (
                            <HeatmapCell key={i} intensity={Math.random() * 100} />
                        ))}
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-600 font-mono uppercase">
                        <span>Jan</span><span>Dec</span>
                    </div>
                </div>

                {/* AI Insights */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                        <AlertCircle size={16} className="text-amber-400" /> Neural Insights
                    </h3>
                    <div className="flex-1 space-y-4 overflow-y-auto">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <p className="text-sm text-zinc-300 leading-relaxed">
                                You spent <span className="text-red-400 font-bold">20% more</span> on coffee shops this week compared to your 3-month average.
                            </p>
                        </div>
                        <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                            <p className="text-sm text-emerald-100 leading-relaxed">
                                Subscription Detected: "Adobe Creative Cloud" increased by $2.00.
                            </p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <p className="text-sm text-zinc-300 leading-relaxed">
                                Suggestion: Move $500 to High Yield Savings to optimize for upcoming tax season.
                            </p>
                        </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-white/5">
                        <input type="text" placeholder="Ask about your finances..." className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/50" />
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};