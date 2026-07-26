import "dotenv/config";
import { buildApp } from "./app.ts";
import { config } from "./config.ts";
import { verifyCredentials, hasCredentials } from "./pinch.ts";

const app = buildApp();
const listen = (): void => {
  app.listen(config.port, () => console.log(`server on http://localhost:${config.port}`));
};

// the marketplace still runs without pinch keys — only checkout needs them, and a
// reviewer cloning this shouldn't get a dead backend before they can look around
if (!hasCredentials()) {
  console.warn("No PINCH_APP_ID / PINCH_SECRET — starting with payments disabled. See README.");
  listen();
} else {
  verifyCredentials()
    .then(() => {
      console.log("Pinch credentials OK");
      listen();
    })
    .catch((err: unknown) => {
      const reason = err instanceof Error ? err.message : String(err);
      console.error(`Pinch credentials FAILED: ${reason}`);
      console.error("Starting anyway with payments disabled — check the keys in .env");
      listen();
    });
}
