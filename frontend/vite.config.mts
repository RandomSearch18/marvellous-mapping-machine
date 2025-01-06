import { defineConfig } from "vite"
import voby from "voby-vite"

const config = defineConfig({
  build: {
    target: "esnext",
  }
  plugins: [
    voby({
      hmr: {
        enabled: process.env.NODE_ENV !== "production",
        filter: /\.(jsx|tsx)$/,
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
