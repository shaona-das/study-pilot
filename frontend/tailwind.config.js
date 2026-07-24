/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#EDEFEA",
        surface: "#F8F7F2",
        ink: "#1F2A24",
        pine: {
          DEFAULT: "#3B5D50",
          light: "#5A8272",
          dark: "#2A4238",
        },
        brass: {
          DEFAULT: "#C08A3E",
          light: "#DDB876",
          dark: "#8F6425",
        },
        brick: {
          DEFAULT: "#A63D40",
          light: "#C97577",
        },
        line: "#D8D9CE",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
