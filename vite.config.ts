import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],

    base: process.env.VITE_BASE_PATH || env.VITE_BASE_PATH || '/',

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@services': path.resolve(__dirname, './src/services'),
        '@stores': path.resolve(__dirname, './src/stores'),
        '@types': path.resolve(__dirname, './src/types'),
        '@styles': path.resolve(__dirname, './src/styles'),
      },
    },

    server: {
      port: 3000,
      open: true,
    },

    preview: {
      port: 4173,
    },

    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',

      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-charts': ['chart.js', 'react-chartjs-2'],
            'vendor-data': ['papaparse', 'lodash-es'],
            'vendor-state': ['zustand'],
          },
          // Consistent chunk naming for caching
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },

      // Target modern browsers for smaller bundle
      target: 'es2020',

      // Enable minification in production (using esbuild - built into Vite)
      minify: mode === 'production' ? 'esbuild' : false,
    },
  }
})
