import React, { useState } from 'react';
import { Wand2, Image as ImageIcon, Download, Maximize2, RefreshCw, Scissors, Layers, Sliders, Eraser } from 'lucide-react';

const MOCK_GALLERY = [
    { id: '1', url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=600&auto=format&fit=crop', prompt: 'Cyberpunk city street at night, neon rain' },
    { id: '2', url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=600&auto=format&fit=crop', prompt: 'Abstract neural network visualization, 3d render' },
    { id: '3', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop', prompt: 'Liquid metal flowing, chrome aesthetic' },
    { id: '4', url: 'https://images.unsplash.com/photo-1614728853975-6663335ed1b2?q=80&w=600&auto=format&fit=crop', prompt: 'Ethereal smoke swirling in void' },
];

export const Dreamscape: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState(MOCK_GALLERY[0]);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showNegative, setShowNegative] = useState(false);

  const handleGenerate = () => {
      setIsGenerating(true);
      setTimeout(() => setIsGenerating(false), 2500);
  };

  const handleMagicEnhance = () => {
      if (!prompt) return;
      setPrompt(prompt + ", ultra realistic, 8k resolution, cinematic lighting, volumetric fog, octane render");
  };

  return (
    <div className="w-full h-full flex bg-[#09090b] overflow-hidden">
        
        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col relative">
            {/* Toolbar */}
            <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-black/20 backdrop-blur-md z-10">
                <div className="flex items-center gap-2">
                    <Wand2 className="text-fuchsia-500" size={20} />
                    <span className="font-bold text-white tracking-wider">DREAMSCAPE</span>
                </div>
                <div className="flex gap-2">
                    <button className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors" title="Upscale"><Maximize2 size={18}/></button>
                    <button className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors" title="Variations"><RefreshCw size={18}/></button>
                    <button className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors" title="Edit/Inpaint"><Eraser size={18}/></button>
                    <button className="px-4 py-1.5 bg-white text-black rounded-lg text-xs font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2">
                        <Download size={14} /> EXPORT
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 p-8 flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed bg-opacity-5">
                <div className="relative group max-w-4xl max-h-[80vh] shadow-2xl rounded-lg overflow-hidden border border-white/10">
                    <img 
                        src={selectedImage.url} 
                        className={`w-full h-full object-contain transition-all duration-700 ${isGenerating ? 'blur-xl scale-105 opacity-50' : 'blur-0 scale-100 opacity-100'}`} 
                    />
                    {isGenerating && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-fuchsia-400 font-mono text-sm animate-pulse">Rendering Latent Space...</div>
                        </div>
                    )}
                    
                    {/* Overlay Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-sm font-medium">{selectedImage.prompt}</p>
                    </div>
                </div>
            </div>

            {/* Prompt Bar */}
            <div className="p-6 border-t border-white/5 bg-black/40 backdrop-blur-xl">
                <div className="max-w-4xl mx-auto space-y-3">
                    <div className="flex gap-2 relative">
                        <div className="flex-1 relative">
                            <input 
                                type="text" 
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe your dream..." 
                                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 pl-12 text-sm text-white focus:border-fuchsia-500/50 outline-none transition-all"
                            />
                            <div className="absolute left-3 top-3 text-zinc-500">
                                <ImageIcon size={20} />
                            </div>
                            <button 
                                onClick={handleMagicEnhance}
                                className="absolute right-2 top-2 p-2 hover:bg-fuchsia-500/20 rounded-lg text-zinc-400 hover:text-fuchsia-400 transition-colors"
                                title="Magic Enhance"
                            >
                                <Wand2 size={16} />
                            </button>
                        </div>
                        <button 
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="px-8 h-12 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(192,38,211,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            GENERATE
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <button onClick={() => setShowNegative(!showNegative)} className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors ${showNegative ? 'text-red-400' : 'text-zinc-500 hover:text-zinc-300'}`}>
                            <Sliders size={12} /> Negative Prompt
                        </button>
                        {showNegative && (
                            <input 
                                type="text" 
                                placeholder="Blurry, low quality, distorted..." 
                                className="flex-1 bg-transparent border-b border-white/10 text-xs text-red-300 placeholder-zinc-600 outline-none pb-1"
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Sidebar Gallery */}
        <div className="w-72 border-l border-white/5 bg-black/20 flex flex-col">
            <div className="p-4 border-b border-white/5 font-bold text-xs text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Layers size={14} /> History
            </div>
            <div className="flex-1 overflow-y-auto p-2 grid grid-cols-2 gap-2 content-start">
                {MOCK_GALLERY.map((img) => (
                    <div 
                        key={img.id}
                        onClick={() => setSelectedImage(img)}
                        className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${selectedImage.id === img.id ? 'border-fuchsia-500' : 'border-transparent hover:border-white/20'}`}
                    >
                        <img src={img.url} className="w-full h-full object-cover" />
                    </div>
                ))}
            </div>
        </div>

    </div>
  );
};