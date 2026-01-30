import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Vite Configuration
 * Configures the build tool and development server settings.
 *
 * Key Modifications for Docker:
 * - Host binding (host: true) to allow external access.
 * - File polling (usePolling: true) to ensure file changes propagate 
 * through the Docker volume mount, fixing hot-reload issues on some OSs.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Bind to all network interfaces (0.0.0.0) to allow Docker port mapping
    host: true, 
    port: 3000,
    
    // Watcher options to enforce file change detection inside Docker
    watch: {
      usePolling: true, // Critical: Forces polling instead of native OS events
      interval: 100,    // Poll every 100ms for responsiveness
    },
  },
});