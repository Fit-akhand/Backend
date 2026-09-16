import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

const skipInTest = () => env.isTest;

export const generalLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: {
    statusCode: 429,
    data: null,
    success: false,
    message: "Too many requests",
    errors: [],
  },
});

export const authLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: {
    statusCode: 429,
    data: null,
    success: false,
    message: "Too many authentication attempts",
    errors: [],
  },
});

export const uploadLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.uploadRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: {
    statusCode: 429,
    data: null,
    success: false,
    message: "Too many uploads",
    errors: [],
  },
});
