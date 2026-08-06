import React from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { MOCK_ARTISTS } from '../../data/mockData';
import { Play, Heart, CheckCircle2, UserPlus, Music } from 'lucide-react';
import { GlassButton } from '../ui/GlassButton';

export const ArtistView: React.FC = () => {
  const { selectedArtistId, playTrack, likedTrackIds, toggleLikeTrack } = usePlayerStore();

  const artist = MOCK_ARTISTS.find((a) => a.id === selectedArtistId) || MOCK_ARTISTS[0];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-8 pb-12 animate-fadeIn">
      {/* Artist Hero Header */}
      <div className="relative h-80 rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex items-end p-8">
        <img
          src={artist.bannerUrl}
          alt={artist.name}
          className="absolute inset-0 w-full h-full object-cover filter brightness-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        <div className="relative z-10 flex items-end gap-6">
          <img
            src={artist.avatarUrl}
            alt={artist.name}
            className="w-32 h-32 rounded-full object-cover border-4 border-white/20 shadow-2xl"
          />
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> ARTISTA VERIFICADO
            </span>
            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
              {artist.name}
            </h1>
            <p className="text-sm text-neutral-300">
              {(artist.followers / 1000000).toFixed(1)}M Oyentes Mensuales • {artist.bio}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <GlassButton
          variant="primary"
          size="lg"
          onClick={() => playTrack(artist.topTracks[0], artist.topTracks)}
        >
          <Play className="w-5 h-5 fill-current" /> Reproducir Popular
        </GlassButton>
        <GlassButton variant="glass" size="lg">
          <UserPlus className="w-4 h-4" /> Seguir Artista
        </GlassButton>
      </div>

      {/* Popular Tracks Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Canciones Populares</h2>
        <div className="bg-black/30 rounded-2xl border border-white/10 overflow-hidden backdrop-blur-xl divide-y divide-white/5">
          {artist.topTracks.map((track, idx) => {
            const isLiked = likedTrackIds.includes(track.id);
            return (
              <div
                key={track.id}
                onClick={() => playTrack(track, artist.topTracks)}
                className="flex items-center justify-between p-3.5 hover:bg-white/10 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <span className="w-6 text-center text-sm font-mono text-neutral-400 group-hover:hidden">
                    {idx + 1}
                  </span>
                  <Play className="w-4 h-4 text-emerald-400 hidden group-hover:block mx-1 fill-current" />
                  <img src={track.coverUrl} alt={track.title} className="w-11 h-11 rounded-lg object-cover" />
                  <div>
                    <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {track.title}
                    </h3>
                    <p className="text-xs text-neutral-400">{track.playCount?.toLocaleString()} reproducciones</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 font-mono text-sm text-neutral-400">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLikeTrack(track.id);
                    }}
                    className={`p-1 ${isLiked ? 'text-emerald-400' : 'text-neutral-500 hover:text-white'}`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-emerald-400' : ''}`} />
                  </button>
                  <span>{formatTime(track.duration)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
