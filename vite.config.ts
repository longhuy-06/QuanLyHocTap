
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Đảm bảo process.env.API_KEY hoạt động ổn định trên cả dev và production
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    // Polyfill process.env để tránh lỗi "process is not defined" trong một số thư viện
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'production'),
      API_KEY: JSON.stringify(process.env.API_KEY || '')
    }
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    port: 3000,
  },
});
