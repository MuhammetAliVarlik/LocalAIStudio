import React, { useCallback, useRef, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
  NodeProps,
  ReactFlowProvider,
  useReactFlow
} from 'reactflow';
import { Settings, Database, Terminal, Cpu, GripVertical, Rocket, Save, User, MessageSquare } from 'lucide-react';

// --- Custom Node Component ---
const GlassNode = ({ data, selected }: NodeProps) => {
  const isInput = data.type === 'input';
  const isOutput = data.type === 'memory';
  
  let Icon = Cpu;
  let accentColor = 'border-zinc-500 text-zinc-300';
  let bg = 'bg-black/80';

  if (data.type === 'input') { Icon = User; accentColor = 'border-white text-white'; }
  if (data.type === 'llm') { Icon = MessageSquare; accentColor = 'border-white text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]'; }
  if (data.type === 'tool') { Icon = Terminal; accentColor = 'border-zinc-400 text-zinc-200'; }
  if (data.type === 'memory') { Icon = Database; accentColor = 'border-zinc-600 text-zinc-400'; }

  return (
    <div className={`
      relative min-w-[160px] px-4 py-3 rounded-lg 
      backdrop-blur-xl ${bg}
      border transition-all duration-300
      ${selected ? `border-white shadow-[0_0_20px_rgba(255,255,255,0.1)] scale-105` : `${accentColor} border-opacity-20`}
    `}>
      {!isInput && <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-white !border-none" />}
      {!isOutput && <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-white !border-none" />}

      <div className="flex items-center gap-3">
        <Icon size={16} className={selected ? 'text-white' : 'text-zinc-500'} />
        <div>
          <h3 className="text-xs font-bold font-mono text-zinc-200 uppercase tracking-wide">{data.label}</h3>
        </div>
      </div>
    </div>
  );
};

const nodeTypes = { glass: GlassNode };

const initialNodes: Node[] = [
  { id: '1', type: 'glass', position: { x: 100, y: 100 }, data: { label: 'User Input', type: 'input' } },
  { id: '2', type: 'glass', position: { x: 400, y: 100 }, data: { label: 'Core LLM', type: 'llm' } },
];
const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#52525b' } },
];

// Inner component to access ReactFlow hooks
const BuilderCanvas = () => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const { screenToFlowPosition } = useReactFlow();

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#52525b' } }, eds)),
        [setEdges],
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();
            const type = event.dataTransfer.getData('application/reactflow');
            const label = event.dataTransfer.getData('application/reactflow/label');
            if (typeof type === 'undefined' || !type) return;

            const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
            const newNode: Node = {
                id: Date.now().toString(),
                type: 'glass',
                position,
                data: { label: label, type: type },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [screenToFlowPosition, setNodes],
    );

    return (
        <div className="w-full h-full flex bg-[#09090b]">
             <div className="w-full h-full" ref={reactFlowWrapper}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    nodeTypes={nodeTypes}
                    fitView
                    proOptions={{ hideAttribution: true }}
                >
                    <Background color="#27272a" gap={24} size={1} />
                    <Controls className="bg-black border border-white/10 fill-white rounded-lg" />
                </ReactFlow>
             </div>
        </div>
    );
};

const SidebarItem = ({ type, label, icon: Icon }: { type: string, label: string, icon: any }) => {
    const onDragStart = (event: React.DragEvent, nodeType: string, nodeLabel: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/reactflow/label', nodeLabel);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div 
            className="p-3 bg-black/40 hover:bg-white/5 rounded border border-white/5 cursor-grab active:cursor-grabbing flex items-center gap-3 transition-all hover:border-white/20 group"
            draggable
            onDragStart={(event) => onDragStart(event, type, label)}
        >
            <GripVertical size={14} className="text-zinc-700 group-hover:text-zinc-500" />
            <Icon size={14} className="text-zinc-400 group-hover:text-white" />
            <span className="text-xs text-zinc-400 font-mono group-hover:text-white uppercase">{label}</span>
        </div>
    );
};

export const AgentBuilder: React.FC = () => {
  const [isDeploying, setIsDeploying] = useState(false);
  const [activeTab, setActiveTab] = useState<'nodes' | 'config'>('nodes');
  const [agentName, setAgentName] = useState('New Agent Protocol');
  const [agentPrompt, setAgentPrompt] = useState('');

  const handleDeploy = () => {
    setIsDeploying(true);
    setTimeout(() => setIsDeploying(false), 2000);
  };

  return (
    <div className="w-full h-full relative flex">
        {/* Builder Sidebar */}
        <div className="absolute top-0 left-0 bottom-0 z-20 w-72 glass-panel border-r border-white/10 flex flex-col pointer-events-auto bg-[#09090b]">
             <div className="p-4 border-b border-white/10 flex gap-2">
                 <button onClick={() => setActiveTab('nodes')} className={`flex-1 py-2 text-xs font-bold uppercase ${activeTab === 'nodes' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'} rounded transition-all`}>Nodes</button>
                 <button onClick={() => setActiveTab('config')} className={`flex-1 py-2 text-xs font-bold uppercase ${activeTab === 'config' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'} rounded transition-all`}>Settings</button>
             </div>

             <div className="flex-1 p-4 overflow-y-auto">
                 {activeTab === 'nodes' ? (
                     <div className="space-y-3">
                         <div className="mb-4">
                             <h3 className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">I/O Components</h3>
                             <SidebarItem type="input" label="User Input" icon={User} />
                         </div>
                         <div className="mb-4">
                             <h3 className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">Reasoning</h3>
                             <SidebarItem type="llm" label="LLM Chain" icon={Cpu} />
                             <SidebarItem type="memory" label="RAG Memory" icon={Database} />
                         </div>
                         <div>
                             <h3 className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">Actions</h3>
                             <SidebarItem type="tool" label="Web Search" icon={Terminal} />
                             <SidebarItem type="tool" label="Python Exec" icon={Terminal} />
                         </div>
                     </div>
                 ) : (
                     <div className="space-y-4">
                         <div>
                             <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2 block">Agent Name</label>
                             <input 
                                value={agentName}
                                onChange={e => setAgentName(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white outline-none focus:border-white/30" 
                             />
                         </div>
                         <div>
                             <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2 block">System Prompt</label>
                             <textarea 
                                value={agentPrompt}
                                onChange={e => setAgentPrompt(e.target.value)}
                                className="w-full h-40 bg-black/40 border border-white/10 rounded p-2 text-sm text-zinc-300 outline-none focus:border-white/30 resize-none font-mono"
                                placeholder="You are a helpful assistant..."
                             />
                         </div>
                     </div>
                 )}
             </div>
             
             <div className="p-4 border-t border-white/10">
                 <button 
                   onClick={handleDeploy}
                   disabled={isDeploying}
                   className="w-full py-3 bg-white text-black rounded font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 animate-breath"
                 >
                     {isDeploying ? 'Compiling Neural Net...' : <><Rocket size={14}/> Deploy Agent</>}
                 </button>
             </div>
        </div>

        <ReactFlowProvider>
            <BuilderCanvas />
        </ReactFlowProvider>
    </div>
  );
};