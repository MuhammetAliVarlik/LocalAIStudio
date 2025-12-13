import React, { useMemo } from 'react';
import ReactFlow, { Node, Edge, Background, MarkerType } from 'reactflow';
import { Database, Search, FileText } from 'lucide-react';

const MemoryNode = ({ data }: { data: { label: string, type: 'query' | 'doc' } }) => {
    const isQuery = data.type === 'query';
    return (
        <div className={`
            px-4 py-3 rounded-xl backdrop-blur-md border shadow-2xl flex items-center gap-3 min-w-[150px]
            ${isQuery 
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-100' 
                : 'bg-zinc-900/80 border-zinc-700 text-zinc-300 hover:border-zinc-500'
            }
        `}>
            {isQuery ? <Search size={16} /> : <FileText size={16} />}
            <span className="text-xs font-mono font-bold">{data.label}</span>
        </div>
    );
};

const nodeTypes = { memory: MemoryNode };

export const MemoryGraph: React.FC<{ activeDoc: string | null }> = ({ activeDoc }) => {
    const nodes: Node[] = useMemo(() => [
        { id: 'root', type: 'memory', position: { x: 300, y: 50 }, data: { label: 'Current Query', type: 'query' } },
        { id: '1', type: 'memory', position: { x: 100, y: 200 }, data: { label: 'Attention_Mech.pdf', type: 'doc' } },
        { id: '2', type: 'memory', position: { x: 300, y: 250 }, data: { label: 'Vector_Embed.py', type: 'doc' } },
        { id: '3', type: 'memory', position: { x: 500, y: 200 }, data: { label: 'Notes_2024.txt', type: 'doc' } },
    ], []);

    const edges: Edge[] = useMemo(() => [
        { id: 'e1', source: 'root', target: '1', animated: true, style: { stroke: '#22d3ee' } },
        { id: 'e2', source: 'root', target: '2', animated: true, style: { stroke: '#22d3ee', strokeDasharray: 5 } },
        { id: 'e3', source: 'root', target: '3', animated: true, style: { stroke: '#22d3ee' } },
    ], []);

    return (
        <div className="w-full h-full bg-[#050505]">
            <ReactFlow 
                nodes={nodes} 
                edges={edges} 
                nodeTypes={nodeTypes} 
                fitView
                proOptions={{ hideAttribution: true }}
            >
                <Background color="#27272a" gap={20} size={1} />
            </ReactFlow>
        </div>
    );
};