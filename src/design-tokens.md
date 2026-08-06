# Sistema de Diseño Glassmorphism — Tokens Glassify

Documento de especificación visual para el ecosistema **Glassify**.

## 1. Paleta de Colores & Opacidades Glass

| Token | Valor CSS / HSL | Uso |
|---|---|---|
| `--glass-panel-bg` | `rgba(18, 18, 28, 0.55)` | Fondos de contenedores y paneles principales |
| `--glass-card-bg` | `rgba(255, 255, 255, 0.04)` | Tarjetas interactivas de álbumes/canciones |
| `--glass-card-hover` | `rgba(255, 255, 255, 0.09)` | Estado hover de tarjetas |
| `--glass-border` | `rgba(255, 255, 255, 0.08)` | Bordes finos translucientes de paneles |
| `--glass-border-hover` | `rgba(255, 255, 255, 0.22)` | Bordes reactivos en foco/hover |
| `--glass-glow` | `rgba(29, 185, 84, 0.4)` | Resplandor del acento activo (Spotify Neon Green) |
| `--blur-panel` | `backdrop-filter: blur(24px) saturate(180%)` | Desenfoque de fondo profundo para paneles |
| `--blur-card` | `backdrop-filter: blur(16px)` | Desenfoque ligero para elementos flotantes |

## 2. Tipografía & Jerarquía

- **Fuente Primaria:** `Plus Jakarta Sans`, sans-serif.
- **Fuente Técnica / Tiempos / Contadores:** `Space Grotesk`, monospace.
- **Jerarquía:**
  - Hero Header: `font-extrabold` (36px - 60px)
  - Sección Título: `font-bold` (20px - 24px)
  - Título de Canción: `font-bold` (14px - 16px)
  - Metadatos / Artista: `font-medium` (12px - 14px)

## 3. Principios de Interacción

- **Micro-animaciones:** `transition-all 200ms - 300ms cubic-bezier(0.4, 0, 0.2, 1)`.
- **Efecto Flotante:** `hover:-translate-y-1` con aumento progresivo de sombra `box-shadow: 0 12px 30px rgba(0,0,0,0.4)`.
- **Adaptatividad por Carátula:** El fondo general calcula la tonalidad HSL dominante de la canción activa e inyecta orbes luminosos pulsantes en segundo plano.
