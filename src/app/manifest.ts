import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vera Contract Risk Analysis",
    short_name: "Vera",
    description: "Plain-English contract risk reports.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#6366f1",
  };
}
