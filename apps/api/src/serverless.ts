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
 * Na Vercel, o rewrite envia "/(.*)" -> "/api?path=$1". Corrige req para o path real
 * antes de passar ao Express (req.query ainda não existe; parseamos req.url).
 */
function applyVercelPath(req: Request): void {
  const raw = (req as any).url || (req as any).originalUrl || "";
  const idx = raw.indexOf("?");
  const search = idx >= 0 ? raw.slice(idx) : "";
  const params = new URLSearchParams(search);
  const pathParam = params.get("path");
  const path =
    typeof pathParam === "string" && pathParam.trim()
      ? pathParam.startsWith("/")
        ? pathParam
        : `/${pathParam}`
      : null;
  if (path && path !== "/api") {
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
  }
}

/**
 * Handler para a Vercel (serverless). Corrige path quando vem em ?path= e encaminha ao Nest.
 */
export default async function handler(req: Request, res: Response): Promise<void> {
  if (process.env.VERCEL) applyVercelPath(req);
  const expressApp = await getExpressApp();
  expressApp(req, res);
}

