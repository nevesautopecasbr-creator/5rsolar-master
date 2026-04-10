import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { buildWebAllowedOrigins } from "./cors-allowed-origins";

@Injectable()
export class CorsPreflightMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const allowed = buildWebAllowedOrigins();
    const origin = req.headers.origin as string | undefined;

    if (origin && allowed.has(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }

    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, x-company-id, Cookie",
    );
    res.setHeader("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }
    next();
  }
}
