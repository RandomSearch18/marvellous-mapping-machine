import { defineConfig } from "vite"
import voby from "voby-vite"

const config = defineConfig({
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
  },
  assetsInclude: ["../backend/**/*.py"],
})

export default config
