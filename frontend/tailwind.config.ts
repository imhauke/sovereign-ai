import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#09090f',
        surface:  '#111118',
        surface2: '#16161f',
        border:   '#1e1e2e',
        border2:  '#2a2a3e',
        accent: {
          DEFAULT: '#6366f1',
          light:   '#818cf8',
        },
        muted: {
          DEFAULT: '#64748b',
          light:   '#94a3b8',
        },
        ok:   '#22c55e',
        warn: '#f59e0b',
        err:  '#ef4444',
      },
      fontFamily: {
        mono: ["'SF Mono'", "'Fira Code'", "'Cascadia Code'", 'monospace'],
      },
      keyframes: {
        blink: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0' } },
        fadein: { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: {
        blink:  'blink 0.9s step-end infinite',
        fadein: 'fadein 0.2s ease',
      },
    },
  },
  plugins: [],
} satisfies Config
