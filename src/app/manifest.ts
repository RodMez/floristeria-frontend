import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TAO Boutique Floral",
    short_name: "TAO",
    description: "Flores que cuentan historias",
    start_url: "/",
    display: "standalone",
    background_color: "#fffbf8",
    theme_color: "#E5BE6F",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
    ],
  };
}
