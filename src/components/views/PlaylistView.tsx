import React from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { Play, Heart, Clock, Sparkles, Share2, Trash2 } from 'lucide-react';
import { GlassButton } from '../ui/GlassButton';

export const PlaylistView: React.FC = () => {
  const { selectedPlaylistId, userPlaylists, playTrack, likedTrackIds, toggleLikeTrack, deletePlaylist } = usePlayerStore();

  const playlist = userPlaylists.find((p) => p.id === selectedPlaylistId) || userPlaylists[0];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleDelete = () => {
    if (confirm(`¿Estás seguro de que deseas eliminar la playlist "${playlist.title}"?`)) {
      deletePlaylist(playlist.id);
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-end gap-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-900/50 via-cyan-900/30 to-black/80 border border-white/10 shadow-2xl">
        <img
          src={playlist.coverUrl}
          alt={playlist.title}
          className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl object-cover shadow-2xl flex-shrink-0 border-2 border-white/20"
        />
        <div className="space-y-3">
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> PLAYLIST GLASS
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {playlist.title}
          </h1>
          <p className="text-sm text-neutral-300 max-w-xl">{playlist.description || 'Playlist personalizada'}</p>
          <p className="text-xs text-neutral-400 font-mono">
            Creada por <span className="text-white font-bold">{playlist.owner || 'Tú'}</span> • {playlist.tracks.length} canciones
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {playlist.tracks.length > 0 && (
          <GlassButton
            variant="primary"
            size="md"
            onClick={() => playTrack(playlist.tracks[0], playlist.tracks)}
          >
            <Play className="w-4 h-4 fill-current" /> Reproducir Playlist
          </GlassButton>
        )}
        <GlassButton variant="glass" size="md">
          <Share2 className="w-4 h-4" /> Compartir
        </GlassButton>
        <button
          onClick={handleDelete}
          className="px-4 py-2 text-xs font-semibold rounded-full bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-all flex items-center gap-1.5"
        >
          <Trash2 className="w-4 h-4" /> Eliminar Playlist
        </button>
      </div>

      {/* Track Table */}
      {playlist.tracks.length === 0 ? (
        <div className="py-12 text-center text-neutral-400 bg-black/20 rounded-2xl border border-white/5">
          <p className="text-sm font-medium">Esta playlist aún no tiene canciones.</p>
          <p className="text-xs text-neutral-500 mt-1">Busca canciones y guárdalas en esta lista.</p>
        </div>
      ) : (
        <div className="bg-black/30 rounded-2xl border border-white/10 overflow-hidden backdrop-blur-xl">
          <table className="w-full text-left text-sm text-neutral-300">
            <thead className="bg-white/5 text-neutral-400 font-mono text-xs uppercase border-b border-white/10">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Título</th>
                <th className="py-3 px-4 hidden md:table-cell">Álbum</th>
                <th className="py-3 px-4 w-16 text-right"><Clock className="w-4 h-4 ml-auto" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {playlist.tracks.map((track, idx) => {
                const isLiked = likedTrackIds.includes(track.id);
                return (
                  <tr
                    key={track.id}
                    onClick={() => playTrack(track, playlist.tracks)}
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
      )}
    </div>
  );
};
