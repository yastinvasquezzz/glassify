import React from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { Radio, Mic, Sparkles } from 'lucide-react';
import { GlassPanel } from '../ui/GlassPanel';

export const DJStatusOverlay: React.FC = () => {
  const { isDJModeActive, isDJSpeaking, djSpeechText } = usePlayerStore();

  if (!isDJModeActive || !isDJSpeaking || !djSpeechText) return null;

  return (
    <div className="fixed top-20 right-6 z-50 max-w-sm w-full animate-fadeIn select-none">
      <GlassPanel
        className="p-4 flex items-start gap-3.5 border-emerald-400/40 bg-black/85 backdrop-blur-2xl shadow-[0_0_40px_rgba(29,185,84,0.4)]"
        intensity="heavy"
        glow
      >
        {/* DJ Headphones Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 via-cyan-500 to-purple-600 p-0.5 shadow-lg flex items-center justify-center animate-pulse">
            <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
              <Radio className="w-6 h-6 text-emerald-400 animate-spin-slow" />
            </div>
          </div>
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 absolute bottom-0 right-0 border-2 border-black animate-ping" />
        </div>

        {/* DJ Speech & Waves */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
              <Mic className="w-3.5 h-3.5" /> GLASS AI DJ HABLANDO
            </span>
            <div className="flex items-center gap-0.5">
              <span className="w-1 h-3 bg-emerald-400 rounded-full animate-pulse" />
              <span className="w-1 h-5 bg-cyan-400 rounded-full animate-pulse delay-100" />
              <span className="w-1 h-2 bg-purple-400 rounded-full animate-pulse delay-200" />
            </div>
          </div>
          <p className="text-xs font-medium text-neutral-100 leading-relaxed italic">
            "{djSpeechText}"
          </p>
        </div>
      </GlassPanel>
    </div>
  );
};
