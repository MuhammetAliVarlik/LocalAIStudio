import React, { useCallback, useRef, useState, useMemo, useEffect } from 'react';
import ReactFlow, {
  Node, Edge, Background, Controls, Connection, addEdge,
  useNodesState, useEdgesState, Position, Handle, NodeProps,
  ReactFlowProvider, useReactFlow, Panel, MarkerType
} from 'reactflow';
import { 
  Settings, Database, Cpu, Brain, Sparkles, Save, 
  Layers, Fingerprint, Image as ImageIcon, Sliders,
  Shield, Activity, Plus, Trash2, RotateCw,
  Network, Terminal, BrainCircuit, AlertTriangle, Frown, Smile, Flame, Ghost, Loader2, Mic
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext'; // Import Context

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

type Emotion = 'joy' | 'sadness' | 'anger' | 'fear' | 'disgust' | 'neutral';

const KOKORO_VOICES = [
    { id: 'af_sarah', name: 'Sarah (US Female)', type: 'American' },
    { id: 'af_bella', name: 'Bella (US Female)', type: 'American' },
    { id: 'af_nicole', name: 'Nicole (US Female)', type: 'American' },
    { id: 'af_sky',   name: 'Sky (US Female)', type: 'American' },
    { id: 'am_adam',  name: 'Adam (US Male)', type: 'American' },
    { id: 'am_michael', name: 'Michael (US Male)', type: 'American' },
    { id: 'bf_emma',  name: 'Emma (UK Female)', type: 'British' },
    { id: 'bf_isabella', name: 'Isabella (UK Female)', type: 'British' },
    { id: 'bm_george', name: 'George (UK Male)', type: 'British' },
    { id: 'bm_lewis', name: 'Lewis (UK Male)', type: 'British' },
];

const EMOTION_CONFIG: Record<Emotion, { color: string, label: string, icon: any, gradient: string, shadow: string, ring: string }> = {
    joy: { color: '#fbbf24', label: 'Joy', icon: Smile, gradient: 'from-yellow-400 to-amber-600', shadow: 'shadow-amber-500/50', ring: 'ring-amber-500' },
    sadness: { color: '#60a5fa', label: 'Sadness', icon: Frown, gradient: 'from-blue-400 to-blue-700', shadow: 'shadow-blue-500/50', ring: 'ring-blue-500' },
    anger: { color: '#f87171', label: 'Anger', icon: Flame, gradient: 'from-red-400 to-red-700', shadow: 'shadow-red-500/50', ring: 'ring-red-500' },
    fear: { color: '#a78bfa', label: 'Fear', icon: Ghost, gradient: 'from-violet-400 to-violet-700', shadow: 'shadow-violet-500/50', ring: 'ring-violet-500' },
    disgust: { color: '#34d399', label: 'Disgust', icon: AlertTriangle, gradient: 'from-emerald-400 to-emerald-700', shadow: 'shadow-emerald-500/50', ring: 'ring-emerald-500' },
    neutral: { color: '#94a3b8', label: 'Neutral', icon: Database, gradient: 'from-slate-400 to-slate-600', shadow: 'shadow-slate-500/50', ring: 'ring-slate-500' }
};

// --- NODES ---
const CoreNode = ({ data, selected }: NodeProps) => (
  <div className={`relative w-24 h-24 rounded-full flex items-center justify-center backdrop-blur-xl border-2 transition-all duration-300 shadow-[0_0_30px_rgba(0,0,0,0.5)] ${selected ? 'border-cyan-400 bg-cyan-900/40 scale-110 shadow-[0_0_30px_rgba(34,211,238,0.3)]' : 'border-white/20 bg-black/60'}`}>
    <Handle type="target" position={Position.Top} className="!bg-transparent !border-none" />
    <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-none" />
    <div className="text-center">
        <Fingerprint size={32} className={selected ? 'text-cyan-400' : 'text-zinc-500'} />
        <div className="text-[10px] font-bold uppercase mt-1 tracking-wider text-white">{data.label}</div>
    </div>
  </div>
);

const MemoryNode = ({ data, selected }: NodeProps) => (
  <div className={`relative px-4 py-3 rounded-xl backdrop-blur-md border transition-all duration-300 min-w-[180px] ${selected ? 'border-amber-400 bg-amber-900/20 shadow-[0_0_20px_rgba(251,191,36,0.2)]' : 'border-white/10 bg-black/40'}`}>
    <Handle type="target" position={Position.Top} className="!bg-white !w-2 !h-2" />
    <Handle type="source" position={Position.Bottom} className="!bg-white !w-2 !h-2" />
    <div className="flex items-center gap-3">
        <Database size={16} className={selected ? 'text-amber-400' : 'text-zinc-500'} />
        <div>
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Memory Block</div>
            <div className="text-xs font-medium text-zinc-200">{data.label}</div>
        </div>
    </div>
  </div>
);

const TraitNode = ({ data, selected }: NodeProps) => (
  <div className={`relative px-4 py-3 rounded-full backdrop-blur-md border transition-all duration-300 min-w-[140px] ${selected ? 'border-fuchsia-400 bg-fuchsia-900/20 shadow-[0_0_20px_rgba(232,121,249,0.2)]' : 'border-white/10 bg-black/40'}`}>
    <Handle type="target" position={Position.Top} className="!bg-white !w-2 !h-2" />
    <Handle type="source" position={Position.Bottom} className="!bg-white !w-2 !h-2" />
    <div className="flex items-center gap-2 justify-center">
        <Sparkles size={14} className={selected ? 'text-fuchsia-400' : 'text-zinc-500'} />
        <div className="text-xs font-bold text-zinc-200 uppercase">{data.label}</div>
    </div>
  </div>
);

const DirectiveNode = ({ data, selected }: NodeProps) => (
  <div className={`relative px-4 py-3 rounded-lg backdrop-blur-md border transition-all duration-300 min-w-[200px] border-l-4 ${selected ? 'border-l-emerald-400 border-y-white/10 border-r-white/10 bg-emerald-900/10' : 'border-l-zinc-600 border-y-white/5 border-r-white/5 bg-black/40'}`}>
    <Handle type="target" position={Position.Top} className="!bg-white !w-2 !h-2" />
    <div className="flex items-center gap-3">
        <Shield size={16} className={selected ? 'text-emerald-400' : 'text-zinc-600'} />
        <div className="flex-1">
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Prime Directive</div>
            <div className="text-xs font-mono text-zinc-300 leading-tight mt-1">{data.label}</div>
        </div>
    </div>
  </div>
);

const ChronoNode = ({ data, selected }: NodeProps) => {
    const config = EMOTION_CONFIG[data.emotion as Emotion] || EMOTION_CONFIG.neutral;
    const date = new Date(data.timestamp);
    const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="group relative flex flex-col items-center">
            <Handle type="target" position={Position.Left} className="!bg-transparent !border-none !w-0 !h-0" />
            <Handle type="source" position={Position.Right} className="!bg-transparent !border-none !w-0 !h-0" />
            <div className={`absolute -top-8 text-[10px] font-mono transition-all ${selected ? 'text-white font-bold opacity-100' : 'text-zinc-600 opacity-50 group-hover:opacity-100'}`}>
                {dateStr}
            </div>
            <motion.div 
                whileHover={{ scale: 1.1 }}
                className={`
                    relative w-16 h-16 rounded-full flex items-center justify-center
                    backdrop-blur-xl border-2 transition-all duration-500 cursor-pointer
                    ${selected 
                        ? `border-white ${config.shadow} bg-gradient-to-br ${config.gradient}` 
                        : `border-white/10 bg-black/60 hover:border-${config.color} hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]`
                    }
                `}
            >
                <config.icon size={24} className={`transition-colors ${selected ? 'text-white' : 'text-zinc-500 group-hover:text-white'}`} />
                {data.isCore && <div className="absolute inset-0 rounded-full border-2 border-white/50 animate-pulse-slow" style={{ padding: '-4px' }} />}
            </motion.div>
            <div className={`absolute -bottom-12 w-32 text-center transition-all ${selected ? 'opacity-100 translate-y-0' : 'opacity-60 translate-y-1'}`}>
                <div className={`text-xs font-bold truncate ${selected ? 'text-white' : 'text-zinc-400'}`}>{data.label}</div>
                <div className="text-[9px] text-zinc-600 font-mono">{timeStr}</div>
            </div>
        </div>
    );
};

const mapNodeTypes = { core: CoreNode, memory: MemoryNode, trait: TraitNode, directive: DirectiveNode };
const chronoNodeTypes = { chrono: ChronoNode };

// --- SUB-COMPONENTS (MemoryTimeline & NeuralMap) ---
const MemoryTimelineCanvas = ({ currentPersonaId }: { currentPersonaId: string }) => {
    const [memories, setMemories] = useState<any[]>([]);
    const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { fitView } = useReactFlow();

    const fetchMemories = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/memory?persona_id=${currentPersonaId}&limit=50`);
            if (!res.ok) { setMemories([]); return; }
            const data = await res.json();
            
            if (Array.isArray(data)) {
                const mapped = data.map((m: any) => ({
                    id: m.id,
                    label: m.label || 'Memory Fragment',
                    emotion: m.emotion || 'neutral',
                    isCore: m.isCore || false,
                    timestamp: m.timestamp || new Date().toISOString(),
                    text: m.text
                }));
                setMemories(mapped);
            } else {
                setMemories([]);
            }
        } catch (e) {
            console.error("Failed to sync memory", e);
            setMemories([]);
        } finally {
            setLoading(false);
        }
    }, [currentPersonaId]);

    useEffect(() => { fetchMemories(); }, [fetchMemories]);

    const { nodes, edges } = useMemo(() => {
        const sorted = [...memories].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const newNodes: Node[] = sorted.map((mem, index) => ({
            id: mem.id,
            type: 'chrono',
            position: { x: index * 200, y: Math.sin(index * 0.8) * 150 },
            data: { ...mem },
        }));

        const newEdges: Edge[] = [];
        for (let i = 0; i < newNodes.length - 1; i++) {
            newEdges.push({
                id: `e-${newNodes[i].id}-${newNodes[i+1].id}`,
                source: newNodes[i].id,
                target: newNodes[i+1].id,
                type: 'smoothstep',
                animated: true,
                style: { stroke: '#ffffff', strokeWidth: 1, opacity: 0.3 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#ffffff' }
            });
        }
        return { nodes: newNodes, edges: newEdges };
    }, [memories]);

    const onNodeClick = (_: any, node: Node) => setSelectedMemoryId(node.id);
    const updateMemory = (id: string, updates: any) => setMemories(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));

    const deleteMemory = async (id: string) => {
        try {
            await fetch(`${API_URL}/api/memory/${id}`, { method: 'DELETE' });
            setMemories(prev => prev.filter(m => m.id !== id));
            setSelectedMemoryId(null);
        } catch (e) { console.error("Delete failed", e); }
    };

    const addMemory = async () => {
        const newMem = { text: "New Memory", label: "Manual Entry", emotion: "neutral", persona_id: currentPersonaId };
        try {
            const res = await fetch(`${API_URL}/api/memory`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMem)
            });
            const data = await res.json();
            
            setMemories(prev => [...prev, { ...newMem, id: data.id, timestamp: new Date().toISOString(), isCore: false }]);
            setSelectedMemoryId(data.id);
            setTimeout(() => fitView({ duration: 500 }), 100);
        } catch (e) { console.error("Create failed", e); }
    };

    const handleSave = async () => {
        const mem = memories.find(m => m.id === selectedMemoryId);
        if (!mem) return;
        try {
            await fetch(`${API_URL}/api/memory/${mem.id}`, { 
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: mem.text, label: mem.label, emotion: mem.emotion, isCore: mem.isCore || false })
            });
            alert("Memory Rewritten.");
        } catch (e) { console.error("Update failed", e); }
    };

    const selectedMemory = memories.find(m => m.id === selectedMemoryId);

    return (
        <div className="w-full h-full bg-black relative flex">
             <div className="flex-1 relative">
                 {loading && (
                     <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                         <div className="flex flex-col items-center gap-4">
                             <Loader2 size={40} className="text-cyan-400 animate-spin" />
                             <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Retrieving Neural Fragments...</p>
                         </div>
                     </div>
                 )}
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(17,24,39,1),_rgba(0,0,0,1))] pointer-events-none" />
                 <ReactFlow
                    nodes={nodes} edges={edges} onNodeClick={onNodeClick} nodeTypes={chronoNodeTypes} fitView minZoom={0.1} maxZoom={1.5} proOptions={{ hideAttribution: true }}
                 >
                    <Controls className="bg-black/50 border border-white/10 fill-white rounded-lg" />
                    <Panel position="top-left" className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-xs text-zinc-400 flex items-center gap-2">
                        <BrainCircuit size={14} className="text-cyan-400" /> Neural Timeline (Last 50)
                        <button onClick={fetchMemories} className="ml-2 hover:text-white"><RotateCw size={12} /></button>
                    </Panel>
                    <Panel position="bottom-center">
                        <button onClick={addMemory} className="flex items-center gap-2 px-6 py-3 bg-cyan-500/10 border border-cyan-500/50 hover:bg-cyan-500/20 text-cyan-400 rounded-full font-bold text-sm backdrop-blur-md transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]">
                            <Plus size={16} /> IMPLANT MEMORY
                        </button>
                    </Panel>
                 </ReactFlow>
             </div>
             <div className={`w-96 bg-[#09090b] border-l border-white/10 flex flex-col transition-all duration-300 ${selectedMemoryId ? 'translate-x-0' : 'translate-x-full absolute right-0 h-full'}`}>
                 {selectedMemory ? (
                      <>
                          <div className="p-6 border-b border-white/10 bg-white/5 flex items-center justify-between mb-2">
                              <h3 className="text-lg font-bold text-white tracking-wide">Memory Editor</h3>
                              <button onClick={() => setSelectedMemoryId(null)} className="text-zinc-500 hover:text-white"><Plus size={20} className="rotate-45"/></button>
                          </div>
                          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                             <div className="space-y-2">
                                 <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Database size={12} /> Neural Data</label>
                                 <textarea value={selectedMemory.text} onChange={(e) => updateMemory(selectedMemory.id, { text: e.target.value })} className="w-full h-40 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-zinc-300 outline-none focus:border-cyan-500/50 resize-none font-sans leading-relaxed focus:bg-black/60 transition-colors" placeholder="Enter memory details..." />
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-2">
                                     <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Label</label>
                                     <input type="text" value={selectedMemory.label} onChange={(e) => updateMemory(selectedMemory.id, { label: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-white outline-none focus:border-cyan-500/50" />
                                 </div>
                                 <div className="space-y-3"><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Emotion</label>
                                     <div className="grid grid-cols-3 gap-2">
                                         {(Object.keys(EMOTION_CONFIG) as Emotion[]).map(emo => {
                                             const conf = EMOTION_CONFIG[emo];
                                             const isActive = selectedMemory.emotion === emo;
                                             return <button key={emo} onClick={() => updateMemory(selectedMemory.id, { emotion: emo })} className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${isActive ? `bg-white/10 border-white/30 text-white` : 'border-transparent text-zinc-500 hover:bg-white/5'}`}><conf.icon size={16} style={{ color: isActive ? 'white' : conf.color }} /><span className="text-[9px] font-bold uppercase">{conf.label}</span></button>
                                         })}
                                     </div>
                                 </div>
                             </div>
                          </div>
                          <div className="p-6 border-t border-white/10 bg-black/20 flex gap-3">
                             <button onClick={() => deleteMemory(selectedMemory.id)} className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"><Trash2 size={18} /></button>
                             <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]">SAVE CHANGES</button>
                          </div>
                      </>
                 ) : (
                     <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 p-8 text-center">
                         <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4"><Brain size={32} className="opacity-50" /></div>
                         <p className="text-sm">Select a memory node from the timeline to analyze or edit its contents.</p>
                     </div>
                 )}
             </div>
        </div>
    );
};

const NeuralMapCanvas = ({ nodes, edges, onNodesChange, onEdgesChange, onConnect, setNodes }: any) => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const { screenToFlowPosition } = useReactFlow();

    const onDrop = (event: React.DragEvent) => {
        event.preventDefault();
        const type = event.dataTransfer.getData('application/reactflow');
        const label = event.dataTransfer.getData('application/reactflow/label');
        if (!type || !screenToFlowPosition) return;
        const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
        setNodes((nds: any) => nds.concat({ id: Date.now().toString(), type, position, data: { label } }));
    };

    return (
        <div className="w-full h-full flex">
            <div className="w-64 border-r border-white/5 bg-black/20 flex flex-col z-20">
                <div className="p-4 border-b border-white/5">
                    <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Neural Components</h3>
                    <p className="text-[10px] text-zinc-600">Drag to graph to influence behavior.</p>
                </div>
                <div className="p-4 space-y-3">
                    {[ { type: 'memory', label: 'Static Memory', icon: Database, color: 'text-amber-400' }, { type: 'trait', label: 'Personality Trait', icon: Sparkles, color: 'text-fuchsia-400' }, { type: 'directive', label: 'Prime Directive', icon: Shield, color: 'text-emerald-400' } ].map((item, i) => (
                        <div key={i} draggable onDragStart={(e) => { e.dataTransfer.setData('application/reactflow', item.type); e.dataTransfer.setData('application/reactflow/label', item.label); }} className="p-3 bg-black/40 border border-white/5 rounded-lg hover:border-white/20 hover:bg-white/5 cursor-grab active:cursor-grabbing transition-all flex items-center gap-3 group">
                            <item.icon size={16} className={`${item.color} opacity-70 group-hover:opacity-100`} />
                            <span className="text-xs font-bold text-zinc-400 group-hover:text-white">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex-1 h-full bg-[#050505] relative group" ref={reactFlowWrapper} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
                <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} nodeTypes={mapNodeTypes} fitView proOptions={{ hideAttribution: true }}>
                    <Background color="#27272a" gap={24} size={1} />
                    <Controls className="bg-black border border-white/10 fill-white rounded-lg" />
                </ReactFlow>
            </div>
        </div>
    );
};

// --- MAIN BUILDER ---
export const AgentBuilder: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'map' | 'matrix' | 'memories'>('memories');
  const [personas, setPersonas] = useState<any[]>([]);
  const [currentPersonaId, setCurrentPersonaId] = useState<string>("nova");
  const [config, setConfig] = useState({ id: 'nova', name: 'Nova', color: '#22d3ee', voice: 'af_sarah', traits: { empathy: 75, logic: 80, creativity: 60, humor: 40 }, system_prompt: '' });
  const [mapNodes, setMapNodes, onMapNodesChange] = useNodesState([]);
  const [mapEdges, setMapEdges, onMapEdgesChange] = useEdgesState([]);
  const onMapConnect = useCallback((params: Connection) => setMapEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#52525b' } }, eds)), [setMapEdges]);
  
  // NEW: Get actions to trigger refresh
  const { actions } = useApp();

  useEffect(() => { fetch(`${API_URL}/api/personas`).then(r => r.json()).then(setPersonas).catch(console.error); }, []);

  useEffect(() => {
      fetch(`${API_URL}/api/personas/${currentPersonaId}`).then(r => { if(!r.ok) throw new Error("New Agent"); return r.json(); })
        .then(data => {
            if(data.id) {
                setConfig({ 
                    id: data.id, 
                    name: data.name, 
                    color: data.color, 
                    voice: data.voice || 'af_sarah',
                    traits: data.traits || { empathy: 50, logic: 50, creativity: 50, humor: 50 }, 
                    system_prompt: data.system_prompt || "You are an AI." 
                });
                if(data.map_state && data.map_state.nodes) { setMapNodes(data.map_state.nodes); setMapEdges(data.map_state.edges); } else { setMapNodes([{ id: 'core', type: 'core', position: { x: 400, y: 50 }, data: { label: data.name } }]); setMapEdges([]); }
            }
        })
        .catch(() => { setMapNodes([{ id: 'core', type: 'core', position: { x: 400, y: 50 }, data: { label: "New Agent" } }]); setMapEdges([]); });
  }, [currentPersonaId, setMapNodes, setMapEdges]);

  const saveConfig = async () => {
      const payload = { ...config, id: currentPersonaId, map_state: { nodes: mapNodes, edges: mapEdges } };
      await fetch(`${API_URL}/api/personas`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
      alert("Agent Configuration Saved.");
      
      // Fix: Immediately refresh global agent list
      fetch(`${API_URL}/api/personas`).then(r => r.json()).then(setPersonas);
      if (actions.refreshAgents) {
          actions.refreshAgents();
      }
  };

  const createNewAgent = () => {
      const newId = `agent-${Date.now()}`;
      setCurrentPersonaId(newId); 
      setConfig({ id: newId, name: "New Agent", color: "#ffffff", voice: 'af_sarah', traits: { empathy: 50, logic: 50, creativity: 50, humor: 50 }, system_prompt: "New system prompt." });
  };

  return (
    <div className="w-full h-full flex bg-[#09090b]">
        <div className="w-20 border-r border-white/5 flex flex-col items-center py-6 gap-4 bg-black/40">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg mb-4"><Brain size={24} className="text-white" /></div>
            {personas.map(p => (
                <button key={p.id} onClick={() => setCurrentPersonaId(p.id)} className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center relative group ${currentPersonaId === p.id ? 'border-white scale-110' : 'border-white/20 hover:border-white/50'}`} style={{ backgroundColor: p.color || '#333' }}>
                    <span className="text-[10px] font-bold text-black mix-blend-overlay">{p.name[0]}</span>
                    <div className="absolute left-12 bg-zinc-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">{p.name}</div>
                </button>
            ))}
            <button onClick={createNewAgent} className="w-10 h-10 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all"><Plus size={18} /></button>
        </div>
        <div className="flex-1 flex flex-col">
            <div className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between px-6 z-10">
                <div><h1 className="text-sm font-bold text-white tracking-wide uppercase">{config.name} // FORGE</h1><div className="text-[10px] text-zinc-500 font-mono">Editing Profile: {currentPersonaId}</div></div>
                <div className="flex bg-white/5 rounded-lg p-1 border border-white/5">
                    {['memories', 'map', 'matrix'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-2 rounded-md text-xs font-bold uppercase transition-all flex items-center gap-2 ${activeTab === tab ? 'bg-zinc-700 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}>
                            {tab === 'memories' && <BrainCircuit size={14} />}{tab === 'map' && <Network size={14} />}{tab === 'matrix' && <Sliders size={14} />}{tab}
                        </button>
                    ))}
                </div>
                <button onClick={saveConfig} className="px-4 py-2 rounded-lg bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-all flex items-center gap-2"><Save size={14} /> DEPLOY</button>
            </div>
            <div className="flex-1 flex overflow-hidden">
                {activeTab === 'memories' && <div className="w-full h-full relative"><ReactFlowProvider><MemoryTimelineCanvas currentPersonaId={currentPersonaId} /></ReactFlowProvider></div>}
                {activeTab === 'map' && <div className="w-full h-full relative"><ReactFlowProvider><NeuralMapCanvas nodes={mapNodes} edges={mapEdges} onNodesChange={onMapNodesChange} onEdgesChange={onMapEdgesChange} onConnect={onMapConnect} setNodes={setMapNodes} /></ReactFlowProvider></div>}
                {activeTab === 'matrix' && (
                    <div className="w-full h-full overflow-y-auto custom-scrollbar p-8">
                        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <div className="lg:col-span-4 space-y-6">
                                <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col items-center text-center">
                                    <div className="w-48 h-48 rounded-2xl bg-black border-2 border-white/10 mb-6 flex items-center justify-center"><ImageIcon size={40} className="text-zinc-700"/></div>
                                    <div className="w-full text-left space-y-4">
                                        <div><label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Name</label><input type="text" value={config.name} onChange={(e) => setConfig({...config, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none" /></div>
                                        <div><label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Color</label><div className="flex gap-2">{['#22d3ee', '#34d399', '#f472b6', '#fbbf24', '#ef4444', '#a78bfa'].map(c => <button key={c} onClick={() => setConfig({...config, color: c})} className={`w-8 h-8 rounded-full border-2 ${config.color === c ? 'border-white scale-110' : 'border-transparent opacity-40'}`} style={{ backgroundColor: c }} />)}</div></div>
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-8 space-y-6">
                                {/* VOICE SELECTOR */}
                                <div className="glass-panel p-8 rounded-2xl border border-white/10">
                                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Mic size={16} /> VOCAL INTERFACE</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {KOKORO_VOICES.map(voice => (
                                            <button 
                                                key={voice.id} 
                                                onClick={() => setConfig({ ...config, voice: voice.id })}
                                                className={`p-3 rounded-xl border text-left transition-all ${config.voice === voice.id ? 'bg-cyan-500/20 border-cyan-500/50 text-white' : 'bg-black/40 border-white/5 text-zinc-500 hover:bg-white/5'}`}
                                            >
                                                <div className="text-xs font-bold">{voice.name}</div>
                                                <div className="text-[9px] uppercase tracking-wider opacity-60">{voice.type}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="glass-panel p-8 rounded-2xl border border-white/10 bg-[#0c0c0e]">
                                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2"><Cpu size={16} /> PSYCHE PARAMETERS</h3>
                                    <div className="space-y-8">{Object.keys(config.traits).map((trait) => (<div key={trait}><div className="flex justify-between mb-2"><span className="text-xs font-bold text-zinc-300 uppercase">{trait}</span><span className="text-xs font-mono text-cyan-400">{(config.traits as any)[trait]}%</span></div><input type="range" min="0" max="100" value={(config.traits as any)[trait]} onChange={(e) => setConfig({...config, traits: { ...config.traits, [trait]: parseInt(e.target.value) }})} className="w-full accent-cyan-400" /></div>))}</div>
                                </div>
                                <div className="glass-panel p-8 rounded-2xl border border-white/10">
                                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Terminal size={16} /> SYSTEM PROMPT</h3>
                                    <textarea value={config.system_prompt} onChange={(e) => setConfig({...config, system_prompt: e.target.value})} className="w-full h-48 bg-black/40 border border-white/10 rounded-xl p-4 text-sm font-mono text-zinc-300 outline-none resize-none" placeholder="Define agent behavior..." />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};