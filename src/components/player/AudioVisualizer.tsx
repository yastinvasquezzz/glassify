import React, { useEffect, useRef } from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';

export const AudioVisualizer: React.FC<{ bars?: number; height?: string }> = ({
  bars = 24,
  height = 'h-12',
}) => {
  const { isPlaying } = usePlayerStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const audioEl = document.querySelector('audio');
    const win = typeof window !== 'undefined' ? (window as any) : null;

    if (audioEl && win && !win.globalAudioCtx) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          const source = ctx.createMediaElementSource(audioEl);
          source.connect(analyser);
          analyser.connect(ctx.destination);

          win.globalAudioCtx = ctx;
          win.globalAnalyser = analyser;
          win.globalSource = source;
        }
      } catch (e) {
        console.warn('AudioContext init notice:', e);
      }
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const dataArray = new Uint8Array(bars);
    const win = typeof window !== 'undefined' ? (window as any) : null;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = canvas.width / bars - 2;

      const analyser = win?.globalAnalyser;
      if (isPlaying && analyser) {
        analyser.getByteFrequencyData(dataArray);
      }

      for (let i = 0; i < bars; i++) {
        let barHeight: number;
        if (isPlaying) {
          if (analyser && dataArray[i] > 0) {
            barHeight = (dataArray[i] / 255) * canvas.height;
          } else {
            const freq = Math.sin(Date.now() * 0.006 + i * 0.4) * 0.5 + 0.5;
            const randomNoise = Math.random() * 0.25;
            barHeight = (freq * 0.75 + randomNoise) * canvas.height;
          }
        } else {
          barHeight = 4;
        }

        const x = i * (barWidth + 2);
        const y = canvas.height - Math.max(barHeight, 4);

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, 'rgba(29, 185, 84, 0.4)');
        gradient.addColorStop(0.5, 'rgba(0, 242, 254, 0.8)');
        gradient.addColorStop(1, 'rgba(121, 40, 202, 1)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, Math.max(barHeight, 4), 3);
        } else {
          ctx.rect(x, y, barWidth, Math.max(barHeight, 4));
        }
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, bars]);

  return (
    <div className={`w-full ${height} flex items-center justify-center`}>
      <canvas
        ref={canvasRef}
        width={300}
        height={60}
        className="w-full h-full max-w-xs opacity-90 filter drop-shadow-[0_0_10px_rgba(0,242,254,0.4)]"
      />
    </div>
  );
};
