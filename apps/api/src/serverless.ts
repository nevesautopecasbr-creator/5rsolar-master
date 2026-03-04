import { Request, Response } from "express";
import { createApp } from "./app.factory";

let cachedExpressApp: ((req: Request, res: Response) => void) | null = null;

async function getExpressApp(): Promise<(req: Request, res: Response) => void> {
  if (!cachedExpressApp) {
    const app = await createApp();
    cachedExpressApp = app.getHttpAdapter().getInstance();
  }
  return cachedExpressApp!;
}

/**
 * Handler Vercel: rewrite "/(.*)" -> "/api?path=$1".
 * Middleware injetado no início da pilha corrige req antes do roteador.
 */
export default function handler(req: Request, res: Response): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    res.on("finish", () => resolve());
    res.on("error", reject);
    getExpressApp()
      .then((expressApp) => expressApp(req, res))
      .catch(reject);
  });
}

