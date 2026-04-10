/**
 * Origens do front permitidas em produção (CORS).
 * Alinhar com variáveis WEB_ORIGIN / WEB_ORIGINS no deploy.
 */
export function buildWebAllowedOrigins(): Set<string> {
  const envOrigins = [
    process.env.WEB_ORIGIN ?? "",
    ...(process.env.WEB_ORIGINS?.split(",") ?? []),
  ]
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Set<string>([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://web-5rsolar.vercel.app",
    ...envOrigins,
  ]);
}
