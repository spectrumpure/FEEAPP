import express from 'express';
import { createServer as createViteServer } from 'vite';
import { initDB } from './db.js';
import routes from './routes.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  await initDB();

  const app = express();
  app.use(express.json({ limit: '50mb' }));

  app.use(routes);

  app.use(express.static(path.join(__dirname, '..', 'public')));

  const isProduction = process.env.NODE_ENV === 'production' || process.env.REPL_DEPLOYMENT === '1';

  if (isProduction) {
    app.use(express.static(path.join(__dirname, '..', 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const PORT = 5000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);
