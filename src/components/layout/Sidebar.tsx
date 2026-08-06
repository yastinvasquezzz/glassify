import React from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';
import {
  Home,
  Search,
  Library,
  PlusSquare,
  Heart,
  Music2,
  Sparkles,
  ListMusic,
  Trash2,
  X,
} from 'lucide-react';
import { GlassPanel } from '../ui/GlassPanel';
import { ViewType } from '../../types';

export const Sidebar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    userPlaylists,
    createPlaylist,
    deletePlaylist,
    selectPlaylist,
    likedTrackIds,
    isMobileSidebarOpen,
    toggleMobileSidebar,
  } = usePlayerStore();

  const handleCreatePlaylist = () => {
    const title = prompt('Nombre de tu nueva Playlist Glass:', `Mi Lista Glass #${userPlaylists.length + 1}`);
    if (title) {
      createPlaylist(title);
    }
  };

  const handleDeletePlaylist = (e: React.MouseEvent, playlistId: string, playlistTitle: string) => {
    e.stopPropagation();
    if (confirm(`¿Estás seguro de que deseas eliminar la playlist "${playlistTitle}"?`)) {
      deletePlaylist(playlistId);
    }
  };

  const navItems: { view: ViewType; label: string; icon: React.ReactNode }[] = [
    { view: 'home', label: 'Inicio', icon: <Home className="w-5 h-5" /> },
    { view: 'search', label: 'Buscar', icon: <Search className="w-5 h-5" /> },
    { view: 'library', label: 'Tu Biblioteca', icon: <Library className="w-5 h-5" /> },
  ];

  const sidebarContent = (
    <div className="w-64 h-full flex flex-col gap-3 p-3 select-none flex-shrink-0">
      {/* Brand Header */}
      <GlassPanel className="p-4 flex flex-col gap-5 border-white/15 shadow-xl bg-slate-950/70" intensity="medium">
        <div className="flex items-center justify-between">
          <div
            onClick={() => setActiveView('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-cyan-500 to-purple-600 p-0.5 shadow-[0_0_20px_rgba(29,185,84,0.5)] group-hover:scale-110 transition-transform duration-300">
              <div className="w-full h-full bg-slate-950 backdrop-blur-md rounded-[10px] flex items-center justify-center">
                <Music2 className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1 font-mono">
                GLASSIFY <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              </h1>
              <p className="text-[10px] text-emerald-400 tracking-wider uppercase font-bold">
                MÚSICA HI-FI
              </p>
            </div>
          </div>

          <button
            onClick={toggleMobileSidebar}
            className="md:hidden p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => setActiveView(item.view)}
              className={`flex items-center gap-4 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                activeView === item.view
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-[1.02]'
                  : 'text-neutral-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </GlassPanel>

      {/* Library & Playlists Section */}
      <GlassPanel className="flex-1 p-4 flex flex-col gap-3 overflow-hidden border-white/15 shadow-xl bg-slate-950/70" intensity="medium">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-neutral-400 font-bold text-xs uppercase tracking-wider">
            <ListMusic className="w-4 h-4 text-emerald-400" />
            <span>Tus Listas</span>
          </div>
          <button
            onClick={handleCreatePlaylist}
            title="Crear Playlist"
            className="p-1 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
          >
            <PlusSquare className="w-4 h-4" /> Crear
          </button>
        </div>

        {/* Quick Liked Songs */}
        <button
          onClick={() => setActiveView('liked')}
          className={`flex items-center gap-3 p-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeView === 'liked'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
              : 'text-neutral-300 hover:bg-white/10'
          }`}
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-md flex-shrink-0">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>
          <div className="text-left overflow-hidden min-w-0">
            <p className="truncate font-bold">Canciones que te gustan</p>
            <p className="text-[11px] text-neutral-400 font-mono">{likedTrackIds.length} canciones</p>
          </div>
        </button>

        <div className="h-px bg-white/10 my-1" />

        {/* Playlists List with Delete Option */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1 custom-scrollbar">
          {userPlaylists.map((playlist) => (
            <div
              key={playlist.id}
              onClick={() => selectPlaylist(playlist.id)}
              className="flex items-center justify-between p-2 rounded-xl text-left hover:bg-white/10 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3 overflow-hidden min-w-0">
                <img
                  src={playlist.coverUrl}
                  alt={playlist.title}
                  className="w-9 h-9 rounded-lg object-cover shadow-sm group-hover:scale-105 transition-transform flex-shrink-0"
                />
                <div className="overflow-hidden min-w-0">
                  <p className="text-xs font-bold text-neutral-200 group-hover:text-emerald-300 truncate">
                    {playlist.title}
                  </p>
                  <p className="text-[11px] text-neutral-400 truncate">
                    Playlist • {playlist.tracks.length} canciones
                  </p>
                </div>
              </div>

              <button
                onClick={(e) => handleDeletePlaylist(e, playlist.id, playlist.title)}
                title="Eliminar Playlist"
                className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </GlassPanel>
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex flex-shrink-0 h-full">{sidebarContent}</aside>
      {isMobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex bg-black/80 backdrop-blur-md animate-fadeIn">
          {sidebarContent}
          <div className="flex-1" onClick={toggleMobileSidebar} />
        </div>
      )}
    </>
  );
};
