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
          const stack = expressApp._router.stack as any[];
          const paths = stack.slice(0, 60).map((l: any, i: number) => {
            const p = l.route ? l.route.path : (l.regexp && l.regexp.toString().slice(0, 50));
            return i + ":" + p;
          });
          console.log("[Nest/Express] stack(0-59): " + paths.join(" | "));
          const authIdx = stack.findIndex((l: any) => (l.route?.path || "").includes("auth"));
          console.log("[Nest/Express] first layer with 'auth': index=" + authIdx + " path=" + (stack[authIdx]?.route?.path ?? stack[authIdx]?.regexp?.toString().slice(0, 80)));
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

