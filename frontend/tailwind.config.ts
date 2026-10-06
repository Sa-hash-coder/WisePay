import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'sentinel': {
          bg: '#0A0E1A',
          surface: '#111827',
          card: '#1F2937',
          border: '#374151',
          primary: '#3B82F6',
          warning: '#F59E0B',
          danger: '#EF4444',
          success: '#10B981',
        }
      }
    },
  },
  plugins: [],
}
export default config
