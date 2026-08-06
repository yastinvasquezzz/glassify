import React, { useEffect, useState, useRef } from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { GlassPanel } from '../ui/GlassPanel';
import { Mic2, X, Sparkles, Loader2 } from 'lucide-react';
import { fetchRealSyncedLyrics } from '../../services/lyricsApi';
import { LyricLine } from '../../types';

export const LyricsDrawer: React.FC = () => {
  const { isLyricsOpen, toggleLyricsDrawer, currentTrack, currentTime } = usePlayerStore();
  const [syncedLyrics, setSyncedLyrics] = useState<LyricLine[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    if (!currentTrack) return;
    let isMounted = true;

    const loadLyrics = async () => {
      setLoading(true);
      const lines = await fetchRealSyncedLyrics(currentTrack.title, currentTrack.artist);
      if (isMounted) {
        setSyncedLyrics(lines);
        setLoading(false);
      }
    };

    loadLyrics();

    return () => {
      isMounted = false;
    };
  }, [currentTrack?.id, currentTrack?.title, currentTrack?.artist]);

  let activeIndex = 0;
  for (let i = 0; i < syncedLyrics.length; i++) {
    if (currentTime >= syncedLyrics[i].time) {
      activeIndex = i;
    }
  }

  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  if (!isLyricsOpen || !currentTrack) return null;

  return (
    <aside className="h-full w-full select-none flex flex-col">
      <GlassPanel
        className="h-full p-4 md:p-5 flex flex-col gap-4 border-emerald-500/20 bg-slate-950/80 backdrop-blur-2xl rounded-2xl border border-white/10"
        intensity="heavy"
        glow
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Mic2 className="w-4 h-4 text-emerald-400 animate-pulse" />
            <h3 className="text-xs md:text-sm font-bold text-white flex items-center gap-1.5">
              Letras Sincronizadas <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            </h3>
          </div>
          <button
            onClick={toggleLyricsDrawer}
            className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Track Banner */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10 shadow-md">
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.title}
            className="w-11 h-11 rounded-lg object-cover shadow-sm flex-shrink-0"
          />
          <div className="overflow-hidden">
            <h4 className="text-xs font-bold text-white truncate">{currentTrack.title}</h4>
            <p className="text-[11px] text-emerald-400 font-medium truncate">{currentTrack.artist}</p>
          </div>
        </div>

        {/* Real Karaoke Synced Lyrics */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto space-y-5 py-4 px-2 text-center font-sans custom-scrollbar"
        >
          {loading ? (
            <div className="py-16 flex flex-col items-center gap-3 text-neutral-400">
              <Loader2 className="w-7 h-7 text-emerald-400 animate-spin" />
              <p className="text-[11px] font-mono">Buscando letra en tiempo real...</p>
            </div>
          ) : (
            syncedLyrics.map((line, idx) => {
              const isActive = idx === activeIndex;
              return (
                <p
                  key={idx}
                  ref={isActive ? activeLineRef : null}
                  className={`transition-all duration-300 font-black leading-snug ${
                    isActive
                      ? 'text-base md:text-lg text-emerald-300 scale-105 filter drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]'
                      : 'text-xs md:text-sm text-neutral-400 opacity-40 hover:opacity-90 hover:text-white'
                  }`}
                >
                  {line.text}
                </p>
              );
            })
          )}
        </div>
      </GlassPanel>
    </aside>
  );
};
