export const config = {
  port: Number(process.env.PORT ?? 3001),
  // sqlite file; ":memory:" gives a throwaway db for tests
  databaseFile: process.env.DATABASE_FILE ?? "data/unitrade.db",
  // set JWT_SECRET in .env for anything that isn't a local run
  jwtSecret: process.env.JWT_SECRET ?? "unitrade-dev-secret-change-me",
};
