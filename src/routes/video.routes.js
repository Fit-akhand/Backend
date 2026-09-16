import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
} from "../controllers/video.controller.js"
import {upload, uploadVideo} from "../middlewares/multer.middleware.js"
import {optionalJWT, verifyJWT} from "../middlewares/auth.middleware.js"
import {uploadLimiter} from "../middlewares/rateLimit.middleware.js"

const router = Router();

router
    .route("/")
    .get(optionalJWT, getAllVideos)
    .post(
        verifyJWT,
        uploadLimiter,
        uploadVideo.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
        ]),
        publishAVideo
    );

router
    .route("/:videoId")
    .get(optionalJWT, getVideoById)
    .delete(verifyJWT, deleteVideo)
    .patch(verifyJWT, uploadLimiter, upload.single("thumbnail"), updateVideo);

router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus);

export default router
