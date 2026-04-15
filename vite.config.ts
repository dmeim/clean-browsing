import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // Tailwind v4 Vite plugin — no postcss.config, no content globs needed
    tailwindcss(),
    svelte(),
  ],
  resolve: {
    alias: {
      // Required by shadcn-svelte: $lib maps to src/lib
      $lib: path.resolve("./src/lib"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Single entry point — the new tab page
        newtab: path.resolve("./index.html"),
      },
    },
  },
});
