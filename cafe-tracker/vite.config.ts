import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const isReplit = process.env.REPL_ID !== undefined;
const isVercel = process.env.VERCEL !== undefined;

// PORT and BASE_PATH are only required in Replit dev mode
const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 3000;
const basePath = process.env.BASE_PATH ?? "/";

async function buildPlugins() {
  const plugins = [
    react(),
    tailwindcss(),
  ];

  if (!isVercel) {
    const { default: runtimeErrorOverlay } = await import("@replit/vite-plugin-runtime-error-modal");
    plugins.push(runtimeErrorOverlay());
  }

  if (isReplit && !isVercel && process.env.NODE_ENV !== "production") {
    const { cartographer } = await import("@replit/vite-plugin-cartographer");
    plugins.push(cartographer({ root: path.resolve(import.meta.dirname, "..") }));
    const { devBanner } = await import("@replit/vite-plugin-dev-banner");
    plugins.push(devBanner());
  }

  return plugins;
}

export default defineConfig(async () => ({
  base: basePath,
  plugins: await buildPlugins(),
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
}));
