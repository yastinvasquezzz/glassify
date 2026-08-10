import React from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  ShieldCheck,
  Bell,
  Menu,
  LogIn,
  LogOut,
  Radio,
} from 'lucide-react';
import { GlassInput } from '../ui/GlassInput';

export const Header: React.FC = () => {
  const {
    activeView,
    setActiveView,
    searchQuery,
    setSearchQuery,
    toggleMobileSidebar,
    authUser,
    toggleAuthModal,
    logoutFirebase,
    isDJModeActive,
    toggleDJMode,
  } = usePlayerStore();

  return (
    <header className="h-14 sm:h-16 px-3 md:px-6 flex items-center justify-between gap-2 sm:gap-3 select-none z-20 border-b border-white/10 bg-black/20 backdrop-blur-md">
      {/* Navigation Controls & Mobile Menu Toggle */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <button
          onClick={toggleMobileSidebar}
          className="md:hidden p-2 rounded-xl bg-white/10 border border-white/15 text-white active:scale-95 transition-transform flex-shrink-0"
          title="Menú Principal"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setActiveView('home')}
            className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveView('search')}
            className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar Input */}
        {activeView === 'search' && (
          <div className="w-full max-w-md animate-fadeIn">
            <GlassInput
              placeholder="Buscar canciones, artistas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4 text-emerald-400" />}
              autoFocus
            />
          </div>
        )}
      </div>

      {/* User Actions & DJ Mode */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
        {/* Modo DJ Toggle Button */}
        <button
          onClick={toggleDJMode}
          title="Modo DJ"
          className={`px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-mono font-bold border transition-all flex items-center gap-1 cursor-pointer ${
            isDJModeActive
              ? 'bg-[#1db954]/20 text-[#1db954] border-[#1db954]/40 shadow-[0_0_15px_rgba(29,185,84,0.4)]'
              : 'bg-white/10 text-neutral-300 border-white/15 hover:text-white'
          }`}
        >
          <Radio className={`w-3.5 h-3.5 ${isDJModeActive ? 'animate-pulse text-[#1db954]' : ''}`} />
          <span className="hidden xs:inline">Modo DJ</span>
          <span>{isDJModeActive ? 'ON' : 'OFF'}</span>
        </button>

        {authUser ? (
          <div className="flex items-center gap-2 pl-1.5 pr-2.5 sm:pl-2 sm:pr-3 py-1 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 cursor-pointer hover:border-white/30 transition-all">
            <img
              src={authUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
              alt={authUser.displayName || 'Usuario'}
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border border-emerald-400"
            />
            <div className="text-left hidden lg:block">
              <p className="text-xs font-bold text-white leading-tight flex items-center gap-1">
                {authUser.displayName || 'Usuario Glass'} <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </p>
              <p className="text-[10px] text-emerald-400 font-mono font-medium">CONECTADO</p>
            </div>
            <button
              onClick={logoutFirebase}
              title="Cerrar Sesión"
              className="p-1 text-neutral-400 hover:text-red-400 rounded-full hover:bg-white/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={toggleAuthModal}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black font-extrabold text-xs flex items-center gap-1 shadow-[0_0_15px_rgba(29,185,84,0.5)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Iniciar</span> Sesión
          </button>
        )}
      </div>
    </header>
  );
};
