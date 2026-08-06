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
    <header className="h-16 px-4 md:px-6 flex items-center justify-between gap-3 select-none z-20">
      {/* Navigation Controls & Mobile Menu Toggle */}
      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
        <button
          onClick={toggleMobileSidebar}
          className="md:hidden p-2 rounded-xl bg-black/40 border border-white/10 text-neutral-300 hover:text-white"
          title="Menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-1.5">
          <button
            onClick={() => setActiveView('home')}
            className="w-9 h-9 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveView('search')}
            className="w-9 h-9 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Unified Single Search Bar */}
        {activeView === 'search' && (
          <div className="w-full max-w-md animate-fadeIn">
            <GlassInput
              placeholder="Busca cualquier canción, artista o álbum..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4" />}
              autoFocus
            />
          </div>
        )}
      </div>

      {/* User Actions, Glass AI DJ Mode Toggle & Profile */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        {/* Modo DJ Toggle Button */}
        <button
          onClick={toggleDJMode}
          title="Activar / Desactivar Modo DJ con Voz IA"
          className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
            isDJModeActive
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-400/40 shadow-[0_0_15px_rgba(29,185,84,0.4)]'
              : 'bg-white/5 text-neutral-400 border-white/10 hover:text-white'
          }`}
        >
          <Radio className={`w-3.5 h-3.5 ${isDJModeActive ? 'animate-pulse text-emerald-400' : ''}`} />
          <span>Modo DJ {isDJModeActive ? 'ON' : 'OFF'}</span>
        </button>

        <button className="p-2 text-neutral-300 hover:text-white hover:bg-white/10 rounded-full transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-1.5 right-1.5" />
        </button>

        {authUser ? (
          <div className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/15 cursor-pointer hover:border-white/30 transition-all group">
            <img
              src={authUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
              alt={authUser.displayName || 'Usuario'}
              className="w-7 h-7 rounded-full object-cover border border-emerald-400"
            />
            <div className="text-left hidden md:block">
              <p className="text-xs font-bold text-white leading-tight flex items-center gap-1">
                {authUser.displayName || 'Usuario Glass'} <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </p>
              <p className="text-[10px] text-emerald-400 font-mono font-medium">CONECTADO</p>
            </div>
            <button
              onClick={logoutFirebase}
              title="Cerrar Sesión"
              className="p-1 text-neutral-400 hover:text-red-400 rounded-full hover:bg-white/10 ml-1 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={toggleAuthModal}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(29,185,84,0.4)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <LogIn className="w-4 h-4" /> Iniciar Sesión
          </button>
        )}
      </div>
    </header>
  );
};
