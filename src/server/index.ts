import { Hono } from "hono"
import { serve } from "@hono/node-server"
import { serveStatic } from "@hono/node-server/serve-static"
import { readFile } from "node:fs/promises"

let html = await readFile(import.meta.env.PROD ? "dist/index.html" : "index.html", "utf8")

if (!import.meta.env.PROD) {
  // Inject Vite client code to the HTML
  html = html.replace("<head>", `
    <script type="module">
      import RefreshRuntime from "/@react-refresh"
      RefreshRuntime.injectIntoGlobalHook(window)
      window.$RefreshReg$ = () => {}
      window.$RefreshSig$ = () => (type) => type
      window.__vite_plugin_react_preamble_installed__ = true
    </script>
    <script type="module" src="/@vite/client"></script>
    `)
}

const app = new Hono()
  .use("/assets/*", serveStatic({ root: import.meta.env.PROD ? "build/" : "./" })) // path must end with '/'
  .get("/*", c => c.html(html))

export default app

if (import.meta.env.PROD) {
  serve({ ...app, port: 3000 }, info => {
    console.log(`Listening on http://localhost:${info.port}`);
  });
}
