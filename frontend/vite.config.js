import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./", // relative asset paths — works whether this is served at
              // the domain root or under a GitHub Pages subpath like
              // yourname.github.io/repo-name/
  server: {
    port: 5173,
  },
});
