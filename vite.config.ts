// __VIBELY_DEDUPE_REACT__ (user-configured)
// __VIBELY_OPTIMIZE_ENTRIES__ (user-configured)
// __VIBELY_NO_OVERLAY__ (user-configured)
// __VIBELY_WATCH_POLL__ (user-configured)
// __VIBELY_HMR_STREAM__ (already current)
import { defineConfig } from "@vibelyai/vite-tanstack-config";

export default defineConfig({
  vite: {
    optimizeDeps: { entries: ["./src/**/*.{ts,tsx,js,jsx}"] },
    resolve: {
      dedupe: [
        "react",
        "react-dom",
        "@tanstack/react-router",
        "@tanstack/react-start",
        "@tanstack/react-query",
      ],
    },
    server: { fs: { deny: ["**/.vibely-*"] } /* __VIBELY_FS_DENY__ */, host: "0.0.0.0", port: 8080, allowedHosts: true /* __MANA_ALLOWED_HOSTS__ */,
      watch: {
        usePolling: true,
        interval: 250,
        binaryInterval: 1000,
        ignored: ["**/.tanstack/tmp/**", "**/.vibely-*", "**/nohup.out", "**/tailwind.config.vibely.json"],
        awaitWriteFinish: { stabilityThreshold: 150, pollInterval: 50 },
      },
      hmr: {
        overlay: false,
      },
    },
  },
  hmrGate: { fullReload: true, events: ["add", "unlink"] },
  tanstackStart: {
    server: { entry: "server" },
  },
});
