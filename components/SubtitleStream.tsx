import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SubtitleStreamProps {
  text: string;
  isUser: boolean;
  isTyping: boolean;
}

export const SubtitleStream: React.FC<SubtitleStreamProps> = ({ text, isUser, isTyping }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText(text);
  }, [text]);

  if (!text) return null;

  return (
    <div className="absolute bottom-32 left-0 right-0 flex justify-center z-40 pointer-events-none px-8">
        <AnimatePresence mode='wait'>
            <motion.div 
                key={text}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className={`
                    backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl px-8 py-6 max-w-3xl
                    ${isUser ? 'bg-zinc-900/80 text-zinc-300' : 'bg-black/80 text-cyan-50'}
                `}
            >
                <p className="text-lg md:text-xl font-mono leading-relaxed text-center">
                    {displayedText}
                    {isTyping && !isUser && (
                        <span className="inline-block w-2 h-5 ml-1 bg-cyan-400 animate-pulse align-middle" />
                    )}
                </p>
                <div className={`text-[10px] uppercase tracking-widest font-bold mt-2 text-center ${isUser ? 'text-zinc-600' : 'text-cyan-500/50'}`}>
                    {isUser ? 'Audio Input' : 'Neural Response'}
                </div>
            </motion.div>
        </AnimatePresence>
    </div>
  );
};