/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/client/pages/**/*.html",
    "./src/client/scripts/**/*.ts",
    "./src/client/components/**/*.ts",
  ],
  theme: {
    extend: {

      colors: {
        bg: "#FDFAF6",
        surface: "#FFFFFF",
        primary: "#2E6B4F",
        "primary-dark": "#1F4D38",
        accent: "#E8A045",
        // "text" and "muted" are common Tailwind names, so we prefix to avoid clashing
        "app-text": "#1A1A2E",
        muted: "#6B7280",
        border: "#E5E0D8",
      },
      fontFamily: {
        display: ["Playfair Display", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      maxWidth: {
        app: "1100px", // matches your --max-w: 1100px
      },
    },
  },
  plugins: [],
};
    