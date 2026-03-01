import express from 'express';
import { initDB } from '../server/db.js';
import routes from '../server/routes.js';

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(routes);

let dbInitialized = false;
let dbInitPromise: Promise<void> | null = null;

const handler = async (req: any, res: any) => {
  if (!dbInitialized) {
    if (!dbInitPromise) {
      dbInitPromise = initDB().then(() => { dbInitialized = true; }).catch((err) => { dbInitPromise = null; throw err; });
    }
    await dbInitPromise;
  }
  return new Promise((resolve) => {
    app(req, res, () => { resolve(undefined); });
  });
};

export default handler;
