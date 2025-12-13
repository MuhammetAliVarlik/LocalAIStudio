import React, { useState, useEffect, useRef } from 'react';
import { FileCode, Folder, Play, Save, X, Terminal as TerminalIcon, Search, MoreVertical, ChevronDown, ChevronRight, Layout, Command, Settings, Plus, Sparkles, Maximize2, Minimize2, Wand2, MessageSquare, Mic, Send, Eye, EyeOff } from 'lucide-react';
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
}

// --- Mock Data ---
const INITIAL_FILES: File[] = [
  { 
    id: '1', 
    name: 'index.html', 
    language: 'html', 
    isOpen: true,
    content: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { background: #111; color: #0ff; font-family: monospace; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    h1 { animation: glow 2s ease-in-out infinite alternate; }
    @keyframes glow { from { text-shadow: 0 0 10px #0ff; } to { text-shadow: 0 0 20px #0ff, 0 0 30px #00f; } }
  </style>
</head>
<body>
  <h1>HELLO NEURAL NETWORK</h1>
</body>
</html>`
  },
  { 
    id: '2', 
    name: 'script.py', 
    language: 'python', 
    isOpen: false,
    content: `def neural_handshake():
    print("Synapse established.")
    return True

if __name__ == "__main__":
    neural_handshake()`
  }
];

export const CodeStudio: React.FC = () => {
  const { state, actions } = useApp();
  
  // 1. GET FULL STATE (Fixes Avatar Sync)
  const { avatarState, customShapeFn, visualContext, audioLevel } = state;
  const { setAvatarState } = actions;

  // State
  const [files, setFiles] = useState<File[]>(INITIAL_FILES);
  const [activeFileId, setActiveFileId] = useState<string>('1');
  const [logs, setLogs] = useState<Log[]>([
    { id: '0', type: 'info', text: 'Neural Engine initialized...', timestamp: new Date() }
  ]);
  const [terminalInput, setTerminalInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  
  const [chatMessages, setChatMessages] = useState<CodeChatMsg[]>([
      { id: '1', role: 'ai', text: 'I am ready to assist with your code. How can I help?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Derived
  const activeFile = files.find(f => f.id === activeFileId);
  const openFiles = files.filter(f => f.isOpen);

  // Effects
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Editor Setup
  const handleEditorMount = (editor: any, monaco: Monaco) => {
      monaco.editor.defineTheme('vibe-theme', {
          base: 'vs-dark',
          inherit: true,
          rules: [],
          colors: {
              'editor.background': '#00000000', // Transparent
              'editor.lineHighlightBackground': '#ffffff08',
              'editorGutter.background': '#00000000'
          }
      });
      monaco.editor.setTheme('vibe-theme');
  };

  // Handlers
  const handleFileClick = (id: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, isOpen: true } : f));
    setActiveFileId(id);
  };

  const handleCloseFile = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFiles(prev => prev.map(f => f.id === id ? { ...f, isOpen: false } : f));
    if (activeFileId === id) {
       const remaining = openFiles.filter(f => f.id !== id);
       if (remaining.length > 0) setActiveFileId(remaining[remaining.length - 1].id);
       else setActiveFileId('');
    }
  };

  const handleCodeChange = (val: string | undefined) => {
    if (!activeFileId || val === undefined) return;
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: val, isDirty: true } : f));
  };

  const handleSave = () => {
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, isDirty: false } : f));
    setLogs(prev => [...prev, {
        id: Date.now().toString(),
        type: 'info',
        text: `Saved ${activeFile?.name}`,
        timestamp: new Date()
    }]);
  };

  const handleRun = () => {
    if (!activeFile) return;

    if (activeFile.language === 'html') {
        setPreviewContent(activeFile.content);
        if (!isPreviewOpen) setIsPreviewOpen(true);
        setLogs(prev => [...prev, {
            id: Date.now().toString(),
            type: 'success',
            text: 'Preview refreshed.',
            timestamp: new Date()
        }]);
        return;
    }

    const newLog: Log = {
        id: Date.now().toString(),
        type: 'cmd',
        text: `python ${activeFile?.name || 'script.py'}`,
        timestamp: new Date()
    };
    setLogs(prev => [...prev, newLog]);

    setTimeout(() => {
        setLogs(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            type: 'info',
            text: 'Compiling environment...',
            timestamp: new Date()
        }]);
    }, 200);

    setTimeout(() => {
        setLogs(prev => [...prev, {
            id: (Date.now() + 2).toString(),
            type: 'success',
            text: 'Execution successful (230ms). Output: Synapse established.',
            timestamp: new Date()
        }]);
    }, 1200);
  };

  const handleTerminalSubmit = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && terminalInput.trim()) {
          const cmd = terminalInput.trim();
          setLogs(prev => [...prev, { id: Date.now().toString(), type: 'cmd', text: cmd, timestamp: new Date() }]);
          setTerminalInput('');
          
          setTimeout(() => {
              let response = `Command not found: ${cmd}`;
              let type: 'error' | 'info' | 'success' = 'error';
              
              if (cmd === 'ls') { response = 'main.py  utils.py  config.json  styles.css'; type='info'; }
              if (cmd === 'clear') { setLogs([]); return; }
              if (cmd === 'help') { response = 'Available commands: ls, run, clear, help'; type='info'; }
              
              setLogs(prev => [...prev, { id: Date.now().toString(), type, text: response, timestamp: new Date() }]);
          }, 300);
      }
  };

  const handleChatSubmit = () => {
      if (!chatInput.trim()) return;
      const userMsg: CodeChatMsg = { id: Date.now().toString(), role: 'user', text: chatInput };
      setChatMessages(prev => [...prev, userMsg]);
      setChatInput('');
      setAvatarState(AvatarState.THINKING);

      setTimeout(() => {
          setAvatarState(AvatarState.SPEAKING);
          const aiMsg: CodeChatMsg = { id: (Date.now()+1).toString(), role: 'ai', text: 'I see what you are trying to do. You can optimize line 12 by using a list comprehension. Here is a snippet...' };
          setChatMessages(prev => [...prev, aiMsg]);
          
          setTimeout(() => setAvatarState(AvatarState.IDLE), 3000);
      }, 1500);
  };

  const toggleZen = () => {
      setIsZenMode(!isZenMode);
      if (!isZenMode) {
          setIsSidebarOpen(false);
          setIsChatOpen(false);
          setIsPreviewOpen(false);
      } else {
          setIsSidebarOpen(true);
          setIsChatOpen(true);
      }
  };

  return (
    <div className="w-full h-full flex bg-transparent font-sans overflow-hidden backdrop-blur-sm">
      
      {/* --- Sidebar --- */}
      <div className={`${isSidebarOpen && !isZenMode ? 'w-64' : 'w-0'} flex-shrink-0 bg-black/60 border-r border-white/5 flex flex-col transition-all duration-300 overflow-hidden backdrop-blur-md`}>
          <div className="p-3 border-b border-white/5 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <Folder size={14} /> Explorer
              </span>
              <div className="flex gap-1">
                 <button className="p-1 hover:bg-white/10 rounded text-zinc-500 hover:text-white"><Plus size={14}/></button>
                 <button className="p-1 hover:bg-white/10 rounded text-zinc-500 hover:text-white"><Search size={14}/></button>
              </div>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
              <div className="px-2 mb-2">
                  <div className="flex items-center gap-1 text-xs font-bold text-zinc-400 mb-1 cursor-pointer hover:text-white group">
                      <ChevronDown size={14} className="group-hover:text-cyan-400" /> LOCAL-AI-OS
                  </div>
                  <div className="pl-2 space-y-0.5">
                      {files.map(file => (
                          <div 
                             key={file.id} 
                             onClick={() => handleFileClick(file.id)}
                             className={`group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors text-sm ${activeFileId === file.id ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
                          >
                              <FileCode size={14} className={activeFileId === file.id ? 'text-cyan-400' : 'text-zinc-600 group-hover:text-zinc-400'} />
                              <span className="flex-1 truncate">{file.name}</span>
                              {file.isDirty && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>

      {/* --- Main Content --- */}
      <div className="flex-1 flex flex-col min-w-0 bg-black/20 backdrop-blur-sm relative">
          
          {/* Top Bar */}
          <div className="h-10 bg-black/40 flex items-center border-b border-white/5 backdrop-blur-md z-10">
               {!isZenMode && (
                   <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="px-3 text-zinc-500 hover:text-white">
                       <Layout size={16} />
                   </button>
               )}
               
               {/* Tabs */}
               <div className="flex-1 flex overflow-x-auto scrollbar-hide">
                   {openFiles.map(file => (
                       <div 
                         key={file.id}
                         onClick={() => setActiveFileId(file.id)}
                         className={`group flex items-center gap-2 px-3 min-w-[120px] max-w-[200px] border-r border-white/5 cursor-pointer text-xs select-none transition-colors ${activeFileId === file.id ? 'bg-white/5 text-cyan-400 border-t-2 border-t-cyan-400' : 'bg-transparent text-zinc-500 hover:bg-white/5'}`}
                       >
                           <FileCode size={12} className={activeFileId === file.id ? 'text-cyan-400' : 'text-zinc-600'} />
                           <span className="truncate flex-1">{file.name}</span>
                           {file.isDirty && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-2" />}
                           <button 
                             onClick={(e) => handleCloseFile(e, file.id)}
                             className={`opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded p-0.5 ${activeFileId === file.id ? 'text-cyan-400' : 'text-zinc-500'}`}
                           >
                               <X size={12} />
                           </button>
                       </div>
                   ))}
               </div>

               {/* Toolbar Actions */}
               <div className="flex items-center px-2 gap-2 bg-black/40 h-full border-l border-white/5">
                   <button onClick={() => setIsPreviewOpen(!isPreviewOpen)} className={`p-2 rounded hover:bg-white/10 ${isPreviewOpen ? 'text-cyan-400 bg-white/5' : 'text-zinc-500 hover:text-white'}`} title="Live Preview">
                       {isPreviewOpen ? <Eye size={16} /> : <EyeOff size={16} />}
                   </button>
                   <button onClick={handleRun} className="flex items-center gap-2 px-3 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/20 transition-all">
                       <Play size={12} fill="currentColor" /> RUN
                   </button>
                   <button onClick={handleSave} className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded" title="Save">
                       <Save size={16} />
                   </button>
                   <button onClick={toggleZen} className={`p-2 rounded hover:bg-white/10 ${isZenMode ? 'text-cyan-400 bg-white/5' : 'text-zinc-500 hover:text-white'}`} title="Zen Mode">
                       {isZenMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                   </button>
                   <button onClick={() => setIsChatOpen(!isChatOpen)} className={`p-2 rounded hover:bg-white/10 ${isChatOpen ? 'text-cyan-400 bg-white/5' : 'text-zinc-500 hover:text-white'}`} title="Toggle AI Chat">
                       <MessageSquare size={16} />
                   </button>
               </div>
          </div>

          <div className="flex-1 flex relative overflow-hidden">
              {/* Editor Split Area */}
              <div className="flex-1 flex overflow-hidden">
                   {/* Monaco */}
                   <div className={`${isPreviewOpen ? 'w-1/2 border-r border-white/5' : 'w-full'} h-full relative transition-all duration-300`}>
                        {activeFile ? (
                           <Editor
                              key={activeFile.id} // FORCE RE-RENDER on file change
                              height="100%"
                              defaultLanguage={activeFile.language}
                              value={activeFile.content}
                              onMount={handleEditorMount}
                              onChange={handleCodeChange}
                              options={{
                                minimap: { enabled: !isZenMode },
                                fontSize: 15,
                                fontFamily: 'JetBrains Mono',
                                scrollBeyondLastLine: false,
                                padding: { top: 24, bottom: 24 },
                                lineNumbers: isZenMode ? 'off' : 'on',
                                renderLineHighlight: 'line',
                                smoothScrolling: true,
                                cursorBlinking: 'smooth',
                                bracketPairColorization: { enabled: true },
                                guides: { indentation: !isZenMode },
                              }}
                            />
                        ) : (
                           <div className="absolute inset-0 flex items-center justify-center text-zinc-700 flex-col gap-4">
                               <Command size={64} className="opacity-20" />
                               <p className="text-sm font-mono opacity-50">Select a file</p>
                           </div>
                        )}
                        
                        {/* Terminal Overlay */}
                        {!isZenMode && (
                            <div className="absolute bottom-0 left-0 right-0 h-48 bg-black/80 border-t border-white/10 flex flex-col backdrop-blur-xl z-10 transition-transform duration-300">
                                <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/5">
                                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                        <TerminalIcon size={12} /> Terminal
                                    </div>
                                    <button onClick={() => setLogs([])} className="text-[10px] hover:text-white text-zinc-600 uppercase">Clear</button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1 custom-scrollbar">
                                    {logs.map(log => (
                                        <div key={log.id} className="flex gap-3">
                                            <span className="text-zinc-600 shrink-0 select-none">[{log.timestamp.toLocaleTimeString()}]</span>
                                            <span className={`${
                                                log.type === 'error' ? 'text-red-400' : 
                                                log.type === 'success' ? 'text-emerald-400' : 
                                                log.type === 'cmd' ? 'text-cyan-400 font-bold' : 'text-zinc-300'
                                            }`}>
                                                {log.type === 'cmd' && <span className="text-zinc-500 mr-2">$</span>}
                                                {log.text}
                                            </span>
                                        </div>
                                    ))}
                                    <div ref={terminalEndRef} />
                                </div>
                                <div className="p-2 border-t border-white/5 flex items-center gap-2 bg-black/40">
                                    <span className="text-cyan-500 font-mono text-sm font-bold pl-2">➜</span>
                                    <input 
                                      type="text" 
                                      value={terminalInput}
                                      onChange={(e) => setTerminalInput(e.target.value)}
                                      onKeyDown={handleTerminalSubmit}
                                      className="flex-1 bg-transparent border-none outline-none text-zinc-300 font-mono text-sm h-8"
                                      placeholder="Type command..."
                                    />
                                </div>
                            </div>
                        )}
                   </div>

                   {/* Live Preview Pane */}
                   <div className={`${isPreviewOpen ? 'w-1/2 opacity-100' : 'w-0 opacity-0'} h-full bg-white transition-all duration-300 relative overflow-hidden`}>
                       <iframe 
                           srcDoc={previewContent} 
                           className="w-full h-full border-none bg-white" 
                           title="Live Preview"
                           sandbox="allow-scripts"
                       />
                       {!previewContent && (
                           <div className="absolute inset-0 flex items-center justify-center text-black/50 text-sm font-mono bg-zinc-100">
                               Click RUN to render output
                           </div>
                       )}
                   </div>
              </div>

              {/* Chat Sidebar */}
              <div className={`${isChatOpen && !isZenMode ? 'w-80' : 'w-0'} flex-shrink-0 bg-black/60 border-l border-white/5 flex flex-col transition-all duration-300 overflow-hidden backdrop-blur-md`}>
                   <div className="p-3 border-b border-white/5 flex items-center justify-between bg-white/5">
                       <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                          <Wand2 size={14} className="text-cyan-400" /> Pair Programmer
                       </span>
                   </div>
                   
                   <div className="h-32 relative bg-black/20 border-b border-white/5">
                        {/* 2. CORRECTED AVATAR PROPS: Supports Architect & Real Data */}
                        <VoiceAvatar 
                            state={avatarState} 
                            visualContext={visualContext}
                            audioLevel={audioLevel}
                            compact 
                            primaryColor="#22d3ee" 
                            visible={isChatOpen} 
                            customShapeFn={customShapeFn}
                        />
                   </div>

                   <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                       {chatMessages.map(msg => (
                           <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                               <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                                   msg.role === 'user' 
                                   ? 'bg-cyan-900/20 text-cyan-100 border border-cyan-500/20 rounded-br-none' 
                                   : 'bg-white/5 text-zinc-300 border border-white/5 rounded-bl-none'
                               }`}>
                                   {msg.text}
                               </div>
                           </div>
                       ))}
                       <div ref={chatEndRef} />
                   </div>

                   <div className="p-3 border-t border-white/5 bg-black/40">
                       <div className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-xl px-2 py-1 focus-within:border-cyan-500/50 transition-colors">
                           <button 
                             onClick={() => setAvatarState(avatarState === AvatarState.LISTENING ? AvatarState.IDLE : AvatarState.LISTENING)}
                             className={`p-2 rounded-lg transition-colors ${avatarState === AvatarState.LISTENING ? 'text-red-400 bg-red-500/10' : 'text-zinc-500 hover:text-zinc-300'}`}
                           >
                               <Mic size={14} />
                           </button>
                           <input 
                              type="text"
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                              placeholder="Ask AI..."
                              className="flex-1 bg-transparent border-none outline-none text-xs text-white h-8" 
                           />
                           <button onClick={handleChatSubmit} className="p-2 text-cyan-400 hover:text-cyan-300">
                               <Send size={14} />
                           </button>
                       </div>
                   </div>
              </div>
          </div>

      </div>
    </div>
  );
};