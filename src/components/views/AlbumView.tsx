import React from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { Play, Heart, Clock, Disc, Sparkles, Share2 } from 'lucide-react';
import { GlassButton } from '../ui/GlassButton';

export const AlbumView: React.FC = () => {
  const { selectedAlbum, playTrack, likedTrackIds, toggleLikeTrack } = usePlayerStore();

  if (!selectedAlbum) {
    return (
      <div className="py-20 text-center text-neutral-400">
        <p>No se seleccionó ningún álbum.</p>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-8 pb-12 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-end gap-6 p-8 rounded-3xl bg-gradient-to-r from-emerald-900/50 via-cyan-900/30 to-black/80 border border-white/10 shadow-2xl">
        <img
          src={selectedAlbum.coverUrl}
          alt={selectedAlbum.title}
          className="w-48 h-48 rounded-2xl object-cover shadow-2xl flex-shrink-0 border-2 border-white/20"
        />
        <div className="space-y-3">
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
            <Disc className="w-4 h-4 text-cyan-400 animate-spin-slow" /> ÁLBUM COMPLETO
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            {selectedAlbum.title}
          </h1>
          <p className="text-sm text-neutral-300 font-mono">
            Por <span className="text-white font-bold">{selectedAlbum.artist}</span> • {selectedAlbum.year || 2026} • {selectedAlbum.tracks.length} canciones
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {selectedAlbum.tracks.length > 0 && (
          <GlassButton
            variant="primary"
            size="lg"
            onClick={() => playTrack(selectedAlbum.tracks[0], selectedAlbum.tracks)}
          >
            <Play className="w-5 h-5 fill-current" /> Reproducir Álbum Completo
          </GlassButton>
        )}
        <GlassButton variant="glass" size="lg">
          <Share2 className="w-4 h-4" /> Compartir Álbum
        </GlassButton>
      </div>

      {/* Track Table */}
      <div className="bg-black/30 rounded-2xl border border-white/10 overflow-hidden backdrop-blur-xl">
        <table className="w-full text-left text-sm text-neutral-300">
          <thead className="bg-white/5 text-neutral-400 font-mono text-xs uppercase border-b border-white/10">
            <tr>
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4">Título</th>
              <th className="py-3 px-4 hidden md:table-cell">Artista</th>
              <th className="py-3 px-4 w-16 text-right"><Clock className="w-4 h-4 ml-auto" /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {selectedAlbum.tracks.map((track, idx) => {
              const isLiked = likedTrackIds.includes(track.id);
              return (
                <tr
                  key={track.id}
                  onClick={() => playTrack(track, selectedAlbum.tracks)}
                  className="hover:bg-white/10 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4 text-center text-neutral-400 font-mono">
                    <span className="group-hover:hidden">{idx + 1}</span>
                    <Play className="w-4 h-4 text-emerald-400 hidden group-hover:block mx-auto fill-current" />
                  </td>
                  <td className="py-3 px-4 flex items-center gap-3">
                    <img src={track.coverUrl} alt={track.title} className="w-10 h-10 rounded-lg object-cover" />
                    <div>
                      <p className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {track.title}
                      </p>
                      <p className="text-xs text-neutral-400">{track.artist}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell text-neutral-400">{track.artist}</td>
                  <td className="py-3 px-4 text-right font-mono text-neutral-400 flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLikeTrack(track.id);
                      }}
                      className={`p-1 ${isLiked ? 'text-emerald-400' : 'text-neutral-500 hover:text-white'}`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-emerald-400' : ''}`} />
                    </button>
                    <span>{formatTime(track.duration)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
