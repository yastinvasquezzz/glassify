import React from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { Track } from '../../types';
import { GlassPanel } from '../ui/GlassPanel';
import { X, Plus, Check, ListMusic, Sparkles } from 'lucide-react';

export const AddToPlaylistModal: React.FC<{
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
}> = ({ track, isOpen, onClose }) => {
  const { userPlaylists, addTrackToPlaylist, createPlaylist } = usePlayerStore();
  const [addedPlaylistIds, setAddedPlaylistIds] = React.useState<string[]>([]);

  if (!isOpen || !track) return null;

  const handleAddToPlaylist = (playlistId: string) => {
    addTrackToPlaylist(playlistId, track);
    setAddedPlaylistIds((prev) => [...prev, playlistId]);
    setTimeout(() => {
      onClose();
      setAddedPlaylistIds([]);
    }, 800);
  };

  const handleCreateNew = () => {
    const title = prompt('Nombre de la nueva playlist:', 'Mi Playlist Glass');
    if (title) {
      createPlaylist(title);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <GlassPanel
        className="w-full max-w-sm p-6 flex flex-col gap-5 relative border-white/20 shadow-[0_0_40px_rgba(29,185,84,0.3)]"
        intensity="heavy"
        glow
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> AGREGAR A PLAYLIST
          </span>
          <h3 className="text-lg font-bold text-white truncate">{track.title}</h3>
          <p className="text-xs text-neutral-400 truncate">{track.artist}</p>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {userPlaylists.length === 0 ? (
            <p className="text-xs text-neutral-400 py-4 text-center">No tienes playlists creadas todavía.</p>
          ) : (
            userPlaylists.map((playlist) => {
              const isAdded = addedPlaylistIds.includes(playlist.id) || playlist.tracks.some((t) => t.id === track.id);
              return (
                <div
                  key={playlist.id}
                  onClick={() => handleAddToPlaylist(playlist.id)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3 overflow-hidden min-w-0">
                    <img
                      src={playlist.coverUrl}
                      alt={playlist.title}
                      className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="overflow-hidden min-w-0">
                      <p className="text-xs font-bold text-white group-hover:text-emerald-400 truncate">
                        {playlist.title}
                      </p>
                      <p className="text-[10px] text-neutral-400 truncate">{playlist.tracks.length} canciones</p>
                    </div>
                  </div>

                  {isAdded ? (
                    <span className="p-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 text-[10px] font-mono font-bold">
                      <Check className="w-3.5 h-3.5" /> Guardada
                    </span>
                  ) : (
                    <Plus className="w-4 h-4 text-neutral-400 group-hover:text-white" />
                  )}
                </div>
              );
            })
          )}
        </div>

        <button
          onClick={handleCreateNew}
          className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-emerald-400" /> Crear Nueva Playlist
        </button>
      </GlassPanel>
    </div>
  );
};
