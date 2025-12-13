import React, { useState } from 'react';
import { MessageCircle, Hash, Send, Paperclip, Phone, Video, Search, Bot } from 'lucide-react';

const contacts = [
    { id: '1', name: 'Sarah Connor', platform: 'whatsapp', lastMsg: 'Did you see the new neural specs?', time: '10:42 AM', unread: 2 },
    { id: '2', name: 'Dev Team', platform: 'slack', lastMsg: 'Deployment successful. 🚀', time: '09:15 AM', unread: 0 },
    { id: '3', name: 'Mom', platform: 'whatsapp', lastMsg: 'Call me when you can.', time: 'Yesterday', unread: 1 },
    { id: '4', name: 'Crypto Alpha', platform: 'telegram', lastMsg: 'BTC breaking resistance!', time: 'Yesterday', unread: 5 },
];

export const CommunicationCenter: React.FC = () => {
  const [activeContact, setActiveContact] = useState(contacts[0]);
  const [input, setInput] = useState('');

  return (
    <div className="w-full h-full flex bg-[#09090b] overflow-hidden">
        
        {/* Contact List */}
        <div className="w-80 border-r border-white/5 bg-black/20 flex flex-col">
            <div className="p-4 border-b border-white/5">
                <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Bot className="text-cyan-400" size={16}/> Neural Comms</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-zinc-500" size={14} />
                    <input type="text" placeholder="Filter threads..." className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-9 text-xs text-white focus:border-cyan-500/50 outline-none" />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                {contacts.map(c => (
                    <div 
                        key={c.id} 
                        onClick={() => setActiveContact(c)}
                        className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-all flex gap-3 ${activeContact.id === c.id ? 'bg-white/5' : ''}`}
                    >
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-white border border-white/10">
                                {c.name.charAt(0)}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 p-1 rounded-full bg-black border border-black ${c.platform === 'whatsapp' ? 'text-green-500' : c.platform === 'slack' ? 'text-purple-500' : 'text-blue-400'}`}>
                                {c.platform === 'whatsapp' ? <MessageCircle size={10} fill="currentColor" /> : c.platform === 'slack' ? <Hash size={10} /> : <Send size={10} />}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                                <h4 className={`text-sm font-medium truncate ${c.unread > 0 ? 'text-white' : 'text-zinc-400'}`}>{c.name}</h4>
                                <span className="text-[10px] text-zinc-600">{c.time}</span>
                            </div>
                            <p className={`text-xs truncate ${c.unread > 0 ? 'text-zinc-300 font-medium' : 'text-zinc-600'}`}>{c.lastMsg}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-gradient-to-br from-black/40 to-black/80">
            {/* Header */}
            <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-black/40 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-white">
                        {activeContact.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">{activeContact.name}</h3>
                        <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online
                        </span>
                    </div>
                </div>
                <div className="flex gap-4 text-zinc-400">
                    <Phone size={18} className="hover:text-white cursor-pointer" />
                    <Video size={18} className="hover:text-white cursor-pointer" />
                    <Search size={18} className="hover:text-white cursor-pointer" />
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
                <div className="flex justify-center mb-6">
                    <span className="text-[10px] text-zinc-600 bg-white/5 px-3 py-1 rounded-full">Today</span>
                </div>
                
                <div className="flex justify-start">
                    <div className="max-w-[70%] bg-white/5 border border-white/5 rounded-2xl rounded-tl-none p-3">
                        <p className="text-sm text-zinc-200">Hey, have you seen the new neural specs?</p>
                        <span className="text-[10px] text-zinc-500 mt-1 block">10:42 AM</span>
                    </div>
                </div>

                <div className="flex justify-end">
                    <div className="max-w-[70%] bg-cyan-500/20 border border-cyan-500/20 rounded-2xl rounded-tr-none p-3">
                        <p className="text-sm text-cyan-100">Checking them now. The latency stats look insane.</p>
                        <span className="text-[10px] text-cyan-400/60 mt-1 block">10:43 AM</span>
                    </div>
                </div>
            </div>

            {/* Auto Drafts */}
            <div className="px-6 py-2 flex gap-2 overflow-x-auto">
                {['Yeah, looks great! 👍', 'Can we discuss this later?', 'Send me the docs.'].map(draft => (
                    <button key={draft} onClick={() => setInput(draft)} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 hover:border-cyan-500/50 text-xs text-zinc-400 hover:text-white transition-all whitespace-nowrap">
                        {draft}
                    </button>
                ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/5 bg-black/40">
                <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/5 focus-within:border-cyan-500/50 transition-colors">
                    <Paperclip size={18} className="text-zinc-500 hover:text-white cursor-pointer" />
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={`Message ${activeContact.name}...`}
                        className="flex-1 bg-transparent outline-none text-sm text-white placeholder-zinc-600"
                    />
                    <button className={`p-2 rounded-lg transition-colors ${input ? 'bg-cyan-500 text-black' : 'bg-transparent text-zinc-600'}`}>
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};