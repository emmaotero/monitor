/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)'],
        display: ['var(--font-display)'],
      },
      colors: {
        navy: {
          950: '#060B18',
          900: '#0A1628',
          800: '#0F2040',
          700: '#162B55',
          600: '#1E3A6E',
        },
        gold: {
          400: '#F5C842',
          500: '#E8B423',
          600: '#C99A0F',
        },
      }
    },
  },
  plugins: [],
}
