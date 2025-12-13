import React from 'react';
import { Languages, MessageCircle, Mic, Play, Award, Globe, Book } from 'lucide-react';

const ScenarioCard = ({ title, lang, level, color }: { title: string, lang: string, level: string, color: string }) => (
    <div className={`glass-panel p-6 rounded-2xl border border-white/10 cursor-pointer hover:scale-[1.02] transition-all group relative overflow-hidden`}>
        <div className={`absolute top-0 right-0 p-3 rounded-bl-2xl bg-${color}-500/20 text-${color}-400 font-bold text-xs uppercase`}>
            {level}
        </div>
        <div className={`w-12 h-12 rounded-full bg-${color}-500/20 flex items-center justify-center mb-4 text-${color}-400 group-hover:bg-${color}-500 group-hover:text-white transition-colors`}>
            <MessageCircle size={24} />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
        <p className="text-zinc-500 text-sm mb-4">Practice conversation in {lang}.</p>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Globe size={12} /> {lang}
        </div>
    </div>
);

export const LanguageCenter: React.FC = () => {
  return (
    <div className="w-full h-full p-8 overflow-y-auto bg-[url('https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-0" />
        
        <div className="relative z-10 max-w-6xl mx-auto">
            <header className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <Languages className="text-pink-500" /> Polyglot Protocol
                    </h1>
                    <p className="text-zinc-400">Immersive roleplay scenarios for language acquisition.</p>
                </div>
                <div className="flex gap-4">
                    <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/10 flex items-center gap-3">
                         <div className="text-right">
                             <div className="text-xs text-zinc-500 uppercase font-bold">Current Streak</div>
                             <div className="text-lg font-bold text-white">12 Days</div>
                         </div>
                         <Award size={24} className="text-yellow-500" />
                    </div>
                </div>
            </header>

            <section className="mb-12">
                <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Play size={14} /> Continue Learning
                </h2>
                <div className="glass-panel p-8 rounded-3xl border border-white/10 flex items-center gap-8 relative overflow-hidden group">
                     <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                     <div className="w-20 h-20 rounded-2xl bg-pink-500 flex items-center justify-center shadow-[0_0_30px_rgba(236,72,153,0.3)] z-10">
                         <span className="text-3xl font-bold text-white">JP</span>
                     </div>
                     <div className="flex-1 z-10">
                         <div className="flex justify-between mb-2">
                             <h3 className="text-xl font-bold text-white">Ordering at a Cafe</h3>
                             <span className="text-pink-400 font-bold">Japanese • Intermediate</span>
                         </div>
                         <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                             <div className="bg-pink-500 h-2 rounded-full w-[65%]" />
                         </div>
                         <p className="text-zinc-400 text-sm">Resume where you left off with Barista Tanaka.</p>
                     </div>
                     <button className="z-10 w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform">
                         <Play fill="currentColor" className="ml-1" />
                     </button>
                </div>
            </section>

            <section>
                <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Book size={14} /> Available Scenarios
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ScenarioCard title="The Train Station" lang="French" level="Beginner" color="blue" />
                    <ScenarioCard title="Business Meeting" lang="Spanish" level="Advanced" color="amber" />
                    <ScenarioCard title="Street Market" lang="Mandarin" level="Intermediate" color="red" />
                    <ScenarioCard title="Hotel Check-in" lang="German" level="Beginner" color="emerald" />
                    <ScenarioCard title="Medical Emergency" lang="Italian" level="Advanced" color="violet" />
                    <ScenarioCard title="Asking Directions" lang="Korean" level="Beginner" color="cyan" />
                </div>
            </section>
        </div>
    </div>
  );
};