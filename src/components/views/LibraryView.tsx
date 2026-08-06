import React from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { Heart, Plus, ListMusic, Music, Play } from 'lucide-react';

export const LibraryView: React.FC = () => {
  const { userPlaylists, selectPlaylist, createPlaylist, likedTrackIds, setActiveView } = usePlayerStore();

  const handleCreate = () => {
    const title = prompt('Nombre de tu nueva Playlist Glass:');
    if (title) createPlaylist(title);
  };

  return (
    <div className="space-y-8 pb-12 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Tu Biblioteca Glass</h1>
          <p className="text-sm text-neutral-400 mt-1">Colección personal de listas, canciones e inspiración.</p>
        </div>
        <GlassButton variant="primary" size="md" onClick={handleCreate}>
          <Plus className="w-4 h-4" /> Crear Playlist
        </GlassButton>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Liked Songs Tile */}
        <div
          onClick={() => setActiveView('liked')}
          className="relative h-56 rounded-3xl p-6 bg-gradient-to-br from-purple-900/60 via-pink-900/40 to-black/80 border border-purple-500/30 shadow-2xl cursor-pointer hover:scale-105 transition-all group overflow-hidden"
        >
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-pink-500/30 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Heart className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Canciones que te gustan</h2>
              <p className="text-sm text-purple-200 mt-1">{likedTrackIds.length} canciones guardadas</p>
            </div>
          </div>
        </div>

        {/* User Playlists */}
        {userPlaylists.map((pl) => (
          <GlassCard key={pl.id} onClick={() => selectPlaylist(pl.id)} className="flex flex-col justify-between p-5">
            <div className="flex items-center gap-4">
              <img src={pl.coverUrl} alt={pl.title} className="w-20 h-20 rounded-xl object-cover shadow-md" />
              <div className="overflow-hidden">
                <h3 className="text-lg font-bold text-white truncate">{pl.title}</h3>
                <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{pl.description || 'Playlist personalizada'}</p>
                <p className="text-xs text-emerald-400 mt-2 font-mono">{pl.tracks.length} pistas</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};
