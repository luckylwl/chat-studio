import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import { compression } from 'vite-plugin-compression2'

export default defineConfig({
  plugins: [
    react(),
    // Gzip compression
    compression({
      algorithm: 'gzip',
      exclude: [/\.(br)$/, /\.(gz)$/],
    }),
    // Brotli compression for better compression ratio
    compression({
      algorithm: 'brotliCompress',
      exclude: [/\.(br)$/, /\.(gz)$/],
    }),
    // Bundle analyzer (only in build mode with ANALYZE=true)
    process.env.ANALYZE === 'true' &&
      visualizer({
        open: true,
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV === 'development',
    // Use esbuild for faster builds (terser for production)
    minify: process.env.NODE_ENV === 'production' ? 'terser' : 'esbuild',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        // Asset file naming
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`
          } else if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        },
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        manualChunks(id) {
          // React 核心库
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-vendor'
          }

          // React Router
          if (id.includes('react-router')) {
            return 'router'
          }

          // 状态管理
          if (id.includes('zustand')) {
            return 'state'
          }

          // UI 组件库
          if (id.includes('@headlessui') || id.includes('@heroicons')) {
            return 'ui-libs'
          }

          // 动画库
          if (id.includes('framer-motion')) {
            return 'animation'
          }

          // Markdown 和代码高亮
          if (id.includes('marked') || id.includes('highlight.js') || id.includes('dompurify')) {
            return 'markdown'
          }

          // 国际化
          if (id.includes('i18next')) {
            return 'i18n'
          }

          // 安全和加密库
          if (id.includes('crypto-js') || id.includes('@sentry')) {
            return 'security'
          }

          // IndexedDB
          if (id.includes('idb')) {
            return 'storage'
          }

          // 工具库
          if (id.includes('lodash-es')) {
            return 'utils'
          }

          // 其他 node_modules
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Report compressed size
    reportCompressedSize: true,
    // Larger chunks for better caching
    assetsInlineLimit: 4096,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'zustand',
      'framer-motion',
      '@heroicons/react/24/outline',
      '@heroicons/react/24/solid',
      'lodash-es',
      'idb',
      'crypto-js',
    ],
    exclude: ['@sentry/react'],
  },
  // Performance settings
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  // Preview server settings
  preview: {
    port: 4173,
    strictPort: true,
    open: true,
  },
})