import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { env } from "../config/env.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(token, env.accessTokenSecret);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    if (user.passwordChangedAt) {
      const pca = user.passwordChangedAt.getTime();
      if (decodedToken.pca !== pca) {
        throw new ApiError(401, "Invalid access token");
      }
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, "Invalid access token");
  }
});

/** Attach req.user when a valid token is present; otherwise continue as a guest. */
export const optionalJWT = asyncHandler(async (req, _, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decodedToken = jwt.verify(token, env.accessTokenSecret);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      req.user = null;
      return next();
    }
    if (user.passwordChangedAt) {
      const pca = user.passwordChangedAt.getTime();
      if (decodedToken.pca !== pca) {
        req.user = null;
        return next();
      }
    }
    req.user = user;
  } catch {
    req.user = null;
  }
  next();
});
