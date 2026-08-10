import React, { useEffect, useRef } from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

export const AudioEngine: React.FC = () => {
  const playerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isYtReadyRef = useRef<boolean>(false);
  const loadedTrackIdRef = useRef<string | null>(null);
  const syncIntervalRef = useRef<any>(null);

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

  const extractCleanVideoId = (t: typeof currentTrack): string | null => {
    if (!t) return null;
    if (t.videoId) return t.videoId;
    if (t.id && t.id.startsWith('yt-')) return t.id.replace(/^yt-/, '');
    if (t.audioUrl && t.audioUrl.includes('watch?v=')) {
      const match = t.audioUrl.match(/watch\?v=([a-zA-Z0-9_-]{11})/);
      if (match) return match[1];
    }
    return null;
  };

  // Load YouTube IFrame API script
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      initYtPlayer();
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    if (firstScriptTag && firstScriptTag.parentNode) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    } else {
      document.head.appendChild(tag);
    }

    window.onYouTubeIframeAPIReady = () => {
      initYtPlayer();
    };
  }, []);

  const initYtPlayer = () => {
    if (playerRef.current) return;

    try {
      playerRef.current = new window.YT.Player('yt-audio-player-container', {
        height: '1',
        width: '1',
        videoId: '',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            isYtReadyRef.current = true;
            if (currentTrack) {
              playCurrentTrack();
            }
          },
          onStateChange: (event: any) => {
            // YT.PlayerState.ENDED === 0
            if (event.data === 0) {
              nextTrack();
            } else if (event.data === 1) {
              setIsPlaying(true);
            } else if (event.data === 2) {
              setIsPlaying(false);
            }
          },
        },
      });
    } catch (e) {
      console.warn('YouTube IFrame player initialization notice:', e);
    }
  };

  const playCurrentTrack = () => {
    if (!currentTrack) return;
    const videoId = extractCleanVideoId(currentTrack);

    if (videoId && playerRef.current && isYtReadyRef.current && typeof playerRef.current.loadVideoById === 'function') {
      if (loadedTrackIdRef.current !== currentTrack.id) {
        loadedTrackIdRef.current = currentTrack.id;
        if (isPlaying) {
          playerRef.current.loadVideoById(videoId);
        } else {
          playerRef.current.cueVideoById(videoId);
        }
      } else {
        if (isPlaying) {
          playerRef.current.playVideo();
        } else {
          playerRef.current.pauseVideo();
        }
      }
    } else if (audioRef.current && currentTrack.audioUrl && !currentTrack.audioUrl.includes('youtube.com')) {
      if (loadedTrackIdRef.current !== currentTrack.id) {
        loadedTrackIdRef.current = currentTrack.id;
        audioRef.current.src = currentTrack.audioUrl;
        audioRef.current.load();
      }
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  };

  // Sync state when currentTrack changes
  useEffect(() => {
    playCurrentTrack();
  }, [currentTrack?.id]);

  // Sync state when isPlaying changes
  useEffect(() => {
    if (!currentTrack) return;
    const videoId = extractCleanVideoId(currentTrack);

    if (videoId && playerRef.current && isYtReadyRef.current && typeof playerRef.current.playVideo === 'function') {
      if (isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    } else if (audioRef.current && currentTrack.audioUrl && !currentTrack.audioUrl.includes('youtube.com')) {
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Sync seeking time
  useEffect(() => {
    if (!currentTrack) return;
    const videoId = extractCleanVideoId(currentTrack);

    if (videoId && playerRef.current && isYtReadyRef.current && typeof playerRef.current.getCurrentTime === 'function') {
      const ytTime = playerRef.current.getCurrentTime() || 0;
      if (Math.abs(ytTime - currentTime) > 2) {
        playerRef.current.seekTo(currentTime, true);
      }
    } else if (audioRef.current) {
      if (Math.abs(audioRef.current.currentTime - currentTime) > 2) {
        audioRef.current.currentTime = currentTime;
      }
    }
  }, [currentTime]);

  // Sync volume & mute
  useEffect(() => {
    const targetVol = isMuted ? 0 : Math.round(volume * 100);

    if (playerRef.current && isYtReadyRef.current && typeof playerRef.current.setVolume === 'function') {
      playerRef.current.setVolume(targetVol);
      if (isMuted) {
        playerRef.current.mute();
      } else {
        playerRef.current.unMute();
      }
    }

    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Sync progress & duration loop
  useEffect(() => {
    syncIntervalRef.current = setInterval(() => {
      if (playerRef.current && isYtReadyRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        const ytTime = playerRef.current.getCurrentTime();
        const ytDur = playerRef.current.getDuration();
        if (ytTime !== undefined && !isNaN(ytTime) && ytTime > 0) {
          setCurrentTime(ytTime);
        }
        if (ytDur !== undefined && !isNaN(ytDur) && ytDur > 0) {
          setDuration(ytDur);
        }
      } else if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime || 0);
        if (audioRef.current.duration) {
          setDuration(audioRef.current.duration);
        }
      }
    }, 300);

    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, []);

  // Sync MediaSession Metadata
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

  return (
    <>
      {/* Invisible YouTube IFrame Container */}
      <div
        id="yt-audio-player-container"
        className="fixed -bottom-96 -right-96 w-1 h-1 opacity-0 pointer-events-none overflow-hidden"
      />

      {/* HTML5 Audio Element Fallback */}
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        onEnded={() => nextTrack()}
        preload="auto"
      />
    </>
  );
};
