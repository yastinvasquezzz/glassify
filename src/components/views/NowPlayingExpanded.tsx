import React from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { X, Heart, SkipBack, SkipForward, Play, Pause, Shuffle, Repeat, Plus, Sparkles } from 'lucide-react';
import { AudioVisualizer } from '../player/AudioVisualizer';
import { AddToPlaylistModal } from '../modals/AddToPlaylistModal';

export const NowPlayingExpanded: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlayPause,
    nextTrack,
    previousTrack,
    setCurrentTime,
    toggleNowPlayingExpanded,
    likedTrackIds,
    toggleLikeTrackObject,
    isShuffle,
    toggleShuffle,
    repeatMode,
    cycleRepeatMode,
    isDJModeActive,
    toggleDJMode,
  } = usePlayerStore();

  const [isAddToPlaylistOpen, setIsAddToPlaylistOpen] = React.useState(false);

  if (!currentTrack) return null;

  const isLiked = likedTrackIds.includes(currentTrack.id);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(parseFloat(e.target.value));
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between p-6 md:p-12 overflow-hidden animate-fadeIn select-none bg-slate-950">

      {/* 🔮 DYNAMIC ALBUM ARTWORK AMBIENT BACKDROP */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40 filter blur-[120px] scale-125 transition-all duration-1000 ease-out pointer-events-none"
        style={{ backgroundImage: `url(${currentTrack.coverUrl})` }}
      />
      <div
        className="absolute inset-0 opacity-60 pointer-events-none transition-colors duration-1000"
        style={{
          background: `radial-gradient(circle at center, ${currentTrack.dominantColor || '#00f2fe'} 0%, rgba(5,5,15,0.95) 85%)`,
        }}
      />

      {/* Header bar */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-brand-neon animate-pulse" />
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
            REPRODUCCIÓN REVOLUCIONARIA GLASS
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleDJMode()}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              isDJModeActive
                ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Modo DJ {isDJModeActive ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={toggleNowPlayingExpanded}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 transition-all hover:scale-105"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 my-auto max-w-5xl mx-auto w-full">
        {/* Cover Art Artwork */}
        <div className="relative group w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 flex-shrink-0">
          <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-50 group-hover:opacity-80 transition-all duration-700 animate-pulse" />
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.title}
            className="relative w-full h-full object-cover rounded-2xl shadow-2xl border border-white/20"
          />
        </div>

        {/* Track Details & Player */}
        <div className="flex flex-col w-full max-w-md space-y-6 text-left">
          <div>
            <span className="text-xs font-mono tracking-wider text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-full border border-cyan-500/30">
              {currentTrack.genre || 'Música Hi-Fi'}
            </span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mt-3 line-clamp-2">
              {currentTrack.title}
            </h1>
            <p className="text-lg md:text-xl font-medium text-white/70 mt-1">
              {currentTrack.artist}
            </p>
            <p className="text-xs text-white/40 mt-1">
              {currentTrack.album}
            </p>
          </div>

          {/* Living Web Audio Waveform Visualizer */}
          <div className="py-2">
            <AudioVisualizer bars={32} height="h-16" />
          </div>

          {/* Progress Slider */}
          <div className="space-y-2">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-brand-neon hover:accent-cyan-300"
            />
            <div className="flex justify-between text-xs font-mono text-white/60">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={toggleShuffle}
              className={`p-2 transition-colors ${isShuffle ? 'text-brand-neon' : 'text-white/40 hover:text-white'}`}
            >
              <Shuffle className="w-5 h-5" />
            </button>

            <button onClick={previousTrack} className="p-3 text-white/80 hover:text-white transition-all hover:scale-110">
              <SkipBack className="w-7 h-7" />
            </button>

            <button
              onClick={togglePlayPause}
              className="p-5 rounded-full bg-brand-neon text-black hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(29,185,84,0.6)]"
            >
              {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
            </button>

            <button onClick={nextTrack} className="p-3 text-white/80 hover:text-white transition-all hover:scale-110">
              <SkipForward className="w-7 h-7" />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleLikeTrackObject(currentTrack)}
                className={`p-2 transition-all ${isLiked ? 'text-pink-500 scale-110' : 'text-white/40 hover:text-white'}`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </button>

              <button
                onClick={() => setIsAddToPlaylistOpen(true)}
                className="p-2 text-white/40 hover:text-white transition-all hover:scale-110"
              >
                <Plus className="w-5 h-5" />
              </button>

              <button
                onClick={cycleRepeatMode}
                className={`p-2 transition-colors relative ${repeatMode !== 'off' ? 'text-brand-neon' : 'text-white/40 hover:text-white'}`}
              >
                <Repeat className="w-5 h-5" />
                {repeatMode === 'one' && <span className="absolute top-1 right-1 text-[9px] font-bold">1</span>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Tag */}
      <div className="relative z-10 text-center text-xs text-white/30 font-mono">
        GLASSIFY MUSIC — REPRODUCCIÓN HI-FI EN VIVO
      </div>

      <AddToPlaylistModal
        track={currentTrack}
        isOpen={isAddToPlaylistOpen}
        onClose={() => setIsAddToPlaylistOpen(false)}
      />
    </div>
  );
};
