import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// Both demo pages: `vite demo` serves them, and the docs build puts them at /bozzetto/demo/.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL("./index.html", import.meta.url)),
        picker: fileURLToPath(new URL("./picker.html", import.meta.url)),
      },
    },
  },
});
