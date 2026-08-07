/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0a0d14',
        surface: '#121824',
        'surface-hover': '#1a2334',
        card: '#161e2e',
        border: '#232d42',
        candidate: {
          blue: '#3b82f6',      // Progressive / Primary Dem
          cyan: '#06b6d4',      // Liberal / Reform
          purple: '#8b5cf6',    // Left-leaning / Working Families
          amber: '#f59e0b',     // Moderate / Centrist
          red: '#ef4444',       // Conservative / GOP
          emerald: '#10b981',   // Green / Independent
          pink: '#ec4899',      // Democratic Socialist
          gold: '#eab308'       // Frontrunner Gold
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.25)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.25)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
};
