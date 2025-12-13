import React from 'react';
import { Command, Terminal, Music, Chrome, Code, Layers, Power, Cpu, Box, Play } from 'lucide-react';

const AppCard = ({ name, icon: Icon, status, category }: { name: string, icon: any, status: 'running' | 'stopped', category: string }) => (
    <div className="glass-panel p-4 rounded-xl border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all group cursor-pointer relative overflow-hidden">
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-zinc-800 rounded-lg text-white group-hover:scale-110 transition-transform">
                <Icon size={24} />
            </div>
            <div className={`w-2 h-2 rounded-full ${status === 'running' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-900'}`} />
        </div>
        <h3 className="font-bold text-white text-sm">{name}</h3>
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">{category}</p>
        
        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            {status === 'stopped' ? (
                <button className="px-3 py-1.5 bg-white text-black rounded text-xs font-bold flex items-center gap-1 hover:scale-105 transition-transform"><Play size={10} fill="currentColor"/> LAUNCH</button>
            ) : (
                <>
                    <button className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/50 rounded text-xs font-bold hover:bg-red-500/30">KILL</button>
                    <button className="px-3 py-1.5 bg-white/10 text-white border border-white/20 rounded text-xs font-bold hover:bg-white/20">FOCUS</button>
                </>
            )}
        </div>
    </div>
);

export const SystemControl: React.FC = () => {
  return (
    <div className="w-full h-full p-8 overflow-y-auto">
        <header className="mb-8">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Command className="text-slate-400" /> System Command
            </h1>
            <p className="text-zinc-500 text-sm mt-1">Application lifecycle and workspace management.</p>
        </header>

        {/* Workspaces */}
        <section className="mb-10">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Layers size={14}/> Workspaces</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-panel p-5 rounded-xl border border-white/10 hover:border-cyan-500/50 cursor-pointer transition-all group">
                    <h3 className="text-white font-bold mb-2">Deep Code</h3>
                    <div className="flex gap-2 mb-4">
                        <Code size={16} className="text-zinc-400" />
                        <Terminal size={16} className="text-zinc-400" />
                        <Music size={16} className="text-zinc-400" />
                    </div>
                    <button className="w-full py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded text-xs font-bold group-hover:bg-cyan-500 group-hover:text-black transition-colors">ACTIVATE</button>
                </div>
                <div className="glass-panel p-5 rounded-xl border border-white/10 hover:border-pink-500/50 cursor-pointer transition-all group">
                    <h3 className="text-white font-bold mb-2">Creative Flow</h3>
                    <div className="flex gap-2 mb-4">
                        <Box size={16} className="text-zinc-400" />
                        <Chrome size={16} className="text-zinc-400" />
                    </div>
                    <button className="w-full py-2 bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded text-xs font-bold group-hover:bg-pink-500 group-hover:text-black transition-colors">ACTIVATE</button>
                </div>
                <div className="glass-panel p-5 rounded-xl border border-white/10 hover:border-emerald-500/50 cursor-pointer transition-all group">
                    <h3 className="text-white font-bold mb-2">System Maint</h3>
                    <div className="flex gap-2 mb-4">
                        <Cpu size={16} className="text-zinc-400" />
                        <Terminal size={16} className="text-zinc-400" />
                    </div>
                    <button className="w-full py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs font-bold group-hover:bg-emerald-500 group-hover:text-black transition-colors">ACTIVATE</button>
                </div>
            </div>
        </section>

        {/* Apps Grid */}
        <section>
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Box size={14}/> Installed Packages</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <AppCard name="VS Code" icon={Code} status="running" category="Development" />
                <AppCard name="Terminal" icon={Terminal} status="running" category="System" />
                <AppCard name="Spotify" icon={Music} status="running" category="Media" />
                <AppCard name="Chrome" icon={Chrome} status="stopped" category="Browser" />
                <AppCard name="Docker" icon={Box} status="running" category="Development" />
                <AppCard name="Activity" icon={Cpu} status="stopped" category="System" />
            </div>
        </section>
    </div>
  );
};