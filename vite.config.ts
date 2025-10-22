import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProd = mode === 'production';
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      build: {
        rollupOptions: {
          output: {
            manualChunks: undefined, // Disable manual chunking to force rebuild
          }
        },
        minify: 'terser',
        terserOptions: isProd ? {
          compress: {
            drop_console: true, // Remove console.logs in production
            drop_debugger: true, // Remove debugger statements
            pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific console methods
          }
        } : {}
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
