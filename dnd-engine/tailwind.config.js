/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dnd: {
          gold: "#d4af37",
          red: "#8b0000",
          parchment: "#f4f1ea",
          dark: "#1a1a1a",
        }
      }
    },
  },
  plugins: [],
}
