import { Request, Response } from "express";
import { createApp } from "./app.factory";

let cachedExpressApp: ((req: Request, res: Response) => void) | null = null;

async function getExpressApp(): Promise<(req: Request, res: Response) => void> {
  if (!cachedExpressApp) {
    const app = await createApp();
    cachedExpressApp = app.getHttpAdapter().getInstance();
  }
  return cachedExpressApp;
}

/**
 * Handler para a Vercel (serverless). Encaminha req/res para o app Express do Nest.
 */
export default async function handler(req: Request, res: Response): Promise<void> {
  const expressApp = await getExpressApp();
  expressApp(req, res);
}

