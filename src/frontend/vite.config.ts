import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import os from 'os';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'single-network-url',
      configureServer(server) {
        server.printUrls = () => {
          const interfaces = os.networkInterfaces();
          // Find the primary Wi-Fi IPv4 address (excluding Tailscale 100.* and WSL 172.*)
          const wifi =
            interfaces['Wi-Fi']?.find((i) => i.family === 'IPv4')?.address ||
            interfaces['Ethernet']?.find((i) => i.family === 'IPv4')?.address ||
            Object.values(interfaces)
              .flat()
              .find(
                (i) =>
                  i &&
                  !i.internal &&
                  i.family === 'IPv4' &&
                  !i.address.startsWith('100.') &&
                  !i.address.startsWith('172.')
              )?.address;

          const port = server.config.server.port || 3000;
          console.log(`\n  ➜  Local:   \x1b[36mhttp://localhost:${port}/\x1b[0m`);
          if (wifi) {
            console.log(`  ➜  Network: \x1b[36mhttp://${wifi}:${port}/\x1b[0m\n`);
          }
        };
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/notificationHub': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
});
