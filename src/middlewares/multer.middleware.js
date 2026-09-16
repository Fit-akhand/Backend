import fs from "fs";
import path from "path";
import multer from "multer";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

const safeName = (originalname) => {
  const base = path.basename(originalname || "file").replace(/[^A-Za-z0-9._-]/g, "_");
  return `${Date.now()}-${base.slice(0, 80)}`;
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dest = "./public/temp";
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    cb(null, safeName(file.originalname));
  },
});

const fileFilter = (allowed) => (req, file, cb) => {
  if (allowed.has(file.mimetype)) {
    cb(null, true);
    return;
  }
  cb(new ApiError(400, `Unsupported file type: ${file.mimetype || "unknown"}`));
};

export const upload = multer({
  storage,
  limits: { fileSize: env.maxImageBytes, files: 4 },
  fileFilter: fileFilter(IMAGE_TYPES),
});

export const uploadVideo = multer({
  storage,
  limits: { fileSize: env.maxVideoBytes, files: 2 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "thumbnail") {
      return fileFilter(IMAGE_TYPES)(req, file, cb);
    }
    return fileFilter(VIDEO_TYPES)(req, file, cb);
  },
});
