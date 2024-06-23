import { readFile } from 'node:fs/promises';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import 'dotenv/config';
import { authRoute } from './routes/auth';
import { getCookie, setCookie } from 'hono/cookie';
import { lucia } from './lucia';

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

const app = new Hono();

app.route('/api/auth', authRoute);
app.get('/api/profile', async (c) => {
  const sessionId = getCookie(c, lucia.sessionCookieName)
  if (sessionId) {
    const { user } = await lucia.validateSession(sessionId)
    if (user) {
      return c.json({
        email: user.email,
        username: user.username
      })
    }
    const blankSession = lucia.createBlankSessionCookie()
    setCookie(c, blankSession.name, blankSession.value)
  }
  return c.json(null)
})

app.use('/assets/*', serveStatic({ root: isProd ? 'build/' : './' }));
app.get('/*', (c) => c.html(html));

if (isProd) {
  serve({ ...app, port: 3000 }, (info) => {
    console.log(`Listening on http://localhost:${info.port}`);
  });
}
export default app;
