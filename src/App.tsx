import React, { useEffect } from 'react';
import { usePlayerStore } from './store/usePlayerStore';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { PersistentPlayer } from './components/player/PersistentPlayer';
import { AudioEngine } from './components/player/AudioEngine';
import { HomeView } from './components/views/HomeView';
import { SearchView } from './components/views/SearchView';
import { LibraryView } from './components/views/LibraryView';
import { ArtistView } from './components/views/ArtistView';
import { AlbumView } from './components/views/AlbumView';
import { PlaylistView } from './components/views/PlaylistView';
import { LyricsDrawer } from './components/drawers/LyricsDrawer';
import { QueueDrawer } from './components/drawers/QueueDrawer';
import { EqualizerModal } from './components/modals/EqualizerModal';
import { NowPlayingExpanded } from './components/views/NowPlayingExpanded';
import { AuthModal } from './components/auth/AuthModal';
import { DJStatusOverlay } from './components/dj/DJStatusOverlay';

export const App: React.FC = () => {
  const {
    activeView,
    isLyricsOpen,
    isQueueOpen,
    isEqualizerOpen,
    isNowPlayingExpanded,
    isAuthModalOpen,
    isMobileSidebarOpen,
    toggleMobileSidebar,
    currentTrack,
    isPlaying,
    togglePlayPause,
    nextTrack,
    previousTrack,
    setCurrentTime,
    currentTime,
  } = usePlayerStore();

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement).tagName.toLowerCase())) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === 'ArrowRight' && !e.shiftKey) {
        e.preventDefault();
        setCurrentTime(currentTime + 5);
      } else if (e.code === 'ArrowLeft' && !e.shiftKey) {
        e.preventDefault();
        setCurrentTime(Math.max(0, currentTime - 5));
      } else if (e.code === 'ArrowRight' && e.shiftKey) {
        e.preventDefault();
        nextTrack();
      } else if (e.code === 'ArrowLeft' && e.shiftKey) {
        e.preventDefault();
        previousTrack();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        usePlayerStore.getState().toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, setCurrentTime, currentTime, nextTrack, previousTrack]);

  const renderMainView = () => {
    switch (activeView) {
      case 'home':
        return <HomeView />;
      case 'search':
        return <SearchView />;
      case 'library':
        return <LibraryView />;
      case 'artist':
        return <ArtistView />;
      case 'album':
        return <AlbumView />;
      case 'playlist':
        return <PlaylistView />;
      default:
        return <HomeView />;
    }
  };

  const dynamicColor = currentTrack?.dominantColor || 'hsl(160, 84%, 39%)';
  const coverUrl = currentTrack?.coverUrl || '';

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-white font-sans selection:bg-brand-neon selection:text-black">

      {/* 🔮 DYNAMIC SONG COLOR AURA BACKDROP (ATTENUATES TO CURRENTLY PLAYING COVER ARTWORK) */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Dynamic Cover Artwork Motion Blur */}
        {coverUrl && (
          <div
            className="absolute inset-0 scale-135 bg-cover bg-center opacity-45 filter blur-[110px] transition-all duration-1000 ease-out"
            style={{ backgroundImage: `url(${coverUrl})` }}
          />
        )}

        {/* Dynamic Song Color Gradient Aura */}
        <div
          className="absolute inset-0 opacity-60 transition-colors duration-1000 ease-out"
          style={{
            background: `radial-gradient(circle at 45% 35%, ${dynamicColor} 0%, rgba(5, 5, 12, 0.94) 75%)`,
          }}
        />

        {/* Living Sound Wave Overlay */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#7928ca" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#ff0080" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            <path
              d="M 0,350 Q 350,220 700,380 T 1400,280 T 2100,420 V 1080 H 0 Z"
              fill="url(#waveGrad)"
              className={`transition-all duration-1000 ${isPlaying ? 'animate-pulse' : ''}`}
            />
          </svg>
        </div>

        {/* Dark Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-slate-950/60" />
      </div>

      {/* Invisible HTML5 Audio Stream Engine */}
      <AudioEngine />

      {/* Main Glass Application Container */}
      <div className="relative z-10 flex h-full w-full overflow-hidden p-2 md:p-3 gap-2 md:gap-3">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 lg:w-72 flex-shrink-0 h-full">
          <Sidebar />
        </div>

        {/* Mobile Slide-over Drawer Overlay */}
        {isMobileSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
              onClick={toggleMobileSidebar}
            />
            <div className="relative w-4/5 max-w-xs h-full bg-slate-950/90 backdrop-blur-2xl border-r border-white/10 z-10 p-2">
              <Sidebar />
            </div>
          </div>
        )}

        {/* Central Workspace Canvas */}
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden rounded-2xl glass-panel relative border border-white/15 shadow-2xl">
          <Header />

          {/* Main Scrollable Viewport */}
          <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 pb-28">
            <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
              {renderMainView()}
            </div>
          </main>

          {/* Persistent Floating Bottom Audio Control Bar */}
          <PersistentPlayer />
        </div>

        {/* Right Lyrics Column Panel (Dedicated 3-column layout) */}
        {isLyricsOpen && (
          <div className="w-80 xl:w-96 flex-shrink-0 h-full hidden md:block animate-slideLeft">
            <LyricsDrawer />
          </div>
        )}
      </div>

      {/* Spotify-style Glass AI DJ Overlay */}
      <DJStatusOverlay />

      {/* Slide-over Queue Drawer */}
      {isQueueOpen && <QueueDrawer />}

      {/* Full-Screen Now Playing View & Modals */}
      {isNowPlayingExpanded && <NowPlayingExpanded />}
      {isEqualizerOpen && <EqualizerModal />}
      {isAuthModalOpen && <AuthModal />}
    </div>
  );
};

export default App;
