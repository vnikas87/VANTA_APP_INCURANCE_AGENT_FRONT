import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backendKey = path.resolve(__dirname, '../backend/certs/server.key');
const backendCert = path.resolve(__dirname, '../backend/certs/server.crt');

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  server: {
    https: {
      key: fs.readFileSync(backendKey),
      cert: fs.readFileSync(backendCert),
    },
    proxy: {
      '/api': {
        target: 'https://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'https://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/realms': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/resources': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
