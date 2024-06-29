import { readFile } from 'node:fs/promises';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import 'dotenv/config';
import { getCookie, setCookie } from 'hono/cookie';
import type { Session, User } from 'lucia';
import { lucia } from './lucia';
import { authRoute } from './routes/auth';
import { checkUserLogin } from './utils';

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

declare module 'hono' {
  interface ContextVariableMap {
    user: User | null;
    session: Session | null;
  }
}
const app = new Hono();
app.use;
app.use(async (c, next) => {
  const isUserLoggedIn = await checkUserLogin(c);
  if (isUserLoggedIn.success) {
    c.set('session', isUserLoggedIn.data.session);
    c.set('user', isUserLoggedIn.data.user);
  } else {
    c.set('session', null);
    c.set('user', null);
  }
  return next();
});
app.route('/api/auth', authRoute);
app.get('/api/profile', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json(null);
  }
  return c.json({
    email: user.email,
    username: user.username,
  });
});

app.use('/assets/*', serveStatic({ root: isProd ? 'build/' : './' }));
app.get('/*', (c) => c.html(html));

if (isProd) {
  serve({ ...app, port: 3000 }, (info) => {
    console.log(`Listening on http://localhost:${info.port}`);
  });
}
export default app;
