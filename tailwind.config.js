/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          neon: '#1db954',
          green: '#1db954',
          cyan: '#00f2fe',
          purple: '#7928ca',
        },
        glass: {
          base: 'rgba(20, 20, 32, 0.65)',
          panel: 'rgba(255, 255, 255, 0.05)',
          card: 'rgba(255, 255, 255, 0.07)',
          hover: 'rgba(255, 255, 255, 0.12)',
          border: 'rgba(255, 255, 255, 0.12)',
          glow: 'rgba(255, 255, 255, 0.25)',
          accent: '#1db954',
          neon: '#00f2fe',
          purple: '#7928ca',
          pink: '#ff0080',
        }
      },
      backdropBlur: {
        xs: '4px',
        glass: '24px',
        heavy: '40px',
      },
      boxShadow: {
        'glass-sm': '0 4px 16px 0 rgba(0, 0, 0, 0.3)',
        'glass-md': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-lg': '0 12px 48px 0 rgba(0, 0, 0, 0.5)',
        'glass-glow': '0 0 25px rgba(255, 255, 255, 0.15)',
        'accent-glow': '0 0 30px rgba(29, 185, 84, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 12s linear infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glowPulse: {
          '0%': { boxShadow: '0 0 15px rgba(0, 242, 254, 0.3)' },
          '100%': { boxShadow: '0 0 35px rgba(121, 40, 202, 0.6)' },
        }
      }
    },
  },
  plugins: [],
}
