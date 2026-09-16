import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
  timeout: 60000,
});

const removeLocalFile = (localfilepath) => {
  if (localfilepath && fs.existsSync(localfilepath)) {
    fs.unlinkSync(localfilepath);
  }
};

const uplodeonCloudinary = async (localfilepath) => {
  try {
    if (!localfilepath) return null;

    if (env.isTest) {
      removeLocalFile(localfilepath);
      return {
        url: `http://localhost/test/${encodeURIComponent(localfilepath)}`,
        public_id: "test-public-id",
        duration: 12.5,
      };
    }

    const response = await cloudinary.uploader.upload(localfilepath, {
      resource_type: "auto",
      timeout: 60000,
    });

    removeLocalFile(localfilepath);
    return response;
  } catch (error) {
    logger.error("cloudinary_upload_failed", { message: error?.message });
    removeLocalFile(localfilepath);
    return null;
  }
};

export { uplodeonCloudinary, uplodeonCloudinary as uploadOnCloudinary };
