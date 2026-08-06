import React, { useEffect, useState } from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { GlassCard } from '../ui/GlassCard';
import { searchTracksFromApi } from '../../services/musicApi';
import { CATEGORIES } from '../../data/mockData';
import { Track, Album, Artist } from '../../types';
import { Play, Heart, Clock, Loader2, Disc, User, Music } from 'lucide-react';

export const SearchView: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    playTrack,
    likedTrackIds,
    toggleLikeTrackObject,
    selectAlbumObject,
    selectArtist,
  } = usePlayerStore();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);

  // Dynamic API Search Debounce
  useEffect(() => {
    if (!searchQuery || searchQuery.trim() === '') {
      setTracks([]);
      setAlbums([]);
      setArtists([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const results = await searchTracksFromApi(searchQuery);
      setTracks(results.tracks);
      setAlbums(results.albums);
      setArtists(results.artists);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-12 animate-fadeIn select-none">
      {/* Dynamic API Search Results */}
      {searchQuery.trim() !== '' ? (
        <div className="space-y-6 md:space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              Resultados para "{searchQuery}"
              {loading && <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />}
            </h2>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30">
              {tracks.length} coincidencia{tracks.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center text-neutral-400 flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
              <p className="text-sm font-medium">Buscando canciones y álbumes...</p>
            </div>
          ) : tracks.length === 0 && albums.length === 0 ? (
            <p className="text-neutral-400 py-12 text-center bg-white/[0.03] rounded-2xl border border-white/10">
              No encontramos coincidencias para "{searchQuery}". Intenta buscar otro término.
            </p>
          ) : (
            <>
              {/* 1. TRACKS / CANCIONES SECTION */}
              {tracks.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                    <Music className="w-5 h-5 text-emerald-400" /> Canciones Coincidentes
                  </h3>
                  <div className="flex flex-col gap-2">
                    {tracks.map((track, idx) => {
                      const isLiked = likedTrackIds.includes(track.id);
                      return (
                        <div
                          key={track.id}
                          onClick={() => playTrack(track, tracks)}
                          className="flex items-center justify-between p-2.5 md:p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.09] backdrop-blur-xl border border-white/10 transition-all group cursor-pointer"
                        >
                          <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1">
                            <span className="w-6 text-center text-xs font-mono text-neutral-400 group-hover:text-emerald-400 flex-shrink-0">
                              {idx + 1}
                            </span>
                            <div className="relative w-11 h-11 rounded-xl overflow-hidden shadow-md flex-shrink-0">
                              <img
                                src={track.coverUrl}
                                alt={track.title}
                                className="w-full h-full object-cover rounded-xl"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Play className="w-5 h-5 fill-emerald-400 text-emerald-400" />
                              </div>
                            </div>
                            <div className="overflow-hidden min-w-0 flex-1">
                              <p className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                                {track.title}
                              </p>
                              <p className="text-xs text-neutral-400 truncate">{track.artist}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 ml-2 flex-shrink-0">
                            <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-white/10 text-neutral-300">
                              {track.genre || 'Música Hi-Fi'}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLikeTrackObject(track);
                              }}
                              className={`p-1.5 rounded-full transition-colors ${
                                isLiked ? 'text-pink-400 bg-pink-500/20' : 'text-neutral-500 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              <Heart className={`w-4 h-4 ${isLiked ? 'fill-pink-400' : ''}`} />
                            </button>
                            <span className="text-xs font-mono text-neutral-400 w-10 text-right">
                              {formatTime(track.duration)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* 2. ALBUMS SECTION */}
              {albums.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                    <Disc className="w-5 h-5 text-cyan-400" /> Álbumes Encontrados
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                    {albums.map((album) => (
                      <GlassCard
                        key={album.id}
                        onClick={() => selectAlbumObject(album)}
                        className="flex flex-col gap-2.5 p-3 group"
                      >
                        <div className="relative aspect-square rounded-xl overflow-hidden shadow-lg">
                          <img
                            src={album.coverUrl}
                            alt={album.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-xl"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (album.tracks.length > 0) {
                                playTrack(album.tracks[0], album.tracks);
                              }
                            }}
                            title="Reproducir Álbum"
                            className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-[0_0_20px_rgba(29,185,84,0.8)] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300"
                          >
                            <Play className="w-5 h-5 fill-black text-black ml-0.5" />
                          </button>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white truncate">{album.title}</h4>
                          <p className="text-xs text-neutral-400 truncate mt-0.5">{album.artist}</p>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </section>
              )}

              {/* 3. ARTISTS SECTION */}
              {artists.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-purple-400" /> Artistas Coincidentes
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                    {artists.slice(0, 4).map((artist) => (
                      <GlassCard
                        key={artist.id}
                        onClick={() => selectArtist(artist.id)}
                        className="flex flex-col items-center text-center p-3 cursor-pointer"
                      >
                        <img
                          src={artist.avatarUrl}
                          alt={artist.name}
                          className="w-20 h-20 rounded-full object-cover shadow-md border-2 border-white/20 mb-2 group-hover:scale-105 transition-transform"
                        />
                        <h4 className="text-sm font-bold text-white truncate w-full">{artist.name}</h4>
                        <p className="text-[11px] text-neutral-400">Artista Verificado</p>
                      </GlassCard>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      ) : (
        /* Browse Categories Tiles */
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">Explorar por Género</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                onClick={() => setSearchQuery(cat.title)}
                className={`relative h-28 md:h-36 rounded-2xl p-4 overflow-hidden bg-gradient-to-br ${cat.color} border border-white/20 shadow-xl cursor-pointer hover:scale-105 transition-all duration-300 group`}
              >
                <div className="absolute inset-0 bg-black/20 backdrop-blur-xs group-hover:bg-black/10 transition-colors" />
                <h3 className="text-lg md:text-xl font-extrabold text-white relative z-10">{cat.title}</h3>
                <span className="absolute -bottom-2 -right-2 text-5xl md:text-6xl opacity-40 group-hover:scale-125 transition-transform">
                  {cat.icon}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
