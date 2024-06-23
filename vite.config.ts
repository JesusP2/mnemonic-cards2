import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import devServer from '@hono/vite-dev-server'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3000
  },
  plugins: [react(), devServer({
    entry: './src/server/index.ts',
    exclude: [ // We need to override this option since the default setting doesn't fit
            /.*\.tsx?($|\?)/,
            /.*\.(s?css|less)($|\?)/,
            /.*\.(svg|png)($|\?)/,
            /^\/@.+$/,
            /^\/favicon\.ico$/,
            /^\/(public|assets|static)\/.+/,
            /^\/node_modules\/.*/
        ],
  })],
})
