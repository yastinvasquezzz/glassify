import React from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { Play, Heart, Clock, Sparkles } from 'lucide-react';
import { GlassButton } from '../ui/GlassButton';

export const LikedView: React.FC = () => {
  const { likedTracks, playTrack, toggleLikeTrackObject } = usePlayerStore();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-8 pb-12 animate-fadeIn select-none">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-end gap-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-900/60 via-pink-900/40 to-black/80 border border-white/15 shadow-2xl">
        <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-2xl flex-shrink-0 border-2 border-white/20">
          <Heart className="w-20 h-20 text-white fill-white animate-pulse" />
        </div>
        <div className="space-y-3">
          <span className="text-xs font-mono font-bold text-pink-300 uppercase tracking-widest flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> PLAYLIST PERSONAL
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Canciones que te gustan
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 font-mono">
            Yastin Vasquez • <span className="text-pink-400 font-bold">{likedTracks.length} canciones</span>
          </p>
        </div>
      </div>

      {likedTracks.length > 0 && (
        <div className="flex items-center gap-3">
          <GlassButton
            variant="primary"
            size="md"
            onClick={() => playTrack(likedTracks[0], likedTracks)}
          >
            <Play className="w-4 h-4 fill-current" /> Reproducir Todo
          </GlassButton>
        </div>
      )}

      {/* Liked Songs Table */}
      {likedTracks.length === 0 ? (
        <div className="py-16 text-center text-neutral-400 bg-black/30 rounded-2xl border border-white/10 backdrop-blur-xl">
          <Heart className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
          <p className="text-base font-bold text-white">Aún no has guardado canciones favoritas</p>
          <p className="text-xs text-neutral-400 mt-1">
            Haz clic en el icono del corazón en cualquier canción para guardarla aquí.
          </p>
        </div>
      ) : (
        <div className="bg-black/30 rounded-2xl border border-white/10 overflow-hidden backdrop-blur-xl">
          <table className="w-full text-left text-sm text-neutral-300">
            <thead className="bg-white/5 text-neutral-400 font-mono text-xs uppercase border-b border-white/10">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Título</th>
                <th className="py-3 px-4 hidden md:table-cell">Álbum</th>
                <th className="py-3 px-4 w-20 text-right"><Clock className="w-4 h-4 ml-auto" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {likedTracks.map((track, idx) => (
                <tr
                  key={track.id}
                  onClick={() => playTrack(track, likedTracks)}
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
                  <td className="py-3 px-4 hidden md:table-cell text-neutral-400">{track.album}</td>
                  <td className="py-3 px-4 text-right font-mono text-neutral-400">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLikeTrackObject(track);
                        }}
                        className="p-1 text-pink-400 hover:text-pink-300 transition-colors"
                        title="Quitar de favoritos"
                      >
                        <Heart className="w-4 h-4 fill-pink-400" />
                      </button>
                      <span>{formatTime(track.duration)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
