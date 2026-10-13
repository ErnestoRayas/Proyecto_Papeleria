import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const frontendRoot = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig({
  root: frontendRoot,
  envDir: projectRoot,
  plugins: [react()],
  build: { outDir: 'dist' },
  server: { fs: { allow: [projectRoot] }, proxy: { '/api': 'http://localhost:3001' } },
  test: { environment: 'jsdom', setupFiles: './tests/setupTests.js', include: ['tests/**/*.test.{js,jsx}'], globals: true }
});
