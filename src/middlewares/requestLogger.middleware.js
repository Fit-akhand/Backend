import { logger } from "../utils/logger.js";

export const requestLogger = (req, res, next) => {
  const started = Date.now();
  res.on("finish", () => {
    if (process.env.NODE_ENV === "test") {
      return;
    }
    logger.info("http_request", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl?.split("?")[0],
      status: res.statusCode,
      durationMs: Date.now() - started,
      userId: req.user?._id ? String(req.user._id) : undefined,
    });
  });
  next();
};
