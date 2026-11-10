import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 또는 host: true
    port: 5173      // 기본 포트 번호
  }
});
