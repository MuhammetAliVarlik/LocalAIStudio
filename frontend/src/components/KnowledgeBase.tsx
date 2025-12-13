import React, { useState } from 'react';
import { Folder, Hash, FileText, Sparkles, Share2, MoreVertical, Search, Network } from 'lucide-react';

export const KnowledgeBase: React.FC = () => {
  const [activeNoteId, setActiveNoteId] = useState('1');
  const [showGraph, setShowGraph] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const notes = [
    { id: '1', title: 'Project Titan Architecture', preview: 'The core system relies on a decentralized node structure...', tag: 'Work', date: '2h ago' },
    { id: '2', title: 'Recipe: Quantum Soufflé', preview: 'Ingredients: 2 cups of dark matter, 1 tbsp of star dust...', tag: 'Personal', date: '1d ago' },
    { id: '3', title: 'Meeting Notes: Q3 Review', preview: 'Revenue up by 40% due to new AI integration...', tag: 'Work', date: '3d ago' },
  ];

  const handleAiMagic = () => {
    setIsAiProcessing(true);
    setTimeout(() => setIsAiProcessing(false), 2000);
  };

  return (
    <div className="w-full h-full flex bg-[#09090b] relative overflow-hidden">
        
        {/* Left: Navigation */}
        <div className="w-60 border-r border-white/5 bg-black/40 flex flex-col p-4">
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Library</div>
            <div className="space-y-1">
                {['All Notes', 'Favorites', 'Archived'].map(item => (
                    <div key={item} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer transition-colors">
                        <Folder size={14} /> {item}
                    </div>
                ))}
            </div>
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-6 mb-4">Tags</div>
            <div className="space-y-1">
                {['#ideas', '#work', '#journal', '#research'].map(item => (
                    <div key={item} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-amber-500/80 hover:bg-amber-500/10 cursor-pointer transition-colors">
                        <Hash size={14} /> {item.replace('#', '')}
                    </div>
                ))}
            </div>
        </div>

        {/* Middle: Note List */}
        <div className="w-80 border-r border-white/5 bg-black/20 flex flex-col">
            <div className="p-4 border-b border-white/5">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                    <input type="text" placeholder="Search notes..." className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 text-sm text-white focus:border-amber-500/50 outline-none" />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                {notes.map(note => (
                    <div 
                        key={note.id} 
                        onClick={() => setActiveNoteId(note.id)}
                        className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-all ${activeNoteId === note.id ? 'bg-amber-500/10 border-l-2 border-l-amber-500' : 'border-l-2 border-l-transparent'}`}
                    >
                        <h4 className={`font-bold text-sm mb-1 ${activeNoteId === note.id ? 'text-amber-100' : 'text-zinc-300'}`}>{note.title}</h4>
                        <p className="text-xs text-zinc-500 line-clamp-2 mb-2">{note.preview}</p>
                        <div className="flex justify-between items-center text-[10px] text-zinc-600">
                            <span className="bg-white/5 px-1.5 py-0.5 rounded">{note.tag}</span>
                            <span>{note.date}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Right: Editor */}
        <div className="flex-1 flex flex-col relative">
            <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-black/40 backdrop-blur-md z-10">
                <div className="text-zinc-400 text-xs">Last edited today at 10:42 AM</div>
                <div className="flex gap-2">
                    <button onClick={() => setShowGraph(!showGraph)} className={`p-2 rounded-lg transition-colors ${showGraph ? 'bg-amber-500 text-black' : 'hover:bg-white/10 text-zinc-400'}`}>
                        <Network size={18} />
                    </button>
                    <button onClick={handleAiMagic} className={`p-2 rounded-lg transition-colors ${isAiProcessing ? 'bg-amber-500 text-black animate-pulse' : 'hover:bg-white/10 text-zinc-400'}`}>
                        <Sparkles size={18} />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-white/10 text-zinc-400"><Share2 size={18} /></button>
                    <button className="p-2 rounded-lg hover:bg-white/10 text-zinc-400"><MoreVertical size={18} /></button>
                </div>
            </div>

            <div className="flex-1 p-8 overflow-y-auto">
                <input type="text" defaultValue="Project Titan Architecture" className="w-full bg-transparent text-3xl font-bold text-white mb-6 outline-none" />
                <textarea 
                    className="w-full h-full bg-transparent text-zinc-300 text-lg leading-relaxed outline-none resize-none font-sans"
                    defaultValue={`The core system relies on a decentralized node structure. \n\nKey Components:\n1. Neural Core (Processing)\n2. Memory Mesh (Storage)\n3. Sensory Input (Edge Devices)\n\nTo-Do:\n- [ ] Optimize vector embeddings\n- [ ] Refactor the consensus algorithm`}
                />
            </div>

            {/* Graph Overlay */}
            {showGraph && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center animate-fade-in z-20">
                    <div className="text-center">
                        <div className="w-64 h-64 border border-amber-500/30 rounded-full flex items-center justify-center relative mx-auto mb-4">
                            <div className="absolute inset-0 animate-spin-slow border-t border-amber-500 rounded-full opacity-50"></div>
                            <Network className="text-amber-500" size={48} />
                            {/* Mock Nodes */}
                            <div className="absolute top-10 left-10 w-3 h-3 bg-zinc-500 rounded-full"></div>
                            <div className="absolute bottom-10 right-20 w-3 h-3 bg-zinc-500 rounded-full"></div>
                            <div className="absolute top-1/2 right-4 w-3 h-3 bg-amber-500 rounded-full shadow-[0_0_10px_#f59e0b]"></div>
                        </div>
                        <h3 className="text-amber-500 font-bold text-lg">Knowledge Graph</h3>
                        <p className="text-zinc-500 text-sm">Visualizing 1,204 associations</p>
                        <button onClick={() => setShowGraph(false)} className="mt-6 px-4 py-2 bg-white/10 rounded-lg text-sm text-white hover:bg-white/20">Close View</button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};