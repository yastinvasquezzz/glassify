import React from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { GlassPanel } from '../ui/GlassPanel';
import { GlassButton } from '../ui/GlassButton';
import { Sliders, X, Sparkles } from 'lucide-react';

const PRESETS = [
  { name: 'Flat', bands: [0, 0, 0, 0, 0] },
  { name: 'Bass Boost', bands: [6, 4, 1, 0, -1] },
  { name: 'Vocal', bands: [-2, 1, 5, 3, 0] },
  { name: 'Treble Boost', bands: [-1, 0, 2, 5, 7] },
  { name: 'Rock', bands: [4, 2, -1, 3, 5] },
  { name: 'Electronic', bands: [5, 3, 0, 2, 4] },
];

export const EqualizerModal: React.FC = () => {
  const { isEqualizerOpen, toggleEqualizerModal, equalizerPreset, setEqualizerPreset } = usePlayerStore();

  if (!isEqualizerOpen) return null;

  const currentBands = PRESETS.find((p) => p.name === equalizerPreset)?.bands || [0, 0, 0, 0, 0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <GlassPanel className="w-full max-w-md p-6 relative" intensity="heavy" glow>
        <button
          onClick={toggleEqualizerModal}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              Ecualizador de Audio <Sparkles className="w-4 h-4 text-emerald-400" />
            </h3>
            <p className="text-xs text-neutral-400">Ajusta las frecuencias de sonido de Glassify</p>
          </div>
        </div>

        {/* Presets buttons */}
        <div className="mb-6">
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
            Ajustes Preestablecidos
          </label>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => setEqualizerPreset(preset.name)}
                className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                  equalizerPreset === preset.name
                    ? 'bg-emerald-500/30 border-emerald-400 text-white shadow-[0_0_15px_rgba(29,185,84,0.3)]'
                    : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders visual simulation */}
        <div className="mb-6">
          <div className="flex justify-between items-end h-40 px-4 py-3 bg-black/40 rounded-xl border border-white/5">
            {['60Hz', '230Hz', '910Hz', '4kHz', '14kHz'].map((freq, idx) => (
              <div key={freq} className="flex flex-col items-center gap-2 h-full justify-end">
                <input
                  type="range"
                  min="-10"
                  max="10"
                  value={currentBands[idx]}
                  readOnly
                  className="accent-emerald-400 h-28 w-1.5 appearance-none bg-white/20 rounded-lg cursor-pointer transform -rotate-180"
                />
                <span className="text-[10px] text-neutral-400 font-mono">{freq}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <GlassButton variant="glass" size="sm" onClick={toggleEqualizerModal}>
            Cerrar
          </GlassButton>
          <GlassButton variant="primary" size="sm" onClick={toggleEqualizerModal}>
            Aplicar Cambios
          </GlassButton>
        </div>
      </GlassPanel>
    </div>
  );
};
