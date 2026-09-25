import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// En desarrollo (npm run dev) este plugin ejecuta las funciones de /api
// igual que lo hace Vercel en producción, así no necesitas nada extra para probar.
function devApi() {
  return {
    name: 'bitacora-dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/')) return next();
        const name = req.url.slice(5).split('?')[0].replace(/\/$/, '');
        if (!/^[a-z-]+$/.test(name)) return next();
        try {
          const mod = await server.ssrLoadModule(`/api/${name}.js`);
          await mod.default(req, res);
        } catch (e) {
          console.error(e);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: e.message }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));
  return {
    plugins: [react(), devApi()],
  };
});
