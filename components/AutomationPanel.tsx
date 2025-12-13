import React, { useState } from 'react';
import { Activity, CheckCircle, XCircle, Clock, Zap, Play, Pause, RefreshCw, Home, Globe, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AutomationType, AutomationTask } from '../types';

export const AutomationPanel: React.FC = () => {
  const { state, actions } = useApp();
  const { automationTasks } = state;
  const [activeTab, setActiveTab] = useState<AutomationType>('HOME');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');

  const filteredTasks = automationTasks.filter(t => t.type === activeTab);
  const activeCount = filteredTasks.filter(t => t.status === 'running').length;

  const handleCreateTask = () => {
      if(!newTaskName) return;
      const newTask: AutomationTask = {
          id: Date.now().toString(),
          type: activeTab,
          name: newTaskName,
          description: 'New workflow initialized.',
          status: 'idle',
          lastRun: 'Never',
          efficiency: 100
      };
      actions.addTask(newTask);
      setIsModalOpen(false);
      setNewTaskName('');
  };

  return (
    <div className="w-full h-full flex flex-col p-8 overflow-hidden bg-gradient-to-br from-black/20 to-black/60 relative">
      
      {/* Header & Tabs */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Zap className="text-amber-400 animate-pulse-slow" fill="currentColor" /> Automation Hub
            </h2>
            <p className="text-slate-400 text-sm mt-2 font-mono">Orchestrate IoT devices and web agents.</p>
        </div>
        
        <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
            <button 
                onClick={() => setActiveTab('HOME')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'HOME' ? 'bg-cyan-500/20 text-cyan-400 shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
                <Home size={16} /> Home Control
            </button>
            <button 
                onClick={() => setActiveTab('WEB')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'WEB' ? 'bg-violet-500/20 text-violet-400 shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
                <Globe size={16} /> Web Agents
            </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center mb-6">
          <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">
              {activeCount} Active Threads
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs font-mono text-emerald-400 flex items-center gap-2 transition-all active:scale-95 shadow-pulse"
          >
              <Plus size={14} /> NEW {activeTab} TASK
          </button>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
          {filteredTasks.map(task => (
              <div key={task.id} className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-white/20 transition-all hover:bg-white/5 animate-fade-in">
                  <div className="flex items-center gap-5">
                      <div className={`p-3 rounded-xl shadow-lg transition-all duration-500 ${
                          task.status === 'running' ? 'bg-amber-500/10 text-amber-400 shadow-amber-500/10 scale-105' :
                          task.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 shadow-emerald-500/10' :
                          'bg-slate-500/10 text-slate-400'
                      }`}>
                          {task.status === 'running' ? <Activity className="animate-spin-slow" size={20} /> :
                           task.status === 'success' ? <CheckCircle size={20} /> :
                           <Clock size={20} />}
                      </div>
                      <div>
                          <div className="flex items-center gap-2">
                             <h3 className="font-bold text-slate-200 text-base">{task.name}</h3>
                             <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                                  task.status === 'running' ? 'border-amber-500/30 text-amber-400' :
                                  'border-slate-500/30 text-slate-400'
                              }`}>{task.status}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{task.description}</p>
                      </div>
                  </div>

                  <div className="flex items-center gap-4 md:gap-8">
                      <div className="flex items-center gap-2">
                          <button 
                            onClick={() => actions.toggleTaskStatus(task.id)}
                            className={`p-2.5 rounded-lg transition-all active:scale-95 ${
                                task.status === 'running' 
                                ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' 
                                : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
                            }`}
                          >
                              {task.status === 'running' ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                          </button>
                          <button 
                             onClick={() => actions.deleteTask(task.id)}
                             className="p-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors active:scale-95"
                          >
                              <Trash2 size={18} />
                          </button>
                      </div>
                  </div>
              </div>
          ))}
          {filteredTasks.length === 0 && (
              <div className="text-center py-20 text-slate-500 text-sm">No active tasks in this sector.</div>
          )}
      </div>

      {/* Simple Modal */}
      {isModalOpen && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8">
              <div className="glass-panel p-6 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl">
                  <h3 className="text-lg font-bold text-white mb-4">Initialize {activeTab} Routine</h3>
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="Task Name"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500/50 outline-none mb-6"
                  />
                  <div className="flex gap-3">
                      <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold">CANCEL</button>
                      <button onClick={handleCreateTask} className="flex-1 py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-bold">CREATE</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};