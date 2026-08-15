import React, { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: any;
  }
}

const PUBLIC_INVIDIOUS_INSTANCES = [
  'https://invidious.flokinet.to',
  'https://yewtu.be',
  'https://invidious.projectsegfau.lt',
];

async function resolveYouTubeVideoId(query: string): Promise<string | null> {
  const clean = query.trim();
  for (const instance of PUBLIC_INVIDIOUS_INSTANCES) {
    try {
      const isPiped = instance.includes('piped');
      const url = isPiped
        ? `${instance}/search?q=${encodeURIComponent(clean)}&filter=videos`
        : `${instance}/api/v1/search?q=${encodeURIComponent(clean)}&type=video`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (isPiped && Array.isArray(data.items) && data.items.length > 0) {
          const rawUrl = data.items[0].url || '';
          const vId = rawUrl.replace('/watch?v=', '');
          if (vId && /^[a-zA-Z0-9_-]{11}$/.test(vId)) return vId;
        } else if (Array.isArray(data) && data.length > 0 && data[0].videoId) {
          const vId = data[0].videoId;
          if (vId && /^[a-zA-Z0-9_-]{11}$/.test(vId)) return vId;
        }
      }
    } catch (e) {}
  }
  return null;
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
        height: '64',
        width: '64',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          origin: window.location.origin,
          widget_referrer: window.location.origin,
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
              // Ignore automatic background pause triggered by browser tab hiding or WebKit throttling
              if (!document.hidden && !usePlayerStore.getState().isPlaying) {
                setIsPlaying(false);
              } else if (usePlayerStore.getState().isPlaying && playerRef.current) {
                setTimeout(() => {
                  try {
                    playerRef.current?.playVideo();
                  } catch (e) {}
                }, 100);
              }
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

  // Persistent Tab Visibility Listener (Keep playing audio in background)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isPlaying && playerRef.current) {
        try {
          playerRef.current.playVideo();
        } catch (e) {}
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleVisibilityChange);
    };
  }, [isPlaying]);

  // Silent Background Audio Keep-Alive Element
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!silentAudioRef.current) {
      const audio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
      audio.loop = true;
      silentAudioRef.current = audio;
    }

    if (isPlaying) {
      silentAudioRef.current.play().catch(() => {});
    } else {
      silentAudioRef.current.pause();
    }
  }, [isPlaying]);

  // Handle Track Loading
  useEffect(() => {
    if (!isPlayerReady || !currentTrack || !playerRef.current) return;

    let isMounted = true;
    const cleanId = currentTrack.videoId || currentTrack.id.replace(/^(yt-|track-)/, '');
    const isVideoId = /^[a-zA-Z0-9_-]{11}$/.test(cleanId);

    const loadAndPlay = (vId: string) => {
      if (!isMounted || !playerRef.current) return;
      currentVideoIdRef.current = vId;
      try {
        playerRef.current.loadVideoById({ videoId: vId });
        if (isPlaying) {
          playerRef.current.playVideo();
        }
      } catch (e) {}
    };

    if (isVideoId) {
      loadAndPlay(cleanId);
    } else {
      try {
        playerRef.current.pauseVideo();
      } catch (e) {}

      resolveYouTubeVideoId(`${currentTrack.artist} ${currentTrack.title}`).then((vId) => {
        if (vId && isMounted) {
          loadAndPlay(vId);
        }
      });
    }

    return () => {
      isMounted = false;
    };
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

  // Sync MediaSession Metadata & Playback State
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album || 'Glassify Hi-Fi',
        artwork: [{ src: currentTrack.coverUrl, sizes: '512x512', type: 'image/jpeg' }],
      });

      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

      navigator.mediaSession.setActionHandler('play', () => {
        setIsPlaying(true);
        if (playerRef.current) {
          try {
            playerRef.current.playVideo();
          } catch (e) {}
        }
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        setIsPlaying(false);
        if (playerRef.current) {
          try {
            playerRef.current.pauseVideo();
          } catch (e) {}
        }
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => usePlayerStore.getState().previousTrack());
      navigator.mediaSession.setActionHandler('nexttrack', () => usePlayerStore.getState().nextTrack());
    }
  }, [currentTrack, isPlaying]);

  return (
    <div className="fixed top-0 -left-[9999px] w-16 h-16 pointer-events-none overflow-hidden z-[-999]">
      <div ref={playerContainerRef} id="youtube-audio-player" />
    </div>
  );
};
