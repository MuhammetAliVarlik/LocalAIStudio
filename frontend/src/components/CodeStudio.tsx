import React, { useState, useEffect, useRef } from 'react';
import { FileCode, Folder, Play, Save, X, Terminal as TerminalIcon, Search, ChevronDown, Layout, Command, Plus, Maximize2, Minimize2, Wand2, MessageSquare, Mic, Send, Eye, EyeOff } from 'lucide-react';
import Editor, { Monaco } from '@monaco-editor/react';
import VoiceAvatar from './VoiceAvatar';
import { AvatarState } from '../types';
import { useApp } from '../context/AppContext';

// --- Types ---
interface File {
  id: string;
  name: string;
  language: string;
  content: string;
  isOpen: boolean;
  isDirty?: boolean;
}

interface Log {
  id: string;
  type: 'info' | 'error' | 'success' | 'cmd';
  text: string;
  timestamp: Date;
}

interface CodeChatMsg {
    id: string;
    role: 'user' | 'ai';
    text: string;
    isTyping?: boolean; // New flag for streaming
}

export const CodeStudio: React.FC = () => {
  const { state, actions } = useApp();
  const { avatarState, customShapeFn, visualContext, audioLevel } = state;
  const { setAvatarState } = actions;
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // State
  const [files, setFiles] = useState<File[]>([]); 
  const [activeFileId, setActiveFileId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<Log[]>([{ id: '0', type: 'info', text: 'Neural Engine initialized...', timestamp: new Date() }]);
  const [terminalInput, setTerminalInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  
  const [chatMessages, setChatMessages] = useState<CodeChatMsg[]>([{ id: '1', role: 'ai', text: 'I am ready to assist with your code. How can I help?' }]);
  const [chatInput, setChatInput] = useState('');
  
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Derived
  const activeFile = files.find(f => f.id === activeFileId);
  const openFiles = files.filter(f => f.isOpen);

  // Effects
  useEffect(() => { terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  // MOUNT: Load Files
  useEffect(() => { refreshFileSystem(); }, []);

  const refreshFileSystem = async () => {
      try {
          const res = await fetch(`${API_URL}/api/files`);
          const data = await res.json();
          setFiles(data.map((f: any) => ({ ...f, isOpen: false, content: '' })));
          setLogs(prev => [...prev, { id: crypto.randomUUID(), type: 'success', text: `FileSystem mounted. ${data.length} files found.`, timestamp: new Date() }]);
      } catch (e) {
          setLogs(prev => [...prev, { id: crypto.randomUUID(), type: 'error', text: 'Failed to mount FileSystem.', timestamp: new Date() }]);
      }
  };

  const handleEditorMount = (editor: any, monaco: Monaco) => {
      monaco.editor.defineTheme('vibe-theme', {
          base: 'vs-dark',
          inherit: true,
          rules: [],
          colors: { 'editor.background': '#00000000', 'editor.lineHighlightBackground': '#ffffff08', 'editorGutter.background': '#00000000' }
      });
      monaco.editor.setTheme('vibe-theme');
  };

  const handleFileClick = async (id: string) => {
    const file = files.find(f => f.id === id);
    if (!file) return;
    if (!file.content) {
        try {
            const res = await fetch(`${API_URL}/api/files/${file.name}`);
            const data = await res.json();
            setFiles(prev => prev.map(f => f.id === id ? { ...f, isOpen: true, content: data.content } : f));
        } catch (e) { console.error(e); }
    } else {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, isOpen: true } : f));
    }
    setActiveFileId(id);
  };

  const handleCloseFile = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFiles(prev => prev.map(f => f.id === id ? { ...f, isOpen: false } : f));
    if (activeFileId === id) {
       const remaining = openFiles.filter(f => f.id !== id);
       setActiveFileId(remaining.length > 0 ? remaining[remaining.length - 1].id : '');
    }
  };

  const handleCodeChange = (val: string | undefined) => {
    if (!activeFileId || val === undefined) return;
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: val, isDirty: true } : f));
  };

  const handleSave = async () => {
    if (!activeFile) return;
    try {
        await fetch(`${API_URL}/api/files`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: activeFile.name, content: activeFile.content, language: activeFile.language })
        });
        setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, isDirty: false } : f));
        setLogs(prev => [...prev, { id: crypto.randomUUID(), type: 'success', text: `Saved ${activeFile.name}`, timestamp: new Date() }]);
    } catch (e) {
        setLogs(prev => [...prev, { id: crypto.randomUUID(), type: 'error', text: 'Save failed', timestamp: new Date() }]);
    }
  };

  // --- UPDATED: Real Execution Logic ---
  const handleRun = async () => {
    if (!activeFile) return;

    // 1. HTML Preview (Local)
    if (activeFile.language === 'html') {
        setPreviewContent(activeFile.content);
        if (!isPreviewOpen) setIsPreviewOpen(true);
        setLogs(prev => [...prev, { id: crypto.randomUUID(), type: 'success', text: 'Preview refreshed.', timestamp: new Date() }]);
        return;
    }

    // 2. Python/JS Execution (Via Backend)
    setLogs(prev => [...prev, { id: crypto.randomUUID(), type: 'info', text: `Executing ${activeFile.name}...`, timestamp: new Date() }]);

    // Auto-save before running
    if (activeFile.isDirty) await handleSave();

    const cmd = activeFile.language === 'python' ? `python ${activeFile.name}` 
              : activeFile.language === 'javascript' ? `node ${activeFile.name}` 
              : `cat ${activeFile.name}`;

    try {
        const res = await fetch(`${API_URL}/api/terminal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: cmd })
        });
        const data = await res.json();
        setLogs(prev => [...prev, { 
            id: crypto.randomUUID(), 
            type: 'success', 
            text: `Output:\n${data.output}`, 
            timestamp: new Date() 
        }]);
    } catch (e) {
        setLogs(prev => [...prev, { id: crypto.randomUUID(), type: 'error', text: 'Execution failed.', timestamp: new Date() }]);
    }
  };

  // --- UPDATED: Real Terminal Logic ---
  const handleTerminalSubmit = async (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && terminalInput.trim()) {
          const cmd = terminalInput.trim();
          setTerminalInput(''); 
          setLogs(prev => [...prev, { id: crypto.randomUUID(), type: 'cmd', text: cmd, timestamp: new Date() }]);

          if (cmd === 'clear') { setLogs([]); return; }

          try {
              const res = await fetch(`${API_URL}/api/terminal`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ command: cmd })
              });
              const data = await res.json();
              setLogs(prev => [...prev, { id: crypto.randomUUID(), type: 'info', text: data.output, timestamp: new Date() }]);
              
              if (['ls', 'touch', 'rm', 'mkdir'].some(c => cmd.startsWith(c))) refreshFileSystem();
          } catch (e) {
              setLogs(prev => [...prev, { id: crypto.randomUUID(), type: 'error', text: 'Connection failed.', timestamp: new Date() }]);
          }
      }
  };

  // --- UPDATED: Real AI Chat Streaming ---
  const handleChatSubmit = async () => {
      if (!chatInput.trim()) return;
      
      const userText = chatInput;
      setChatInput('');
      setAvatarState(AvatarState.THINKING);

      // 1. Add User Message
      setChatMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', text: userText }]);

      // 2. Add AI Placeholder
      const aiMsgId = crypto.randomUUID();
      setChatMessages(prev => [...prev, { id: aiMsgId, role: 'ai', text: '', isTyping: true }]);

      try {
          const response = await fetch(`${API_URL}/api/chat`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: userText, model: 'deepseek-coder' }),
          });

          setAvatarState(AvatarState.SPEAKING);
          
          if (!response.body) throw new Error("No response body");
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let aiText = '';

          while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value);
              aiText += chunk;
              
              // Update the specific message in place
              setChatMessages(prev => prev.map(msg => 
                  msg.id === aiMsgId ? { ...msg, text: aiText } : msg
              ));
          }
          
          // Finalize
          setChatMessages(prev => prev.map(msg => 
              msg.id === aiMsgId ? { ...msg, isTyping: false } : msg
          ));
          setAvatarState(AvatarState.IDLE);

      } catch (error) {
          console.error("Chat Error:", error);
          setChatMessages(prev => prev.map(msg => 
              msg.id === aiMsgId ? { ...msg, text: "Error: Could not connect to Neural Core.", isTyping: false } : msg
          ));
          setAvatarState(AvatarState.IDLE);
      }
  };

  const toggleZen = () => {
      setIsZenMode(!isZenMode);
      if (!isZenMode) { setIsSidebarOpen(false); setIsChatOpen(false); setIsPreviewOpen(false); } 
      else { setIsSidebarOpen(true); setIsChatOpen(true); }
  };

  return (
    <div className="w-full h-full flex bg-transparent font-sans overflow-hidden backdrop-blur-sm">
      {/* Sidebar */}
      <div className={`${isSidebarOpen && !isZenMode ? 'w-64' : 'w-0'} flex-shrink-0 bg-black/60 border-r border-white/5 flex flex-col transition-all duration-300 overflow-hidden backdrop-blur-md`}>
          <div className="p-3 border-b border-white/5 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2"><Folder size={14} /> Explorer</span>
              <div className="flex gap-1">
                 <button className="p-1 hover:bg-white/10 rounded text-zinc-500 hover:text-white"><Plus size={14}/></button>
                 <button className="p-1 hover:bg-white/10 rounded text-zinc-500 hover:text-white"><Search size={14}/></button>
              </div>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
              <div className="px-2 mb-2">
                  <div className="flex items-center gap-1 text-xs font-bold text-zinc-400 mb-1 cursor-pointer hover:text-white group"><ChevronDown size={14} className="group-hover:text-cyan-400" /> LOCAL-AI-OS</div>
                  <div className="pl-2 space-y-0.5">
                      {files.map(file => (
                          <div key={file.id} onClick={() => handleFileClick(file.id)} className={`group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors text-sm ${activeFileId === file.id ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}>
                              <FileCode size={14} className={activeFileId === file.id ? 'text-cyan-400' : 'text-zinc-600 group-hover:text-zinc-400'} />
                              <span className="flex-1 truncate">{file.name}</span>
                              {file.isDirty && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-black/20 backdrop-blur-sm relative">
          <div className="h-10 bg-black/40 flex items-center border-b border-white/5 backdrop-blur-md z-10">
               {!isZenMode && <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="px-3 text-zinc-500 hover:text-white"><Layout size={16} /></button>}
               <div className="flex-1 flex overflow-x-auto scrollbar-hide">
                   {openFiles.map(file => (
                       <div key={file.id} onClick={() => setActiveFileId(file.id)} className={`group flex items-center gap-2 px-3 min-w-[120px] max-w-[200px] border-r border-white/5 cursor-pointer text-xs select-none transition-colors ${activeFileId === file.id ? 'bg-white/5 text-cyan-400 border-t-2 border-t-cyan-400' : 'bg-transparent text-zinc-500 hover:bg-white/5'}`}>
                           <FileCode size={12} className={activeFileId === file.id ? 'text-cyan-400' : 'text-zinc-600'} />
                           <span className="truncate flex-1">{file.name}</span>
                           {file.isDirty && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-2" />}
                           <button onClick={(e) => handleCloseFile(e, file.id)} className={`opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded p-0.5 ${activeFileId === file.id ? 'text-cyan-400' : 'text-zinc-500'}`}><X size={12} /></button>
                       </div>
                   ))}
               </div>
               <div className="flex items-center px-2 gap-2 bg-black/40 h-full border-l border-white/5">
                   <button onClick={() => setIsPreviewOpen(!isPreviewOpen)} className={`p-2 rounded hover:bg-white/10 ${isPreviewOpen ? 'text-cyan-400 bg-white/5' : 'text-zinc-500 hover:text-white'}`}><Eye size={16} /></button>
                   <button onClick={handleRun} className="flex items-center gap-2 px-3 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/20 transition-all"><Play size={12} fill="currentColor" /> RUN</button>
                   <button onClick={handleSave} className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded"><Save size={16} /></button>
                   <button onClick={toggleZen} className={`p-2 rounded hover:bg-white/10 ${isZenMode ? 'text-cyan-400 bg-white/5' : 'text-zinc-500 hover:text-white'}`}><Minimize2 size={16} /></button>
                   <button onClick={() => setIsChatOpen(!isChatOpen)} className={`p-2 rounded hover:bg-white/10 ${isChatOpen ? 'text-cyan-400 bg-white/5' : 'text-zinc-500 hover:text-white'}`}><MessageSquare size={16} /></button>
               </div>
          </div>

          <div className="flex-1 flex relative overflow-hidden">
              <div className="flex-1 flex overflow-hidden">
                   <div className={`${isPreviewOpen ? 'w-1/2 border-r border-white/5' : 'w-full'} h-full relative transition-all duration-300`}>
                        {activeFile ? (
                           <Editor key={activeFile.id} height="100%" defaultLanguage={activeFile.language} value={activeFile.content} onMount={handleEditorMount} onChange={handleCodeChange} options={{ minimap: { enabled: !isZenMode }, fontSize: 15, fontFamily: 'JetBrains Mono', scrollBeyondLastLine: false, padding: { top: 24, bottom: 24 }, lineNumbers: isZenMode ? 'off' : 'on', renderLineHighlight: 'line', smoothScrolling: true, cursorBlinking: 'smooth', bracketPairColorization: { enabled: true }, guides: { indentation: !isZenMode }, }} />
                        ) : (
                           <div className="absolute inset-0 flex items-center justify-center text-zinc-700 flex-col gap-4"><Command size={64} className="opacity-20" /><p className="text-sm font-mono opacity-50">Select a file</p></div>
                        )}
                        {!isZenMode && (
                            <div className="absolute bottom-0 left-0 right-0 h-48 bg-black/80 border-t border-white/10 flex flex-col backdrop-blur-xl z-10 transition-transform duration-300">
                                <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/5">
                                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider"><TerminalIcon size={12} /> Terminal</div>
                                    <button onClick={() => setLogs([])} className="text-[10px] hover:text-white text-zinc-600 uppercase">Clear</button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1 custom-scrollbar">
                                    {logs.map(log => (
                                        <div key={log.id} className="flex gap-3"><span className="text-zinc-600 shrink-0 select-none">[{log.timestamp.toLocaleTimeString()}]</span><span className={`${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-emerald-400' : log.type === 'cmd' ? 'text-cyan-400 font-bold' : 'text-zinc-300'}`}>{log.type === 'cmd' && <span className="text-zinc-500 mr-2">$</span>}{log.text}</span></div>
                                    ))}
                                    <div ref={terminalEndRef} />
                                </div>
                                <div className="p-2 border-t border-white/5 flex items-center gap-2 bg-black/40"><span className="text-cyan-500 font-mono text-sm font-bold pl-2">➜</span><input type="text" value={terminalInput} onChange={(e) => setTerminalInput(e.target.value)} onKeyDown={handleTerminalSubmit} className="flex-1 bg-transparent border-none outline-none text-zinc-300 font-mono text-sm h-8" placeholder="Type command..." /></div>
                            </div>
                        )}
                   </div>
                   <div className={`${isPreviewOpen ? 'w-1/2 opacity-100' : 'w-0 opacity-0'} h-full bg-white transition-all duration-300 relative overflow-hidden`}>
                       <iframe srcDoc={previewContent} className="w-full h-full border-none bg-white" title="Live Preview" sandbox="allow-scripts" />
                   </div>
              </div>
              <div className={`${isChatOpen && !isZenMode ? 'w-80' : 'w-0'} flex-shrink-0 bg-black/60 border-l border-white/5 flex flex-col transition-all duration-300 overflow-hidden backdrop-blur-md`}>
                   <div className="p-3 border-b border-white/5 flex items-center justify-between bg-white/5"><span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2"><Wand2 size={14} className="text-cyan-400" /> Pair Programmer</span></div>
                   <div className="h-32 relative bg-black/20 border-b border-white/5"><VoiceAvatar state={avatarState} visualContext={visualContext} audioLevel={audioLevel} compact primaryColor="#22d3ee" visible={isChatOpen} customShapeFn={customShapeFn} /></div>
                   <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                       {chatMessages.map(msg => (<div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}><div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${msg.role === 'user' ? 'bg-cyan-900/20 text-cyan-100 border border-cyan-500/20 rounded-br-none' : 'bg-white/5 text-zinc-300 border border-white/5 rounded-bl-none'} ${msg.isTyping ? 'animate-pulse' : ''}`}>{msg.text}{msg.isTyping && <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-cyan-400 animate-blink"/>}</div></div>))}
                       <div ref={chatEndRef} />
                   </div>
                   <div className="p-3 border-t border-white/5 bg-black/40"><div className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-xl px-2 py-1 focus-within:border-cyan-500/50 transition-colors"><button onClick={() => setAvatarState(avatarState === AvatarState.LISTENING ? AvatarState.IDLE : AvatarState.LISTENING)} className={`p-2 rounded-lg transition-colors ${avatarState === AvatarState.LISTENING ? 'text-red-400 bg-red-500/10' : 'text-zinc-500 hover:text-zinc-300'}`}><Mic size={14} /></button><input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()} placeholder="Ask AI..." className="flex-1 bg-transparent border-none outline-none text-xs text-white h-8" /><button onClick={handleChatSubmit} className="p-2 text-cyan-400 hover:text-cyan-300"><Send size={14} /></button></div></div>
              </div>
          </div>
      </div>
    </div>
  );
};