import React, { useEffect, useRef } from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { getFullAudioStreamUrl } from '../../services/musicApi';

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

  // Extract full audio stream and play whenever currentTrack changes
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    let isMounted = true;

    const loadAndPlayFullTrack = async () => {
      if (loadedTrackIdRef.current === currentTrack.id) return;
      loadedTrackIdRef.current = currentTrack.id;

      // Extract 100% FULL SONG audio stream
      const streamUrl = await getFullAudioStreamUrl(currentTrack);

      if (!isMounted || !audioRef.current) return;

      if (streamUrl) {
        audioRef.current.src = streamUrl;
        audioRef.current.load();
      }

      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('Full track play execution notice:', err);
          });
        }
      }
    };

    loadAndPlayFullTrack();

    return () => {
      isMounted = false;
    };
  }, [currentTrack?.id]);

  // Handle Play/Pause Toggle
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      if (!audioRef.current.src) {
        getFullAudioStreamUrl(currentTrack).then((url) => {
          if (audioRef.current && url) {
            audioRef.current.src = url;
            audioRef.current.load();
            audioRef.current.play().catch(() => {});
          }
        });
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
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
      onTimeUpdate={handleTimeUpdate}
      onLoadedMetadata={handleLoadedMetadata}
      onEnded={handleEnded}
      preload="auto"
    />
  );
};
