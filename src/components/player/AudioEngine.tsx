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

  // Load & play audio whenever currentTrack changes
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    if (loadedTrackIdRef.current !== currentTrack.id) {
      loadedTrackIdRef.current = currentTrack.id;

      if (currentTrack.audioUrl) {
        audioRef.current.src = currentTrack.audioUrl;
        audioRef.current.load();
      }
    }

    if (isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Audio play execution notice:', err);
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [currentTrack?.id]);

  // Handle Play/Pause Toggle
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      if (!audioRef.current.src && currentTrack.audioUrl) {
        audioRef.current.src = currentTrack.audioUrl;
        audioRef.current.load();
      }
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Handle Seek Position Changes
  useEffect(() => {
    if (!audioRef.current) return;
    const timeDifference = Math.abs(audioRef.current.currentTime - currentTime);
    if (timeDifference > 1.5) {
      audioRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  // Handle Volume & Mute Changes
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Sync MediaSession Metadata for Lock Screen & Control Center
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
      setCurrentTime(audioRef.current.currentTime || 0);
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
