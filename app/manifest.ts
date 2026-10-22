import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Casa Caos – Vaskelista",
    short_name: "Casa Caos",
    description: "Felles oppgaver, poeng og historikk for kollektivet.",
    start_url: "/",
    display: "standalone",
    background_color: "#fff8ed",
    theme_color: "#315d52",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
