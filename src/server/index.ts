import { readFile } from 'node:fs/promises';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import 'dotenv/config'
import { authRoute } from './routes/auth';

const isProd = process.env.NODE_ENV === 'production';
let html = await readFile(isProd ? 'build/index.html' : 'index.html', 'utf8');
if (!isProd) {
  html = html.replace(
    '<head>',
    `
    <script type="module">
      import RefreshRuntime from "/@react-refresh"
      RefreshRuntime.injectIntoGlobalHook(window)
      window.$RefreshReg$ = () => {}
      window.$RefreshSig$ = () => (type) => type
      window.__vite_plugin_react_preamble_installed__ = true
    </script>
    <script type="module" src="/@vite/client"></script>
    `,
  );
}

const app = new Hono()

app.route('/api/auth', authRoute)
app.use('/assets/*', serveStatic({ root: isProd ? 'build/' : './' }))
  .get('/*', (c) => c.html(html));


if (isProd) {
  serve({ ...app, port: 3000 }, (info) => {
    console.log(`Listening on http://localhost:${info.port}`);
  });
}
export default app;
