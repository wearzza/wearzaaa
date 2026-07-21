import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '::',
    port: 8080,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
