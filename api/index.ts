import express from 'express';
import { initDB } from '../server/db.js';
import routes from '../server/routes.js';

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(routes);

let dbInitialized = false;

const handler = async (req: any, res: any) => {
  if (!dbInitialized) {
    await initDB();
    dbInitialized = true;
  }
  return app(req, res);
};

export default handler;
