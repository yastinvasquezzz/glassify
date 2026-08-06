import React, { useEffect, useState } from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { GlassCard } from '../ui/GlassCard';
import { fetchTopTrendingTracks } from '../../services/musicApi';
import { Track } from '../../types';
import { Play, Heart, History, Grid, Flame, Radio } from 'lucide-react';

const MUSIC_CATEGORIES = [
  { name: 'Pop Internacional', color: 'from-pink-600/70 to-purple-600/70', query: 'Pop Global Hits 2026' },
  { name: 'Reggaetón & Urbano', color: 'from-amber-600/70 to-red-600/70', query: 'Bad Bunny Reggaeton' },
  { name: 'Lo-Fi & Chill', color: 'from-cyan-600/70 to-blue-600/70', query: 'Lo-Fi Chill Beats' },
  { name: 'Synthwave & Cyber', color: 'from-purple-600/70 to-pink-600/70', query: 'Synthwave 80s Hits' },
  { name: 'Rock & Alternativo', color: 'from-red-700/70 to-neutral-800/70', query: 'Rock Hits' },
  { name: 'Salsa & Cumbia', color: 'from-emerald-600/70 to-teal-600/70', query: 'Salsa Latina' },
];

export const HomeView: React.FC = () => {
  const {
    playTrack,
    likedTrackIds,
    toggleLikeTrackObject,
    recentlyPlayed,
    setSelectedCategory,
  } = usePlayerStore();

  const [trendingTracks, setTrendingTracks] = useState<Track[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadApiMusic = async () => {
      const data = await fetchTopTrendingTracks();
      if (isMounted && data.trending.length > 0) {
        setTrendingTracks(data.trending);
      }
    };
    loadApiMusic();
    return () => { isMounted = false; };
  }, []);

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? 'Buenos días' : currentHour < 18 ? 'Buenas tardes' : 'Buenas noches';

  const top5RecentlyPlayed = recentlyPlayed.slice(0, 5);

  return (
    <div className="space-y-8 pb-12 animate-fadeIn select-none">

      {/* 🌟 SLEEK HERO BANNER */}
      <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden bg-gradient-to-r from-emerald-600/25 via-purple-600/20 to-cyan-600/25 border border-white/20 shadow-2xl backdrop-blur-2xl group">
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#1db954]/25 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700" />

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1db954]/20 border border-[#1db954]/40 text-emerald-300 text-xs font-mono font-bold">
            <Radio className="w-3.5 h-3.5 animate-pulse text-[#1db954]" /> RADIO INTELIGENTE ACTIVA
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {greeting}
          </h1>

          <p className="text-sm text-neutral-200 max-w-xl leading-relaxed">
            Al finalizar cada canción, la Radio Inteligente continuará reproduciendo automáticamente canciones parecidas del mismo estilo.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => {
                if (trendingTracks.length > 0) {
                  playTrack(trendingTracks[0], trendingTracks);
                }
              }}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black font-extrabold text-sm shadow-[0_0_25px_rgba(29,185,84,0.7)] hover:shadow-[0_0_35px_rgba(0,242,254,0.8)] hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-black text-black ml-0.5" /> Reproducir Éxitos Variados
            </button>
          </div>
        </div>
      </div>

      {/* 🟢 ESCUCHADOS RECIENTEMENTE */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-[#1db954]" /> Escuchados Recientemente
          </h2>
          <span className="text-xs text-emerald-300 font-mono font-bold bg-[#1db954]/20 px-3 py-1 rounded-full border border-[#1db954]/40">
            Top 5
          </span>
        </div>

        {top5RecentlyPlayed.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 text-neutral-400 text-center text-sm font-medium backdrop-blur-md">
            Aún no has reproducido canciones. Explora los éxitos variados o categorías para escuchar tus primeras pistas.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {top5RecentlyPlayed.map((track) => (
              <GlassCard
                key={track.id}
                onClick={() => playTrack(track, top5RecentlyPlayed)}
                className="flex flex-col gap-3 group"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden shadow-lg bg-black/40">
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-xl"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playTrack(track, top5RecentlyPlayed);
                    }}
                    className="absolute bottom-3 right-3 w-11 h-11 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black flex items-center justify-center shadow-[0_0_20px_rgba(29,185,84,0.8)] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-black text-black ml-0.5" />
                  </button>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                    {track.title}
                  </h3>
                  <p className="text-xs text-neutral-400 truncate mt-0.5">{track.artist}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </section>

      {/* 🚀 EXPLORAR POR CATEGORÍAS */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Grid className="w-5 h-5 text-cyan-400" /> Explorar por Categorías
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {MUSIC_CATEGORIES.map((cat) => (
            <div
              key={cat.name}
              onClick={() => setSelectedCategory(cat.query)}
              className={`p-4 rounded-2xl bg-gradient-to-br ${cat.color} cursor-pointer hover:scale-105 transition-all duration-300 shadow-lg border border-white/20 flex flex-col justify-between h-24 group`}
            >
              <span className="text-[10px] font-mono uppercase font-bold text-white/80">Género</span>
              <h3 className="text-sm font-black text-white leading-tight group-hover:text-cyan-200 transition-colors">
                {cat.name}
              </h3>
            </div>
          ))}
        </div>
      </section>

      {/* 🔥 CANCIONES POPULARES VARIADAS */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-400" /> Canciones Populares Variadas
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {trendingTracks.map((track) => {
            const isLiked = likedTrackIds.includes(track.id);
            return (
              <GlassCard
                key={track.id}
                onClick={() => playTrack(track, trendingTracks)}
                className="flex flex-col gap-3 group"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden shadow-lg bg-black/40">
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-xl"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playTrack(track, trendingTracks);
                    }}
                    className="absolute bottom-3 right-3 w-11 h-11 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black flex items-center justify-center shadow-[0_0_20px_rgba(29,185,84,0.8)] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-black text-black ml-0.5" />
                  </button>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                    {track.title}
                  </h3>
                  <p className="text-xs text-neutral-400 truncate mt-0.5">{track.artist}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-neutral-300 truncate max-w-[100px]">
                      {track.genre || 'Música Hi-Fi'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLikeTrackObject(track);
                      }}
                      className={`p-1.5 rounded-full transition-all ${
                        isLiked ? 'text-pink-400 bg-pink-500/20' : 'text-neutral-500 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-pink-400' : ''}`} />
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </section>
    </div>
  );
};
