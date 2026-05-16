import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "https://quickbill-point-of-sale-system-0c9q.onrender.com",
    },
  },
});
