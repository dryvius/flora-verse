import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    environment: 'node',
    setupFiles: ['./src/test/setup-uni.ts'],
    include: ['src/**/*.spec.ts'],
    env: {
      VITE_DATA_SOURCE: 'mock',
      VITE_API_BASE_URL: 'http://192.168.22.54:3000'
    }
  }
})
