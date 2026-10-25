import type { Request, Response } from 'express';
import { createApp } from '../server/dist/app.js';

let appInstance: any = null;

function getApp() {
  if (!appInstance) {
    appInstance = createApp();
  }
  return appInstance;
}

export default function handler(req: Request, res: Response) {
  const app = getApp();
  return app(req, res);
}
