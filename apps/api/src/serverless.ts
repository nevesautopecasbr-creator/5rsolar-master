import { Request, Response } from "express";
import { createApp } from "./app.factory";

let cachedExpressApp: ((req: Request, res: Response) => void) | null = null;

async function getExpressApp(): Promise<(req: Request, res: Response) => void> {
  if (!cachedExpressApp) {
    const app = await createApp();
    const expressApp = app.getHttpAdapter().getInstance() as any;
    if (process.env.VERCEL && expressApp._router && Array.isArray(expressApp._router.stack)) {
      const Layer = require("express/lib/router/layer");
      let routesLogged = false;
      const logLayer = new (Layer as any)("*", {}, (req: any, _res: any, next: () => void) => {
        console.log("[Nest/Express] req.url=" + (req?.url ?? "") + " req.path=" + (req?.path ?? "") + " method=" + (req?.method ?? ""));
        if (!routesLogged && expressApp._router?.stack) {
          routesLogged = true;
          const paths = expressApp._router.stack.slice(0, 25).map((l: any, i: number) => i + ":" + (l.route ? l.route.path : l.regexp?.toString().slice(0, 60)));
          console.log("[Nest/Express] stack sample: " + paths.join(" | "));
        }
        next();
      });
      expressApp._router.stack.unshift(logLayer);
    }
    cachedExpressApp = expressApp;
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

