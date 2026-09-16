import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { parsePagination, paginationMeta, requireObjectId } from "../utils/http.js";

const toggleResourceLike = async ({ userId, filter, exists }) => {
  if (!exists) {
    throw new ApiError(404, "Resource not found");
  }

  const existing = await Like.findOne({ ...filter, likedBy: userId });
  if (existing) {
    await existing.deleteOne();
    return { liked: false };
  }

  try {
    await Like.create({ ...filter, likedBy: userId });
    return { liked: true };
  } catch (error) {
    if (error.code === 11000) {
      return { liked: true };
    }
    throw error;
  }
};

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  requireObjectId(videoId, "videoId");

  const video = await Video.findById(videoId);
  const canSee =
    video &&
    (video.isPublished || String(video.owner) === String(req.user._id));
  const result = await toggleResourceLike({
    userId: req.user._id,
    filter: { video: videoId },
    exists: Boolean(canSee),
  });

  const likes = await Like.countDocuments({ video: videoId });

  return res
    .status(200)
    .json(new ApiResponse(200, { ...result, likes }, "Video like toggled"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  requireObjectId(commentId, "commentId");

  const comment = await Comment.findById(commentId);
  const result = await toggleResourceLike({
    userId: req.user._id,
    filter: { comment: commentId },
    exists: Boolean(comment),
  });

  const likes = await Like.countDocuments({ comment: commentId });

  return res
    .status(200)
    .json(new ApiResponse(200, { ...result, likes }, "Comment like toggled"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  requireObjectId(tweetId, "tweetId");

  const tweet = await Tweet.findById(tweetId);
  const result = await toggleResourceLike({
    userId: req.user._id,
    filter: { tweet: tweetId },
    exists: Boolean(tweet),
  });

  const likes = await Like.countDocuments({ tweet: tweetId });

  return res
    .status(200)
    .json(new ApiResponse(200, { ...result, likes }, "Tweet like toggled"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);

  const filter = { likedBy: req.user._id, video: { $exists: true, $ne: null } };
  const total = await Like.countDocuments(filter);

  const likes = await Like.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate({
      path: "video",
      populate: { path: "owner", select: "username fullname avatar" },
    });

  const results = likes
    .map((like) => like.video)
    .filter((video) => video && video.isPublished);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        paginationMeta(results, total, page, limit),
        "Liked videos fetched successfully"
      )
    );
});

export {
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
  getLikedVideos,
};
