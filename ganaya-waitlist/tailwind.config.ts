import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#060B14',
          'elev-1': '#0E1726',
          'elev-2': '#1A2333',
        },
        accent: {
          DEFAULT: '#00E676',
          hover: '#00C766',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#B0B8C5',
          tertiary: '#6B7280',
        },
        warning: '#FFA726',
        danger: '#EF5350',
        info: '#42A5F5',
      },
      fontFamily: {
        sans: ['var(--font-montserrat)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['32px', { lineHeight: '1.1', fontWeight: '700' }],
        h1: ['24px', { lineHeight: '1.2', fontWeight: '700' }],
        h2: ['20px', { lineHeight: '1.3', fontWeight: '600' }],
        h3: ['16px', { lineHeight: '1.4', fontWeight: '600' }],
        body: ['15px', { lineHeight: '1.5', fontWeight: '500' }],
        caption: ['13px', { lineHeight: '1.4', fontWeight: '500' }],
        micro: ['11px', { lineHeight: '1.3', fontWeight: '600' }],
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '16px',
        pill: '999px',
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
    },
  },
  plugins: [],
}

export default config
