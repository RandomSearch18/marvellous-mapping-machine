import { defineConfig } from "vite"
import voby from "voby-vite"
import { VitePWA } from "vite-plugin-pwa"
import manifest from "./manifest.mts"

const config = defineConfig({
  build: {
    target: "esnext",
  },
  plugins: [
    voby({
      hmr: {
        enabled: process.env.NODE_ENV !== "production",
        filter: /\.(jsx|tsx)$/,
      },
    }),
    VitePWA({
      manifest,
      devOptions: {
        enabled: true,
      },
      includeAssets: ["*"],
      workbox: {
        globPatterns: [
          "**/*.{js,mjs,ts,mts,jsx,tsx,css,html,png,svg,json,webmanifest,py}",
        ],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn.jsdelivr.net\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "jsdelivr-cache",
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /https:\/\/\w.tile.openstreetmap.org\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "tile-cache",
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    fs: {
      strict: false,
    },
    headers: {
      // So that web workers can work, as per https://docs.pyscript.net/2024.11.1//user-guide/workers#http-headers
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "credentialless",
    },
  },
  assetsInclude: ["../backend/**/*.py"],
})

export default config
