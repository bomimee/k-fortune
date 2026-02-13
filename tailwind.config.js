/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-gold': '#D4AF37', // A nice gold for fortune
        'brand-dark': '#1a1a1a', // Dark theme primary
        'brand-red': '#C8102E', // Subtle Korean red accent
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'], // Professional English font
      },
    },
  },
  plugins: [],
}
