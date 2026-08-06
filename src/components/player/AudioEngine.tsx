import React, { useEffect, useRef } from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';

export const AudioEngine: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loadedTrackIdRef = useRef<string | null>(null);

  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    currentTime,
    setCurrentTime,
    setDuration,
    nextTrack,
    setIsPlaying,
  } = usePlayerStore();

  const resumeAudioContextIfNeeded = () => {
    if (typeof window !== 'undefined') {
      const win = window as any;
      if (win.globalAudioCtx && win.globalAudioCtx.state === 'suspended') {
        win.globalAudioCtx.resume().catch(() => {});
      }
    }
  };

  const loadExactStreamAndPlay = () => {
    if (!audioRef.current || !currentTrack) return;

    resumeAudioContextIfNeeded();

    const queryHint = encodeURIComponent(`${currentTrack.title} ${currentTrack.artist}`);
    const cleanId = currentTrack.videoId || currentTrack.id.replace(/^yt-/, '');
    const streamUrl = `http://localhost:3001/api/stream-audio?id=${encodeURIComponent(cleanId)}&q=${queryHint}`;

    audioRef.current.src = streamUrl;
    audioRef.current.load();
    loadedTrackIdRef.current = currentTrack.id;

    if (isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Initial stream play execution notice:', err);
        });
      }
    }
  };

  // Track change listener
  useEffect(() => {
    if (!currentTrack) return;
    if (loadedTrackIdRef.current !== currentTrack.id) {
      loadExactStreamAndPlay();
    }
  }, [currentTrack?.id]);

  // IsPlaying toggle listener
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      resumeAudioContextIfNeeded();
      // If audio is not yet loaded or ready, re-trigger stream load & play on user gesture
      if (
        !audioRef.current.src ||
        loadedTrackIdRef.current !== currentTrack.id ||
        audioRef.current.readyState < 2
      ) {
        loadExactStreamAndPlay();
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            loadExactStreamAndPlay();
          });
        }
      }
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Seek bar traversal
  useEffect(() => {
    if (!audioRef.current) return;
    const timeDifference = Math.abs(audioRef.current.currentTime - currentTime);
    if (timeDifference > 1.5) {
      audioRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  // Volume & Mute control
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album,
        artwork: [{ src: currentTrack.coverUrl, sizes: '512x512', type: 'image/jpeg' }],
      });

      navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
      navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
      navigator.mediaSession.setActionHandler('previoustrack', () => usePlayerStore.getState().previousTrack());
      navigator.mediaSession.setActionHandler('nexttrack', () => usePlayerStore.getState().nextTrack());
    }
  }, [currentTrack]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || currentTrack?.duration || 0);
    }
  };

  const handleEnded = () => {
    nextTrack();
  };

  return (
    <audio
      ref={audioRef}
      crossOrigin="anonymous"
      onTimeUpdate={handleTimeUpdate}
      onLoadedMetadata={handleLoadedMetadata}
      onEnded={handleEnded}
      preload="auto"
    />
  );
};
