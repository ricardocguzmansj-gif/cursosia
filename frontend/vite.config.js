import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    headers: {
      "Content-Security-Policy": "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.supabase.co;"
    },
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
