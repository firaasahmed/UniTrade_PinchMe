const isProduction = process.env.NODE_ENV === "production";

// in production a real secret is required — a predictable one lets anyone forge a session
function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (isProduction) {
    throw new Error(
      "JWT_SECRET must be set to at least 16 characters in production — refusing to start",
    );
  }
  return "unitrade-dev-secret-change-me";
}

export const config = {
  isProduction,
  // API_PORT wins in dev so a tool that injects PORT for the browser can't take the api's
  // port from it; hosting platforms set PORT and that still works in production
  port: Number(process.env.API_PORT ?? process.env.PORT ?? 3001),
  // sqlite file; ":memory:" gives a throwaway db for tests
  databaseFile: process.env.DATABASE_FILE ?? "data/unitrade.db",
  jwtSecret: jwtSecret(),
  // comma separated; empty means same-origin only, which is how the deployed build runs
  corsOrigins: (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};
