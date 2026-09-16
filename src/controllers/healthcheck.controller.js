import mongoose from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const healthcheck = asyncHandler(async (req, res) => {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  const readyState = mongoose.connection.readyState;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        status: "OK",
        database: states[readyState] || "unknown",
      },
      "API is healthy"
    )
  );
});

const readiness = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    throw new ApiError(503, "Database is not ready");
  }

  return res.status(200).json(
    new ApiResponse(200, { status: "READY", database: "connected" }, "API is ready")
  );
});

export { healthcheck, readiness };
