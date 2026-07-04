import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

function copyHerenowManifest(): Plugin {
  return {
    name: 'copy-herenow-manifest',
    closeBundle() {
      const src = resolve(__dirname, '.herenow')
      const dest = resolve(__dirname, 'dist/.herenow')
      if (existsSync(src)) {
        mkdirSync(resolve(__dirname, 'dist'), { recursive: true })
        cpSync(src, dest, { recursive: true })
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const rootDir = resolve(__dirname, '..')
  const env = loadEnv(mode, rootDir, '')

  return {
    envDir: rootDir,
    plugins: [react(), copyHerenowManifest()],
  server: {
    proxy: {
      '/api/ispot': {
        target: 'https://ispot.pl',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ispot/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader(
              'User-Agent',
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            )
            proxyReq.setHeader('Accept-Language', 'pl-PL,pl;q=0.9,en;q=0.8')
          })
        },
      },
      '/api/jina-reader': {
        target: 'https://r.jina.ai',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            const jinaKey = env.VITE_JINA_API_KEY
            if (jinaKey) {
              proxyReq.setHeader('Authorization', `Bearer ${jinaKey}`)
            }
          })
        },
      },
      '/api/fetch': {
        target: 'https://r.jina.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fetch\/?/, '/'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            const jinaKey = env.VITE_JINA_API_KEY
            if (jinaKey) {
              proxyReq.setHeader('Authorization', `Bearer ${jinaKey}`)
            }
          })
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  }
})
