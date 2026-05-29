/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        void:     '#020C18',
        base:     '#061424',
        card:     '#0A1E36',
        elevated: '#0E2744',
        border:   '#163558',
        'border-bright': '#1E4A78',
        primary:  '#E0EEFF',
        secondary:'#6A8EB5',
        dim:      '#3D5F82',
        green:    '#00E5A0',
        'green-dim': 'rgba(0,229,160,0.12)',
        red:      '#FF3D5E',
        'red-dim':'rgba(255,61,94,0.12)',
        accent:   '#1B74FF',
        gold:     '#FFB020',
        purple:   '#7C3AED',
      },
      fontFamily: {
        heading: ['"Chakra Petch"', 'sans-serif'],
        mono:    ['"Space Mono"', 'monospace'],
        body:    ['"DM Sans"', 'sans-serif'],
      },
      animation: {
        'pulse-green': 'pulseGreen 2s ease-in-out infinite',
        'pulse-red':   'pulseRed 2s ease-in-out infinite',
        'slide-in':    'slideIn 0.3s ease-out',
        'fade-in':     'fadeIn 0.4s ease-out',
        'ticker':      'ticker 30s linear infinite',
        'glow':        'glow 3s ease-in-out infinite',
        'scan':        'scan 4s linear infinite',
        'float':       'float 6s ease-in-out infinite',
      },
      keyframes: {
        pulseGreen: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0,229,160,0)' },
          '50%': { boxShadow: '0 0 12px 4px rgba(0,229,160,0.3)' },
        },
        pulseRed: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,61,94,0)' },
          '50%': { boxShadow: '0 0 12px 4px rgba(255,61,94,0.3)' },
        },
        slideIn: {
          from: { transform: 'translateX(-20px)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        ticker: {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
        glow: {
          '0%, 100%': { textShadow: '0 0 8px rgba(0,229,160,0.4)' },
          '50%': { textShadow: '0 0 20px rgba(0,229,160,0.8), 0 0 40px rgba(0,229,160,0.3)' },
        },
        scan: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
