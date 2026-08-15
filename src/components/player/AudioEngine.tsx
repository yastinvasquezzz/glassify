import React, { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: any;
  }
}

export const AudioEngine: React.FC = () => {
  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const currentVideoIdRef = useRef<string | null>(null);

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

  // Load YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (playerRef.current || !playerContainerRef.current) return;
      playerRef.current = new window.YT.Player(playerContainerRef.current, {
        height: '1',
        width: '1',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            setIsPlayerReady(true);
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
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    }
  }, []);

  // Handle Track Loading
  useEffect(() => {
    if (!isPlayerReady || !currentTrack || !playerRef.current) return;

    const cleanId = currentTrack.videoId || currentTrack.id.replace(/^(yt-|track-)/, '');
    const isVideoId = /^[a-zA-Z0-9_-]{11}$/.test(cleanId);

    const playVideoWithId = (vId: string) => {
      if (currentVideoIdRef.current === vId) return;
      currentVideoIdRef.current = vId;
      try {
        playerRef.current.loadVideoById({ videoId: vId });
        if (isPlaying) {
          playerRef.current.playVideo();
        }
      } catch (e) {}
    };

    if (isVideoId) {
      playVideoWithId(cleanId);
    } else {
      const searchUrl = `https://inv.tux.pizza/api/v1/search?q=${encodeURIComponent(currentTrack.artist + ' ' + currentTrack.title)}&type=video`;
      fetch(searchUrl)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0 && data[0].videoId) {
            playVideoWithId(data[0].videoId);
          }
        })
        .catch(() => {});
    }
  }, [currentTrack?.id, isPlayerReady]);

  // Handle Play/Pause
  useEffect(() => {
    if (!isPlayerReady || !playerRef.current) return;
    try {
      if (isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    } catch (e) {}
  }, [isPlaying, isPlayerReady]);

  // Handle Volume & Mute
  useEffect(() => {
    if (!isPlayerReady || !playerRef.current) return;
    try {
      if (isMuted) {
        playerRef.current.mute();
      } else {
        playerRef.current.unMute();
        playerRef.current.setVolume(Math.round(volume * 100));
      }
    } catch (e) {}
  }, [volume, isMuted, isPlayerReady]);

  // Sync Current Time & Duration via interval
  useEffect(() => {
    if (!isPlayerReady || !playerRef.current) return;

    const interval = setInterval(() => {
      try {
        if (playerRef.current.getCurrentTime) {
          const cur = playerRef.current.getCurrentTime() || 0;
          const dur = playerRef.current.getDuration() || 0;
          if (cur > 0) setCurrentTime(cur);
          if (dur > 0) setDuration(dur);
        }
      } catch (e) {}
    }, 500);

    return () => clearInterval(interval);
  }, [isPlayerReady]);

  // Handle Seek Position
  useEffect(() => {
    if (!isPlayerReady || !playerRef.current) return;
    try {
      const curTime = playerRef.current.getCurrentTime() || 0;
      if (Math.abs(curTime - currentTime) > 2) {
        playerRef.current.seekTo(currentTime, true);
      }
    } catch (e) {}
  }, [currentTime, isPlayerReady]);

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
    <div className="fixed top-0 left-0 w-1 h-1 opacity-0 pointer-events-none overflow-hidden z-[-999]">
      <div ref={playerContainerRef} id="youtube-audio-player" />
    </div>
  );
};
