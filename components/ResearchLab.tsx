import React, { useState } from 'react';
import { FileText, Search, Upload, BookOpen, Clock, Brain, MessageSquare, Plus, ChevronRight, X } from 'lucide-react';

export const ResearchLab: React.FC = () => {
  const [activeDoc, setActiveDoc] = useState<string | null>(null);
  const [documents, setDocuments] = useState([
      { id: '1', name: 'Attention Is All You Need.pdf', size: '2.4 MB', pages: 15, status: 'indexed' },
      { id: '2', name: 'GPT-4 Technical Report.pdf', size: '5.1 MB', pages: 98, status: 'indexed' },
      { id: '3', name: 'LoRA Fine-tuning Guide.pdf', size: '1.2 MB', pages: 12, status: 'processing' },
  ]);

  return (
    <div className="w-full h-full flex bg-[#09090b]">
        
        {/* Left: Library */}
        <div className="w-80 border-r border-white/5 bg-black/40 flex flex-col backdrop-blur-md">
            <div className="p-5 border-b border-white/5">
                <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <BookOpen size={14} className="text-indigo-400" /> Research Library
                </h2>
                <button className="w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg text-indigo-300 text-xs font-bold flex items-center justify-center gap-2 transition-all">
                    <Upload size={14} /> UPLOAD PDF
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {documents.map(doc => (
                    <div 
                        key={doc.id}
                        onClick={() => setActiveDoc(doc.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer group ${activeDoc === doc.id ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/5'}`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${activeDoc === doc.id ? 'bg-indigo-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                                <FileText size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className={`text-sm font-medium truncate ${activeDoc === doc.id ? 'text-indigo-100' : 'text-zinc-300'}`}>{doc.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-zinc-500">{doc.pages} Pages</span>
                                    {doc.status === 'processing' && <span className="text-[9px] text-amber-400 uppercase font-bold animate-pulse">Indexing...</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Center: Workspace */}
        <div className="flex-1 flex flex-col relative">
            {!activeDoc ? (
                <div className="absolute inset-0 flex items-center justify-center flex-col text-zinc-600 gap-4">
                     <div className="w-24 h-24 rounded-full bg-indigo-500/5 flex items-center justify-center border border-indigo-500/10">
                         <Brain size={48} className="text-indigo-500/50" />
                     </div>
                     <p className="font-mono text-sm">Select a document to begin analysis</p>
                </div>
            ) : (
                <div className="w-full h-full flex flex-col">
                     {/* Toolbar */}
                     <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-black/20">
                         <div className="flex items-center gap-2">
                             <FileText size={16} className="text-indigo-400" />
                             <span className="font-bold text-sm text-zinc-200">{documents.find(d => d.id === activeDoc)?.name}</span>
                         </div>
                         <div className="flex gap-2">
                             <button className="px-3 py-1.5 rounded-lg bg-white/5 text-xs font-bold text-zinc-400 hover:text-white transition-colors">SUMMARY</button>
                             <button className="px-3 py-1.5 rounded-lg bg-white/5 text-xs font-bold text-zinc-400 hover:text-white transition-colors">CITATIONS</button>
                         </div>
                     </div>

                     {/* Content */}
                     <div className="flex-1 p-8 overflow-y-auto">
                         <div className="max-w-3xl mx-auto space-y-6">
                             <div className="flex gap-4">
                                 <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
                                     <Brain size={16} className="text-white" />
                                 </div>
                                 <div className="glass-panel p-6 rounded-2xl rounded-tl-none border border-indigo-500/20 bg-indigo-900/10">
                                     <p className="text-zinc-300 leading-relaxed text-sm">
                                         Based on <strong>{documents.find(d => d.id === activeDoc)?.name}</strong>, the Transformer model architecture uses a mechanism called "Self-Attention" to weigh the significance of different words in a sentence regardless of their positional distance.
                                     </p>
                                     <div className="mt-4 flex gap-2">
                                         <span className="px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono border border-indigo-500/20 cursor-pointer hover:bg-indigo-500/30">Page 3, Para 2</span>
                                         <span className="px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono border border-indigo-500/20 cursor-pointer hover:bg-indigo-500/30">Figure 1</span>
                                     </div>
                                 </div>
                             </div>
                         </div>
                     </div>

                     {/* Input */}
                     <div className="p-6 border-t border-white/5 bg-black/40">
                         <div className="max-w-3xl mx-auto relative">
                             <input 
                                type="text" 
                                placeholder="Ask specific questions about this document..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 pr-12 text-sm text-white outline-none focus:border-indigo-500/50 shadow-lg"
                             />
                             <button className="absolute right-3 top-3 p-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-400 transition-colors">
                                 <Search size={16} />
                             </button>
                         </div>
                     </div>
                </div>
            )}
        </div>

    </div>
  );
};