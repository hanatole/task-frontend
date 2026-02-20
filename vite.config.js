import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],

  server: {
    proxy: {
      "/api": {
        target: "http://task.com/api",
        changeOrigin: true,
        secure: false,
      },
    },
    allowedHosts: ["localhost", "127.0.0.1", "task.com"],
  },
});
