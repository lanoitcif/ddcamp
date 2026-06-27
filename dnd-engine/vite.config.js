import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Non-VITE_ name keeps the key out of import.meta.env / the browser bundle.
  const LITELLM_KEY = env.LITELLM_KEY || ''

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      proxy: {
        // Legacy Ollama native-format proxy (kept for compatibility)
        '/api/ollama': {
          target: 'http://127.0.0.1:11434',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/ollama/, ''),
        },
        // LiteLLM OpenAI-compatible proxy — key injected here, never in browser
        '/api/llm': {
          target: 'http://127.0.0.1:4000',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/llm/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('Authorization', `Bearer ${LITELLM_KEY}`);
            });
          },
        },
        // Kokoro local TTS proxy
        '/api/tts': {
          target: 'http://127.0.0.1:8880',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/tts/, ''),
        },
      },
    },
  }
})
