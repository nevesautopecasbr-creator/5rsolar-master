import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as cookieParser from "cookie-parser";
import { join } from "node:path";
import { AppModule } from "./app.module";

/**
 * Cria a aplicação NestJS com toda a configuração (CORS, pipes, Swagger).
 * Usado por main.ts (local) e pelo entrypoint serverless (Vercel).
 * Na Vercel, o path (rewrite ?path=) é corrigido em serverless.ts antes do Express.
 */
export async function createApp(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Na Vercel o path chega sem prefixo no req (api/index.js repassa /auth/login); localmente usa /api.
  app.setGlobalPrefix(process.env.VERCEL ? "" : "api");

  const envOrigins = [
    process.env.WEB_ORIGIN ?? "",
    ...(process.env.WEB_ORIGINS?.split(",") ?? []),
  ]
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedOrigins = new Set<string>([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://5rsolar-web.vercel.app",
    ...envOrigins,
  ]);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      if (process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-company-id", "Cookie"],
  });
  app.use(cookieParser());
  app.useStaticAssets(join(process.cwd(), process.env.STORAGE_LOCAL_DIR ?? "uploads"), {
    prefix: "/uploads",
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle("ERP Energia Solar")
    .setDescription("API ERP - Projetos/Obras e Financeiro por projeto")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(process.env.VERCEL ? "docs" : "api/docs", app, document);

  return app;
}
