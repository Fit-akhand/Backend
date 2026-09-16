import { env } from "./config/env.js";
import connentDB from "./db/index.js";
import { app } from "./app.js";
import { logger } from "./utils/logger.js";
import mongoose from "mongoose";

const start = async () => {
  await connentDB();

  const server = app.listen(env.port, () => {
    logger.info("server_listening", { port: env.port, env: env.nodeEnv });
  });

  const shutdown = async (signal) => {
    logger.info("shutdown_start", { signal });
    server.close(async () => {
      await mongoose.disconnect();
      logger.info("shutdown_complete", { signal });
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

start().catch((err) => {
  logger.error("startup_failed", { message: err.message });
  process.exit(1);
});
