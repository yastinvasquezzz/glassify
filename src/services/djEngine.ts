/**
 * Glass AI DJ Engine - Speech Synthesis, Dynamic Radio Host & Personalities
 */

export type DJPersonality = 'radio' | 'chill' | 'urban';

export interface DJContext {
  trackTitle: string;
  artistName: string;
  genre?: string;
  songsPlayedCount?: number;
  personality?: DJPersonality;
}

class DJEngine {
  private synth: SpeechSynthesis | null = null;
  private voice: SpeechSynthesisVoice | null = null;
  private isSpeaking: boolean = false;
  private currentPersonality: DJPersonality = 'radio';

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  public setPersonality(personality: DJPersonality) {
    this.currentPersonality = personality;
  }

  public getPersonality(): DJPersonality {
    return this.currentPersonality;
  }

  private loadVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    
    const naturalSpanishVoice =
      voices.find((v) => v.lang.startsWith('es') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Online'))) ||
      voices.find((v) => v.lang.startsWith('es') && (v.name.includes('Sabina') || v.name.includes('Dalia') || v.name.includes('Jorge') || v.name.includes('Helena') || v.name.includes('Paloma'))) ||
      voices.find((v) => v.lang.startsWith('es-MX')) ||
      voices.find((v) => v.lang.startsWith('es-ES')) ||
      voices.find((v) => v.lang.startsWith('es'));

    this.voice = naturalSpanishVoice || null;
  }

  /**
   * Generates natural, casual, and warm radio scripts based on selected personality
   */
  public generateScript(type: 'intro' | 'transition' | 'like', ctx: DJContext): string {
    const song = ctx.trackTitle || 'esta canción';
    const artist = ctx.artistName || 'el artista';
    const personality = ctx.personality || this.currentPersonality;

    if (personality === 'chill') {
      const chillScripts = [
        `¡Hola! Bajamos un poco las revoluciones... Disfruta de la vibra suave de ${song} con ${artist}.`,
        `¡Volví por aquí! Relájate y siente este ritmo perfecto de ${artist}.`,
        `Frecuencia chill activa... Seguimos en total tranquilidad con ${song}.`,
      ];
      return chillScripts[Math.floor(Math.random() * chillScripts.length)];
    }

    if (personality === 'urban') {
      const urbanScripts = [
        `¡Qué lo qué! Venimos con todo el ritmo fiestero... ¡Escuchamos a ${artist} con ${song}!`,
        `¡Volví mi gente! Seguimos encendiendo la pista con la mejor música... ¡Disfruta el tema!`,
        `¡Súbele al volumen! Esta mezcla viene con toda la energía de ${artist}.`,
      ];
      return urbanScripts[Math.floor(Math.random() * urbanScripts.length)];
    }

    // Default 'radio' personality
    const transitions = [
      `¡Volví! Qué buena secuencia de canciones llevamos... Ahora cambiamos un poco la frecuencia con ${song} de ${artist}.`,
      `¡Hola! ¿Cómo vas? Soy tu DJ Glass. Seguimos conectados con la mejor vibra... Escuchamos a ${artist}.`,
      `¡Ey! ¿Qué tal todo? Pasamos a un tema increíble... Venimos con ${song}. ¡Acomódate y siente el ritmo!`,
      `¡Volví por aquí! Esta canción encaja perfecto con el ambiente... Disfruta de ${artist}.`,
    ];

    const likes = [
      `¡Excelente elección! Guardada en tus canciones favoritas. Seguimos conectados con la mejor música.`,
      `¡Temazo total! Agregada a tus favoritas. Sigamos disfrutando de la buena vibra.`,
    ];

    if (type === 'like') {
      return likes[Math.floor(Math.random() * likes.length)];
    }

    return transitions[Math.floor(Math.random() * transitions.length)];
  }

  /**
   * Speaks the radio script using Web Speech API
   */
  public speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) {
        resolve();
        return;
      }

      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      if (this.voice) {
        utterance.voice = this.voice;
      } else {
        this.loadVoices();
        if (this.voice) utterance.voice = this.voice;
      }

      // Adjust rate and pitch based on personality
      if (this.currentPersonality === 'chill') {
        utterance.rate = 0.92;
        utterance.pitch = 0.95;
      } else if (this.currentPersonality === 'urban') {
        utterance.rate = 1.05;
        utterance.pitch = 1.05;
      } else {
        utterance.rate = 0.98;
        utterance.pitch = 1.0;
      }

      utterance.volume = 1.0;

      utterance.onstart = () => {
        this.isSpeaking = true;
        if (onStart) onStart();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        if (onEnd) onEnd();
        resolve();
      };

      utterance.onerror = (err) => {
        console.warn('Speech synthesis notice:', err);
        this.isSpeaking = false;
        if (onEnd) onEnd();
        resolve();
      };

      this.synth.speak(utterance);
    });
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
}

export const djEngine = new DJEngine();
