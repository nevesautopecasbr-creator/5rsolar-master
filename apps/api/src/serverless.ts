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

/** Lê path da query em req.url (rewrite Vercel: /api?path=/api/auth/login) */
function getPathFromReq(req: Request): string | null {
  const raw = (req as any).url ?? (req as any).originalUrl ?? "";
  const idx = raw.indexOf("?");
  const search = idx >= 0 ? raw.slice(idx) : "";
  const pathParam = new URLSearchParams(search).get("path");
  if (typeof pathParam !== "string" || !pathParam.trim()) return null;
  return pathParam.startsWith("/") ? pathParam : `/${pathParam}`;
}

/**
 * Envolve req em um Proxy que sempre devolve o path real em url/originalUrl/path.
 * Assim o Express/Nest faz match da rota correta (ex.: POST /api/auth/login).
 */
function wrapReqWithPath(req: Request, path: string): Request {
  const pathOnly = path.includes("?") ? path.slice(0, path.indexOf("?")) : path;
  return new Proxy(req, {
    get(target: any, prop: string | symbol) {
      if (prop === "url") return path;
      if (prop === "originalUrl") return path;
      if (prop === "path") return pathOnly;
      return target[prop];
    },
  }) as Request;
}

/**
 * Handler Vercel: rewrite envia "/(.*)" -> "/api?path=$1".
 * Repassamos um req com path correto (Proxy) para o Nest.
 * A Promise só resolve quando a resposta terminar (res.finish), para a Vercel não encerrar cedo.
 */
export default function handler(req: Request, res: Response): Promise<void> {
  const path = process.env.VERCEL ? getPathFromReq(req) : null;
  const reqToUse =
    path && path !== "/api" ? wrapReqWithPath(req, path) : req;
  return new Promise<void>((resolve, reject) => {
    res.on("finish", () => resolve());
    res.on("error", reject);
    getExpressApp()
      .then((expressApp) => {
        expressApp(reqToUse, res);
      })
      .catch(reject);
  });
}

