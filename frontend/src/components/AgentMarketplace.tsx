import React from 'react';
import { X, Download, Shield, Code, PenTool, Bot, Search } from 'lucide-react';
import { Agent } from '../types';
import { useAppContext } from '../context/AppContext';

const MARKET_AGENTS: Partial<Agent>[] = [
    { name: 'Python Debugger', type: 'coder', primaryColor: '#fbbf24', systemPrompt: 'Specialist in Python error tracing.', avatarUrl: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=200&auto=format&fit=crop' },
    { name: 'React Refactorer', type: 'coder', primaryColor: '#61dafb', systemPrompt: 'Expert in React hooks and performance.', avatarUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=200&auto=format&fit=crop' },
    { name: 'Legal Analyst', type: 'daily', primaryColor: '#94a3b8', systemPrompt: 'Summarizes contracts and legal docs.', avatarUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=200&auto=format&fit=crop' },
    { name: 'Copywriter Pro', type: 'creative', primaryColor: '#f472b6', systemPrompt: 'Writes marketing copy.', avatarUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=200&auto=format&fit=crop' },
    { name: 'Security Auditor', type: 'coder', primaryColor: '#ef4444', systemPrompt: 'Checks code for vulnerabilities.', avatarUrl: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?q=80&w=200&auto=format&fit=crop' },
    { name: 'Travel Planner', type: 'daily', primaryColor: '#34d399', systemPrompt: 'Plans itineraries.', avatarUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=200&auto=format&fit=crop' },
];

export const AgentMarketplace: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { actions } = useAppContext();

    const handleInstall = (agent: Partial<Agent>) => {
        actions.addAgent({
            id: '', // Will be generated
            name: agent.name!,
            type: agent.type!,
            primaryColor: agent.primaryColor!,
            systemPrompt: agent.systemPrompt!,
            avatarUrl: agent.avatarUrl!,
            isCustom: true
        });
        onClose();
    };

    return (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-[70] flex items-center justify-center p-8">
            <div className="glass-panel w-full max-w-4xl h-[80vh] rounded-3xl border border-white/10 flex flex-col overflow-hidden bg-[#09090b] shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Neural Marketplace</h2>
                        <p className="text-zinc-400 text-sm">Expand your local operating system with specialized models.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-white/10 bg-black/20">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                        <input type="text" placeholder="Search for agents..." className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 text-sm text-white focus:border-cyan-500/50 outline-none" />
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {MARKET_AGENTS.map((agent, i) => (
                        <div key={i} className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-all group relative overflow-hidden flex flex-col">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-zinc-800 overflow-hidden border border-white/10">
                                    <img src={agent.avatarUrl} className="w-full h-full object-cover" />
                                </div>
                                <div className={`px-2 py-1 rounded text-[10px] uppercase font-bold border ${
                                    agent.type === 'coder' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10' : 
                                    agent.type === 'creative' ? 'border-pink-500/20 text-pink-400 bg-pink-500/10' :
                                    'border-cyan-500/20 text-cyan-400 bg-cyan-500/10'
                                }`}>
                                    {agent.type}
                                </div>
                            </div>
                            
                            <h3 className="text-white font-bold text-base mb-1">{agent.name}</h3>
                            <p className="text-zinc-500 text-xs mb-6 flex-1">{agent.systemPrompt}</p>
                            
                            <button 
                                onClick={() => handleInstall(agent)}
                                className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 text-zinc-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 group-hover:bg-cyan-500 group-hover:text-black group-hover:border-cyan-500"
                            >
                                <Download size={14} /> INSTALL NODE
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};