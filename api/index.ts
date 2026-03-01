import express from 'express';
import { initDB } from '../server/db.js';
import routes from '../server/routes.js';

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(routes);

let dbInitialized = false;
let dbInitPromise: Promise<void> | null = null;

export default async function handler(req: any, res: any) {
  try {
    if (!dbInitialized) {
      if (!dbInitPromise) {
        dbInitPromise = initDB()
          .then(() => { dbInitialized = true; })
          .catch((err) => { dbInitPromise = null; throw err; });
      }
      await dbInitPromise;
    }
    await new Promise<void>((resolve, reject) => {
      app(req, res, (err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
  } catch (err: any) {
    console.error('Handler error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  }
}
