import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const viteCacheDir = process.env.LOCALAPPDATA
  ? `${process.env.LOCALAPPDATA}/mcmc-presentation-vite-cache`
  : "node_modules/.vite";

export default defineConfig({
  plugins: [react()],
  cacheDir: viteCacheDir,
});
