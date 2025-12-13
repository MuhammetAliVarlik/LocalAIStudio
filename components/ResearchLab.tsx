import React, { useState, useRef, useEffect } from 'react';
import { FileText, Search, Upload, BookOpen, Clock, Brain, MessageSquare, Plus, ChevronRight, X, Send, Paperclip, Network } from 'lucide-react';
import { MemoryGraph } from './MemoryGraph';

interface ResearchMessage {
    id: string;
    role: 'user' | 'ai';
    text: string;
    citations?: string[];
}

export const ResearchLab: React.FC = () => {
  const [activeDoc, setActiveDoc] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'text' | 'graph'>('text');
  const [documents, setDocuments] = useState([
      { id: '1', name: 'Attention Is All You Need.pdf', size: '2.4 MB', pages: 15, status: 'indexed', summary: 'Introduces the Transformer architecture, relying entirely on self-attention mechanisms to draw global dependencies between input and output.' },
      { id: '2', name: 'GPT-4 Technical Report.pdf', size: '5.1 MB', pages: 98, status: 'indexed', summary: 'Details the capabilities, limitations, and safety evaluations of the GPT-4 model, including multimodal performance benchmarks.' },
      { id: '3', name: 'LoRA Fine-tuning Guide.pdf', size: '1.2 MB', pages: 12, status: 'processing', summary: 'Processing document...' },
  ]);
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Record<string, ResearchMessage[]>>({
      '1': [{ id: '0', role: 'ai', text: 'Document indexed. I can help you analyze the Transformer architecture.' }],
      '2': [{ id: '0', role: 'ai', text: 'Document indexed. Ask me about GPT-4 benchmarks.' }]
  });
  const [isUploading, setIsUploading] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, activeDoc]);

  const handleUpload = () => {
      setIsUploading(true);
      setTimeout(() => {
          const newId = Date.now().toString();
          const newDoc = { 
              id: newId, 
              name: 'New_Research_Paper.pdf', 
              size: '1.8 MB', 
              pages: 24, 
              status: 'indexed',
              summary: 'Analysis complete. Ready for queries.'
          };
          setDocuments(prev => [...prev, newDoc]);
          setChatHistory(prev => ({ ...prev, [newId]: [{ id: '0', role: 'ai', text: 'Document analysis complete.' }] }));
          setIsUploading(false);
          setActiveDoc(newId);
      }, 1500);
  };

  const handleSendMessage = () => {
      if (!input.trim() || !activeDoc) return;
      
      const docId = activeDoc;
      const userMsg: ResearchMessage = { id: Date.now().toString(), role: 'user', text: input };
      
      // Update history
      setChatHistory(prev => ({
          ...prev,
          [docId]: [...(prev[docId] || []), userMsg]
      }));
      setInput('');

      // Simulate AI Response
      setTimeout(() => {
          const docName = documents.find(d => d.id === docId)?.name;
          const aiMsg: ResearchMessage = { 
              id: (Date.now() + 1).toString(), 
              role: 'ai', 
              text: `Based on the context of ${docName}, the answer involves analyzing the specific vectors described in Section 4 of the paper.`,
              citations: ['Page 4, Para 2', 'Figure 3']
          };
          setChatHistory(prev => ({
              ...prev,
              [docId]: [...(prev[docId] || []), aiMsg]
          }));
      }, 1000);
  };

  const currentMessages = activeDoc ? (chatHistory[activeDoc] || []) : [];

  return (
    <div className="w-full h-full flex bg-[#09090b]">
        
        {/* Left: Library */}
        <div className="w-80 border-r border-white/5 bg-black/40 flex flex-col backdrop-blur-md">
            <div className="p-5 border-b border-white/5">
                <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <BookOpen size={14} className="text-indigo-400" /> Research Library
                </h2>
                <button 
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg text-indigo-300 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                    {isUploading ? <Clock size={14} className="animate-spin" /> : <Upload size={14} />}
                    {isUploading ? 'UPLOADING...' : 'UPLOAD PDF'}
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
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
                                    {doc.status === 'indexed' && <span className="text-[9px] text-emerald-500 uppercase font-bold">Ready</span>}
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
                     <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-black/20 backdrop-blur-md z-10">
                         <div className="flex items-center gap-2">
                             <FileText size={16} className="text-indigo-400" />
                             <span className="font-bold text-sm text-zinc-200">{documents.find(d => d.id === activeDoc)?.name}</span>
                         </div>
                         <div className="flex gap-2 bg-white/5 rounded-lg p-1">
                             <button 
                                onClick={() => setViewMode('text')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'text' ? 'bg-indigo-500 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
                             >
                                 CHAT
                             </button>
                             <button 
                                onClick={() => setViewMode('graph')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'graph' ? 'bg-indigo-500 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
                             >
                                 <Network size={12} /> GRAPH
                             </button>
                         </div>
                     </div>

                     {/* Content Area */}
                     {viewMode === 'text' ? (
                         <>
                             <div className="flex-1 p-8 overflow-y-auto custom-scrollbar scroll-smooth">
                                 <div className="max-w-3xl mx-auto space-y-6">
                                     {/* Initial Summary Block */}
                                     <div className="flex gap-4 animate-fade-in">
                                         <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                                             <Brain size={16} className="text-white" />
                                         </div>
                                         <div className="glass-panel p-6 rounded-2xl rounded-tl-none border border-indigo-500/20 bg-indigo-900/10">
                                             <h5 className="text-xs font-bold text-indigo-300 uppercase mb-2">Executive Summary</h5>
                                             <p className="text-zinc-300 leading-relaxed text-sm">
                                                 {documents.find(d => d.id === activeDoc)?.summary}
                                             </p>
                                         </div>
                                     </div>

                                     {/* Message History */}
                                     {currentMessages.map((msg) => (
                                         <div key={msg.id} className={`flex gap-4 animate-fade-in ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                             <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'ai' ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-zinc-700'}`}>
                                                 {msg.role === 'ai' ? <Brain size={16} className="text-white" /> : <MessageSquare size={16} className="text-zinc-300"/>}
                                             </div>
                                             <div className={`glass-panel p-4 rounded-2xl border max-w-xl ${msg.role === 'ai' ? 'rounded-tl-none border-indigo-500/20 bg-indigo-900/10' : 'rounded-tr-none border-white/10 bg-white/5'}`}>
                                                 <p className="text-zinc-300 leading-relaxed text-sm">{msg.text}</p>
                                                 {msg.citations && (
                                                     <div className="mt-3 flex gap-2 flex-wrap">
                                                         {msg.citations.map((cite, i) => (
                                                             <span key={i} className="px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono border border-indigo-500/20 cursor-pointer hover:bg-indigo-500/30 transition-colors">
                                                                 {cite}
                                                             </span>
                                                         ))}
                                                     </div>
                                                 )}
                                             </div>
                                         </div>
                                     ))}
                                     <div ref={scrollRef} />
                                 </div>
                             </div>

                             {/* Input Area */}
                             <div className="p-6 border-t border-white/5 bg-black/40 backdrop-blur-md">
                                 <div className="max-w-3xl mx-auto relative">
                                     <div className="absolute left-3 top-3 p-1.5 text-zinc-500 hover:text-white cursor-pointer transition-colors">
                                         <Paperclip size={18} />
                                     </div>
                                     <input 
                                        type="text" 
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Ask questions, summarize sections, or extract data..."
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-12 text-sm text-white outline-none focus:border-indigo-500/50 shadow-lg font-light"
                                     />
                                     <button 
                                        onClick={handleSendMessage}
                                        className={`absolute right-3 top-3 p-1.5 rounded-lg transition-all ${input.trim() ? 'bg-indigo-500 text-white hover:bg-indigo-400' : 'bg-white/5 text-zinc-600'}`}
                                     >
                                         <Send size={16} />
                                     </button>
                                 </div>
                             </div>
                         </>
                     ) : (
                         <div className="flex-1 relative overflow-hidden">
                             <MemoryGraph activeDoc={activeDoc} />
                         </div>
                     )}
                </div>
            )}
        </div>

    </div>
  );
};