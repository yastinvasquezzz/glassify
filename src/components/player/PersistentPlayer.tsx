import React, { useState } from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Heart,
  Plus,
  ListMusic,
  Mic2,
  Sliders,
  Maximize2,
} from 'lucide-react';
import { GlassPanel } from '../ui/GlassPanel';
import { AudioVisualizer } from './AudioVisualizer';
import { AddToPlaylistModal } from '../modals/AddToPlaylistModal';

const formatTime = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const PersistentPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    likedTrackIds,
    togglePlayPause,
    nextTrack,
    previousTrack,
    setCurrentTime,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeatMode,
    toggleLikeTrackObject,
    toggleQueueDrawer,
    toggleLyricsDrawer,
    toggleEqualizerModal,
    toggleNowPlayingExpanded,
    isQueueOpen,
    isLyricsOpen,
  } = usePlayerStore();

  const [isAddToPlaylistOpen, setIsAddToPlaylistOpen] = useState(false);

  if (!currentTrack) return null;

  const isLiked = likedTrackIds.includes(currentTrack.id);

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 px-2 sm:px-3 pb-2 sm:pb-3 pt-0 pointer-events-none select-none">
        <GlassPanel
          className="w-full max-w-7xl mx-auto p-2 sm:p-3 flex flex-col md:flex-row items-center justify-between gap-2 md:gap-3 pointer-events-auto border-white/20 bg-slate-950/90 backdrop-blur-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.8)]"
          intensity="heavy"
          glow
        >
          {/* Main Control Row for Mobile & Desktop */}
          <div className="flex items-center justify-between w-full md:w-1/4 gap-2">
            {/* Track Info */}
            <div className="flex items-center gap-2.5 overflow-hidden min-w-0 flex-1">
              <div
                onClick={toggleNowPlayingExpanded}
                className="relative group cursor-pointer overflow-hidden rounded-xl w-11 h-11 sm:w-14 sm:h-14 flex-shrink-0 border border-white/25 shadow-lg"
              >
                <img
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${
                    isPlaying ? 'animate-spin-slow' : ''
                  }`}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              </div>

              <div className="overflow-hidden min-w-0 flex-1">
                <h4
                  onClick={toggleNowPlayingExpanded}
                  className="text-xs sm:text-sm font-bold text-white truncate cursor-pointer hover:text-emerald-300 transition-colors"
                >
                  {currentTrack.title}
                </h4>
                <p className="text-[11px] sm:text-xs text-neutral-400 truncate hover:text-neutral-200 cursor-pointer">
                  {currentTrack.artist}
                </p>
              </div>
            </div>

            {/* Quick Actions (Heart & Play on Mobile) */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => toggleLikeTrackObject(currentTrack)}
                title={isLiked ? 'Quitar de me gusta' : 'Me gusta'}
                className={`p-1.5 rounded-full transition-all active:scale-90 ${
                  isLiked ? 'text-pink-400 bg-pink-500/20' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isLiked ? 'fill-pink-400' : ''}`} />
              </button>

              {/* Mobile Play/Pause Button */}
              <button
                onClick={togglePlayPause}
                className="md:hidden w-9 h-9 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-[0_0_15px_rgba(29,185,84,0.8)] active:scale-95 cursor-pointer ml-1"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-black text-black" />
                ) : (
                  <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                )}
              </button>
            </div>
          </div>

          {/* Player Controls & Progress Bar (Desktop / Tablet) */}
          <div className="flex flex-col items-center gap-1.5 w-full md:w-2/4">
            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={toggleShuffle}
                className={`p-1.5 rounded-full transition-colors ${
                  isShuffle ? 'text-[#1db954] bg-[#1db954]/20' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                onClick={previousTrack}
                className="text-neutral-300 hover:text-white transition-colors p-1 cursor-pointer"
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </button>

              <button
                onClick={togglePlayPause}
                className="w-11 h-11 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black flex items-center justify-center shadow-[0_0_25px_rgba(29,185,84,0.8)] transition-all hover:scale-110 active:scale-95 cursor-pointer"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-black text-black" />
                ) : (
                  <Play className="w-5 h-5 fill-black text-black ml-0.5" />
                )}
              </button>

              <button
                onClick={nextTrack}
                className="text-neutral-300 hover:text-white transition-colors p-1 cursor-pointer"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>

              <button
                onClick={cycleRepeatMode}
                className={`p-1.5 rounded-full transition-colors relative ${
                  repeatMode !== 'off' ? 'text-[#1db954] bg-[#1db954]/20' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Repeat className="w-4 h-4" />
                {repeatMode === 'one' && (
                  <span className="text-[9px] font-bold absolute -top-1 right-0 text-[#1db954]">1</span>
                )}
              </button>
            </div>

            {/* Timeline Bar */}
            <div className="flex items-center gap-2 w-full text-[10px] sm:text-xs text-neutral-400 font-mono px-1">
              <span>{formatTime(currentTime)}</span>
              <div className="relative flex-1 flex items-center group h-2.5">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeekChange}
                  className="w-full h-1 bg-white/20 group-hover:h-2 rounded-lg appearance-none cursor-pointer accent-[#1db954] transition-all"
                />
              </div>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Tools (Volume, Lyrics, Queue, Equalizer) */}
          <div className="hidden md:flex items-center justify-end gap-2 w-full md:w-1/4">
            <div className="hidden lg:block w-20">
              <AudioVisualizer bars={12} height="h-6" />
            </div>

            <button
              onClick={toggleLyricsDrawer}
              title="Letras Sincronizadas"
              className={`p-2 rounded-full transition-colors ${
                isLyricsOpen ? 'text-[#1db954] bg-[#1db954]/20 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-neutral-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Mic2 className="w-4 h-4" />
            </button>

            <button
              onClick={toggleQueueDrawer}
              title="Cola de reproducción"
              className={`p-2 rounded-full transition-colors ${
                isQueueOpen ? 'text-[#1db954] bg-[#1db954]/20 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-neutral-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <ListMusic className="w-4 h-4" />
            </button>

            <button
              onClick={toggleEqualizerModal}
              title="Ecualizador"
              className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Sliders className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 ml-1">
              <button onClick={toggleMute} className="text-neutral-400 hover:text-white">
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#1db954]"
              />
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        track={currentTrack}
        isOpen={isAddToPlaylistOpen}
        onClose={() => setIsAddToPlaylistOpen(false)}
      />
    </>
  );
};
