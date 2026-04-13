import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

export default {
  // Enable Svelte 5 runes mode globally for all .svelte files
  compilerOptions: {
    runes: true,
  },
  preprocess: [vitePreprocess()],
};
