import { Request, Response } from "express";
import { createApp } from "./app.factory";

let cachedExpressApp: ((req: Request, res: Response) => void) | null = null;

/** Lê path da query em req.url (rewrite Vercel: /api?path=/api/auth/login) */
function getPathFromQuery(rawUrl: string): string | null {
  const idx = rawUrl.indexOf("?");
  const search = idx >= 0 ? rawUrl.slice(idx) : "";
  const pathParam = new URLSearchParams(search).get("path");
  if (typeof pathParam !== "string" || !pathParam.trim()) return null;
  return pathParam.startsWith("/") ? pathParam : `/${pathParam}`;
}

/**
 * Middleware que roda PRIMEIRO na pilha Express: corrige req.url/originalUrl/path
 * a partir de ?path= (rewrite Vercel). Assim o roteador Nest vê o path correto.
 */
function vercelPathMiddleware(req: Request, _res: Response, next: () => void): void {
  if (!process.env.VERCEL) return next();
  const raw = (req as any).url ?? (req as any).originalUrl ?? "";
  const path = getPathFromQuery(raw);
  if (!path || path === "/api") return next();
  const pathOnly = path.includes("?") ? path.slice(0, path.indexOf("?")) : path;
  const def = (obj: any, key: string, value: string) => {
    try {
      Object.defineProperty(obj, key, { value, configurable: true, writable: true });
    } catch {
      (obj as any)[key] = value;
    }
  };
  def(req, "url", path);
  def(req, "originalUrl", path);
  def(req, "path", pathOnly);
  delete (req as any)._parsedUrl;
  delete (req as any)._parsedOriginalUrl;
  next();
}

async function getExpressApp(): Promise<(req: Request, res: Response) => void> {
  if (!cachedExpressApp) {
    const app = await createApp();
    const expressApp = app.getHttpAdapter().getInstance() as any;
    if (process.env.VERCEL && expressApp._router && Array.isArray(expressApp._router.stack)) {
      const Layer = require("express/lib/router/layer");
      const layer = new (Layer as any)("*", {}, vercelPathMiddleware);
      expressApp._router.stack.unshift(layer);
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

