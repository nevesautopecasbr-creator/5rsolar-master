import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as cookieParser from "cookie-parser";
import { join } from "node:path";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix("api");
  const envOrigins = [
    process.env.WEB_ORIGIN ?? "",
    ...(process.env.WEB_ORIGINS?.split(",") ?? []),
  ]
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedOrigins = new Set<string>([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
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
  SwaggerModule.setup("api/docs", app, document);

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port, "0.0.0.0");
}

bootstrap();
