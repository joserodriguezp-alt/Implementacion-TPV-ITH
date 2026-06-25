/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Sidebar oscuro
        sidebar: {
          DEFAULT:       '#1B2230',
          hover:         '#232D40',
          active:        '#2A3650',
          text:          '#7A8BA8',
          'text-active': '#F0F4FF',
          border:        '#263044',
          accent:        '#3B82F6',
        },
        // Acento institucional azul
        brand: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          900: '#1E3A8A',
        },
      },
      boxShadow: {
        card:  '0 1px 3px 0 rgba(0,0,0,.06), 0 1px 2px -1px rgba(0,0,0,.04)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,.09)',
        sidebar: '4px 0 24px 0 rgba(0,0,0,.18)',
      },
      borderRadius: {
        xl2: '1rem',
      },
    },
  },
  plugins: [],
};
