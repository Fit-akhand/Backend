import { Tweet } from "../models/tweet.model.js";
import { Like } from "../models/like.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  assertOwner,
  isNonEmptyString,
  paginationMeta,
  parsePagination,
  requireObjectId,
} from "../utils/http.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!isNonEmptyString(content) || content.trim().length > 280) {
    throw new ApiError(400, "content is required and must be at most 280 characters");
  }

  const tweet = await Tweet.create({
    content: content.trim(),
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, tweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  requireObjectId(userId, "userId");
  const { page, limit, skip } = parsePagination(req.query);

  const owner = await User.findById(userId);
  if (!owner) {
    throw new ApiError(404, "User not found");
  }

  const filter = { owner: userId };
  const total = await Tweet.countDocuments(filter);
  const tweets = await Tweet.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("owner", "username fullname avatar");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        paginationMeta(tweets, total, page, limit),
        "Tweets fetched successfully"
      )
    );
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  requireObjectId(tweetId, "tweetId");

  const { content } = req.body;
  if (!isNonEmptyString(content) || content.trim().length > 280) {
    throw new ApiError(400, "content is required and must be at most 280 characters");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }
  assertOwner(tweet.owner, req.user._id);

  tweet.content = content.trim();
  await tweet.save();

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  requireObjectId(tweetId, "tweetId");

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }
  assertOwner(tweet.owner, req.user._id);

  await tweet.deleteOne();
  await Like.deleteMany({ tweet: tweetId });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
