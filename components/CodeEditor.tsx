import React from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  code: string;
  onChange: (value: string | undefined) => void;
  language?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange, language = 'python' }) => {
  return (
    <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl border border-white/5 bg-[#1e1e1e]">
      <Editor
        height="100%"
        defaultLanguage={language}
        defaultValue={code}
        theme="vs-dark"
        onChange={onChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: 'JetBrains Mono',
          scrollBeyondLastLine: false,
          padding: { top: 20 },
          lineNumbers: 'on',
          renderLineHighlight: 'line',
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on'
        }}
      />
    </div>
  );
};