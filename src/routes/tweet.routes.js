import { Router } from 'express';
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
} from "../controllers/tweet.controller.js"
import {optionalJWT, verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.route("/").post(verifyJWT, createTweet);
router.route("/user/:userId").get(optionalJWT, getUserTweets);
router.route("/:tweetId").patch(verifyJWT, updateTweet).delete(verifyJWT, deleteTweet);

export default router
