import React, { useState } from 'react';
import { Languages, MessageCircle, Mic, Play, Award, Globe, Book, X, Volume2, RotateCcw } from 'lucide-react';
import VoiceAvatar from './VoiceAvatar';
import { AvatarState, VisualContext } from '../types';
import { useApp } from '../context/AppContext';

const ScenarioCard = ({ title, lang, level, color, onClick }: { title: string, lang: string, level: string, color: string, onClick: () => void }) => (
    <div onClick={onClick} className={`glass-panel p-6 rounded-2xl border border-white/10 cursor-pointer hover:scale-[1.02] transition-all group relative overflow-hidden`}>
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
  const { state, actions } = useApp();
  const { avatarState } = state;
  const { setAvatarState } = actions;

  const [activeSession, setActiveSession] = useState<{title: string, lang: string} | null>(null);
  const [messages, setMessages] = useState<{role: 'ai'|'user', text: string}[]>([
      { role: 'ai', text: 'Bonjour! Comment puis-je vous aider aujourd\'hui?' }
  ]);
  const [input, setInput] = useState('');

  const handleStartSession = (title: string, lang: string) => {
      setActiveSession({ title, lang });
      setMessages([{ role: 'ai', text: `Starting ${title} scenario in ${lang}. Greetings!` }]);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!input.trim()) return;
      
      const newMsgs = [...messages, { role: 'user' as const, text: input }];
      setMessages(newMsgs);
      setInput('');
      setAvatarState(AvatarState.THINKING);

      setTimeout(() => {
          setAvatarState(AvatarState.SPEAKING);
          setMessages(prev => [...prev, { role: 'ai', text: 'That is excellent pronunciation! Try adding more detail.' }]);
          setTimeout(() => setAvatarState(AvatarState.IDLE), 3000);
      }, 1500);
  };

  return (
    <div className="w-full h-full p-8 overflow-y-auto bg-[url('https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center relative">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-0" />
        
        {/* Main Dashboard */}
        <div className={`relative z-10 max-w-6xl mx-auto transition-all duration-500 ${activeSession ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100 scale-100'}`}>
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
                <div 
                    onClick={() => handleStartSession('Ordering at a Cafe', 'Japanese')}
                    className="glass-panel p-8 rounded-3xl border border-white/10 flex items-center gap-8 relative overflow-hidden group cursor-pointer"
                >
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
                    <ScenarioCard onClick={() => handleStartSession('The Train Station', 'French')} title="The Train Station" lang="French" level="Beginner" color="blue" />
                    <ScenarioCard onClick={() => handleStartSession('Business Meeting', 'Spanish')} title="Business Meeting" lang="Spanish" level="Advanced" color="amber" />
                    <ScenarioCard onClick={() => handleStartSession('Street Market', 'Mandarin')} title="Street Market" lang="Mandarin" level="Intermediate" color="red" />
                    <ScenarioCard onClick={() => handleStartSession('Hotel Check-in', 'German')} title="Hotel Check-in" lang="German" level="Beginner" color="emerald" />
                    <ScenarioCard onClick={() => handleStartSession('Medical Emergency', 'Italian')} title="Medical Emergency" lang="Italian" level="Advanced" color="violet" />
                    <ScenarioCard onClick={() => handleStartSession('Asking Directions', 'Korean')} title="Asking Directions" lang="Korean" level="Beginner" color="cyan" />
                </div>
            </section>
        </div>

        {/* Active Session Overlay */}
        {activeSession && (
            <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col animate-fade-in">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white">{activeSession.title}</h2>
                        <span className="text-pink-400 text-sm font-mono">{activeSession.lang} Simulation</span>
                    </div>
                    <button onClick={() => setActiveSession(null)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all">
                        <X size={24} />
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Avatar Area */}
                    <div className="w-1/3 border-r border-white/10 relative bg-black/50">
                        <VoiceAvatar 
                            state={avatarState} 
                            audioLevel={avatarState === AvatarState.SPEAKING ? 60 : 10} 
                            primaryColor="#ec4899" 
                            visualContext={VisualContext.DEFAULT}
                        />
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                             <button onClick={() => setAvatarState(avatarState === AvatarState.LISTENING ? AvatarState.IDLE : AvatarState.LISTENING)} className={`p-4 rounded-full border ${avatarState === AvatarState.LISTENING ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse' : 'bg-white/5 border-white/10 text-white'}`}>
                                 <Mic size={24} />
                             </button>
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col bg-[#09090b]">
                         <div className="flex-1 overflow-y-auto p-8 space-y-6">
                             {messages.map((m, i) => (
                                 <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                     <div className={`max-w-xl p-6 rounded-2xl text-lg ${m.role === 'user' ? 'bg-pink-600/20 text-pink-100 border border-pink-500/30' : 'bg-white/5 text-zinc-200 border border-white/10'}`}>
                                         {m.text}
                                         {m.role === 'ai' && (
                                             <div className="mt-2 pt-2 border-t border-white/5 flex gap-3">
                                                 <button className="text-xs text-zinc-500 hover:text-white flex items-center gap-1"><Volume2 size={12}/> Replay</button>
                                                 <button className="text-xs text-zinc-500 hover:text-white flex items-center gap-1"><RotateCcw size={12}/> Translate</button>
                                             </div>
                                         )}
                                     </div>
                                 </div>
                             ))}
                         </div>
                         <div className="p-6 border-t border-white/10">
                             <form onSubmit={handleSendMessage} className="relative">
                                 <input 
                                    autoFocus
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    placeholder="Type your response or use voice..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-6 text-white outline-none focus:border-pink-500/50"
                                 />
                             </form>
                         </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};