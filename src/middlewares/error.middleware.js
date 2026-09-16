import { logger } from "../utils/logger.js";

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || "Something Went Wrong";
  let errors = err.errors || [];
  let errorCode = err.errorCode || "INTERNAL_ERROR";

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
    errorCode = "VALIDATION_ERROR";
    errors = Object.values(err.errors || {}).map((item) => item.message);
  }

  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID";
    errorCode = "VALIDATION_ERROR";
  }

  if (err.code === 11000) {
    statusCode = 409;
    message = "Duplicate value";
    errorCode = "CONFLICT";
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 400;
    message = "File too large";
    errorCode = "VALIDATION_ERROR";
  }

  const hideDetails = process.env.NODE_ENV === "production" && statusCode >= 500;

  logger.error("request_failed", {
    requestId: req.requestId,
    statusCode,
    errorCode,
    errorMessage: hideDetails ? "Something Went Wrong" : message,
    userId: req.user?._id ? String(req.user._id) : undefined,
  });

  const payload = {
    statusCode,
    data: null,
    success: false,
    message: hideDetails ? "Something Went Wrong" : message,
    errors,
    errorCode,
    requestId: req.requestId,
  };

  if (process.env.NODE_ENV === "development" && err.stack) {
    payload.stack = err.stack;
  }

  return res.status(statusCode).json(payload);
};

export { errorHandler };
