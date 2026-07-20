import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'

const packageVersion = JSON.parse(
    readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version: string }

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    define: {
        'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageVersion.version),
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ''),
            },
            '/playback': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
        },
    },
})
