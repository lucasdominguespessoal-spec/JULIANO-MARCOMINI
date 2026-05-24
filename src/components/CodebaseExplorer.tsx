import React, { useState } from 'react';
import { reactNativeCodebase, flutterCodebase } from '../data/codebaseData';
import { FileCode, FolderClosed, Copy, Check, Terminal, Layers, HelpCircle, ArrowUpRight } from 'lucide-react';

export default function CodebaseExplorer() {
  const [activePlatform, setActivePlatform] = useState<'React Native' | 'Flutter'>('React Native');
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const selectedCodebase = activePlatform === 'React Native' ? reactNativeCodebase : flutterCodebase;
  const currentFile = selectedCodebase.files[selectedFileIndex] || selectedCodebase.files[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full h-full bg-[#050505] border border-neutral-900 flex flex-col justify-between overflow-hidden" id="codebase-explorer-root">
      
      {/* Top bar with selectors */}
      <div className="p-4 bg-black border-b border-neutral-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-white" />
            <span className="text-xs uppercase font-mono tracking-widest font-bold text-white">
              ARQUITETURA DE CÓDIGO FONTE
            </span>
          </div>
          <p className="text-[10px] font-mono text-neutral-500 mt-1">
            Copie ou analise a modelagem de código para construir o aplicativo nativo final.
          </p>
        </div>

        {/* Platform Selector buttons */}
        <div className="flex bg-neutral-950 p-1 border border-neutral-900 w-full sm:w-auto">
          <button
            id="select-react-native-platform"
            onClick={() => {
              setActivePlatform('React Native');
              setSelectedFileIndex(0);
            }}
            className={`flex-1 sm:flex-none text-xs font-mono px-3.5 py-1.5 transition-all duration-200 ${
              activePlatform === 'React Native'
                ? 'bg-neutral-800 text-white font-bold'
                : 'text-neutral-500 hover:text-white'
            }`}
          >
            REACT NATIVE
          </button>
          <button
            id="select-flutter-platform"
            onClick={() => {
              setActivePlatform('Flutter');
              setSelectedFileIndex(0);
            }}
            className={`flex-1 sm:flex-none text-xs font-mono px-3.5 py-1.5 transition-all duration-200 ${
              activePlatform === 'Flutter'
                ? 'bg-neutral-800 text-white font-bold'
                : 'text-neutral-500 hover:text-white'
            }`}
          >
            FLUTTER (DART)
          </button>
        </div>
      </div>

      {/* Main double column grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
        
        {/* Left Column: Folder structure tree */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-neutral-900 bg-black/40 p-4 overflow-y-auto font-mono text-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-neutral-950 pb-2">
              <span className="text-[9px] uppercase tracking-wider text-neutral-600 font-bold">ESTRUTURA DE PASTAS</span>
              <span className="text-[9px] text-[#888888]">OLED_TARGET</span>
            </div>

            <div className="space-y-4">
              {/* Dummy folders for visual fidelity */}
              <div>
                <div className="flex items-center gap-2 text-neutral-400 py-1 font-bold">
                  <FolderClosed className="w-3.5 h-3.5 text-neutral-600" />
                  <span>{activePlatform === 'React Native' ? 'android/' : 'android/'}</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-400 py-1 font-bold">
                  <FolderClosed className="w-3.5 h-3.5 text-neutral-600" />
                  <span>{activePlatform === 'React Native' ? 'ios/' : 'ios/'}</span>
                </div>
                <div className="flex items-center gap-2 text-white py-1 font-bold">
                  <FolderClosed className="w-3.5 h-3.5 text-neutral-300" />
                  <span>{activePlatform === 'React Native' ? 'src/' : 'lib/'}</span>
                </div>

                {/* File list */}
                <div className="ml-4 space-y-1 mt-1 border-l border-neutral-900 pl-3">
                  <div className="text-neutral-600 text-[9px] uppercase font-bold py-1">
                    {activePlatform === 'React Native' ? 'screens/' : 'screens/'}
                  </div>
                  {selectedCodebase.files.map((file, idx) => {
                    const isSelected = idx === selectedFileIndex;
                    return (
                      <button
                        key={idx}
                        id={`selectable-codefile-${idx}`}
                        onClick={() => setSelectedFileIndex(idx)}
                        className={`w-full text-left flex items-center gap-2 py-1.5 px-2 hover:bg-neutral-950 transition-colors ${
                          isSelected 
                            ? 'text-white bg-neutral-900 font-bold border-l-2 border-white pl-1.5' 
                            : 'text-neutral-500'
                        }`}
                      >
                        <FileCode className="w-3.5 h-3.5 opacity-60 text-neutral-400" />
                        <span className="truncate">{file.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Quick UI/UX explanations */}
          <div className="mt-8 bg-[#000000] border border-neutral-950 p-3 self-end w-full">
            <div className="flex items-center gap-2 text-white mb-2 font-display uppercase tracking-widest font-semibold text-[10px]">
              <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />
              <span>DICA DE DESEGNER</span>
            </div>
            <p className="text-[10px] text-neutral-500 leading-relaxed font-sans normal-case">
              {activePlatform === 'React Native' 
                ? 'Para animações no React Native, use a biblioteca "react-native-reanimated" de forma thread-separada para garantir que o pulso morphing 3D funcione a 60fps constantes mesmo durante intensas leituras de telemetria.' 
                : 'No Flutter, extenda a classe "CustomPainter" no método paint() para renderizar as curvas de fluxo de forma totalmente fluida, aproveitando o acelerador Skia/Impeller nativo em fundo OLED.'}
            </p>
          </div>
        </div>

        {/* Right Column: Code Editor display pane */}
        <div className="lg:col-span-8 flex flex-col min-h-0 bg-black">
          {/* Editor Header */}
          <div className="flex justify-between items-center p-3 px-4 bg-neutral-950 border-b border-neutral-900 text-xs font-mono">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-neutral-500" />
              <span className="text-neutral-300 font-bold">{currentFile.path}</span>
            </div>

            <button
              id="copy-to-clipboard-btn"
              onClick={handleCopy}
              className="flex items-center gap-1.5 p-1 px-3 border border-neutral-800 text-neutral-400 hover:text-white hover:border-white transition-all text-[11px] font-mono bg-black"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-white" />
                  COPIADO
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-neutral-500" />
                  COPIAR CÓDIGO
                </>
              )}
            </button>
          </div>

          {/* Code Viewer content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 font-mono text-xs md:text-sm text-neutral-300 leading-normal bg-black">
            <pre className="whitespace-pre-wrap select-all font-mono break-all font-light bg-neutral-950/40 p-4 border border-neutral-950">
              <code>{currentFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
