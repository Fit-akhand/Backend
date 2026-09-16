import mongoose from "mongoose";
import { ApiError } from "./ApiError.js";

export const requireObjectId = (value, name = "id") => {
  if (!value || !mongoose.isValidObjectId(value)) {
    throw new ApiError(400, `Invalid ${name}`);
  }
  return value;
};

export const parsePagination = (query = {}) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  let limit = Number.parseInt(query.limit, 10) || 10;
  if (!Number.isFinite(limit) || limit < 1) {
    limit = 10;
  }
  limit = Math.min(limit, 50);
  return { page, limit, skip: (page - 1) * limit };
};

export const escapeRegex = (text = "") =>
  String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const assertOwner = (
  ownerId,
  userId,
  message = "You are not authorized to perform this action"
) => {
  if (!ownerId || String(ownerId) !== String(userId)) {
    throw new ApiError(403, message);
  }
};

export const paginationMeta = (results, total, page, limit) => ({
  results,
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit) || 0,
  hasNextPage: page * limit < total,
  hasPreviousPage: page > 1,
});

export const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
