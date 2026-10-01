import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bizim Hikayemiz ❤️",
    short_name: "Hikayemiz",
    description: "Oğuzhan & Şüheda WhatsApp Anı Kapsülü",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b141a",
    theme_color: "#202c33",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}