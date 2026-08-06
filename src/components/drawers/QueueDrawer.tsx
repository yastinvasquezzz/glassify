import React from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { GlassPanel } from '../ui/GlassPanel';
import { ListMusic, X, Play } from 'lucide-react';

export const QueueDrawer: React.FC = () => {
  const { isQueueOpen, toggleQueueDrawer, queue, queueIndex, currentTrack, playTrack } = usePlayerStore();

  if (!isQueueOpen) return null;

  return (
    <aside className="w-80 h-full p-3 select-none flex-shrink-0 animate-slideLeft z-30">
      <GlassPanel className="h-full p-5 flex flex-col gap-4 border-cyan-500/20" intensity="heavy" glow>
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Cola de Reproducción
            </h3>
          </div>
          <button
            onClick={toggleQueueDrawer}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Now Playing Header */}
        {currentTrack && (
          <div>
            <span className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider block mb-2">
              Sonando Ahora
            </span>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-12 h-12 rounded-lg object-cover shadow-md"
              />
              <div className="overflow-hidden flex-1">
                <h4 className="text-xs font-bold text-emerald-400 truncate">{currentTrack.title}</h4>
                <p className="text-[11px] text-neutral-300 truncate">{currentTrack.artist}</p>
              </div>
              <div className="flex items-end gap-0.5 h-4 px-1">
                <span className="w-0.5 bg-emerald-400 rounded-full eq-bar" />
                <span className="w-0.5 bg-cyan-400 rounded-full eq-bar" />
                <span className="w-0.5 bg-purple-400 rounded-full eq-bar" />
              </div>
            </div>
          </div>
        )}

        {/* Next Up Queue List */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-2 pt-2 pr-1">
          <span className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider block">
            A continuación ({queue.length})
          </span>

          {queue.map((track, idx) => {
            const isCurrent = currentTrack?.id === track.id;
            return (
              <div
                key={`${track.id}-${idx}`}
                onClick={() => playTrack(track)}
                className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                  isCurrent
                    ? 'bg-white/10 border border-white/20'
                    : 'bg-white/[0.03] border border-white/5 hover:bg-white/[0.08]'
                }`}
              >
                <span className="text-xs font-mono text-neutral-500 w-4 text-center">
                  {idx + 1}
                </span>
                <img
                  src={track.coverUrl}
                  alt={track.title}
                  className="w-9 h-9 rounded-lg object-cover"
                />
                <div className="overflow-hidden flex-1">
                  <p className={`text-xs font-semibold truncate ${isCurrent ? 'text-emerald-400' : 'text-white'}`}>
                    {track.title}
                  </p>
                  <p className="text-[11px] text-neutral-400 truncate">{track.artist}</p>
                </div>
              </div>
            );
          })}
        </div>
      </GlassPanel>
    </aside>
  );
};
