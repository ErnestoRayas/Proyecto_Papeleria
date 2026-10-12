import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: { outDir: 'build' },
  server: { proxy: { '/api': 'http://localhost:3001' } },
  test: { environment: 'jsdom', setupFiles: './src/setupTests.js', include: ['src/**/*.test.{js,jsx}'], globals: true }
});
