import { ManifestOptions } from "vite-plugin-pwa"

const manifest: Partial<ManifestOptions> = {
  name: "Mish's Marvellous Mapping Machine",
  short_name: "Mapping Machine",
  start_url: "/",
  display: "standalone",
  theme_color: "#ffc0cb",
  icons: [
    {
      src: "/icons/mmmm.svg",
      type: "image/svg+xml",
      sizes: "170x170",
    },
    {
      src: "/icons/mmmm-192.png",
      type: "image/png",
      sizes: "192x192",
    },
    {
      src: "/icons/mmmm-512.png",
      type: "image/png",
      sizes: "512x512",
    },
    {
      src: "/icons/mmmm-maskable.svg",
      sizes: "170x170",
      type: "image/svg+xml",
      purpose: "maskable",
    },
  ],
}

export default manifest
