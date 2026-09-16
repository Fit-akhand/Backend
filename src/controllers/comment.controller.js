import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import {
  assertOwner,
  isNonEmptyString,
  parsePagination,
  requireObjectId,
} from "../utils/http.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  requireObjectId(videoId, "videoId");
  const { page, limit } = parsePagination(req.query);

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  if (!video.isPublished && String(video.owner) !== String(req.user._id)) {
    throw new ApiError(404, "Video not found");
  }

  const aggregate = Comment.aggregate([
    { $match: { video: new mongoose.Types.ObjectId(videoId) } },
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          { $project: { username: 1, fullname: 1, avatar: 1 } },
        ],
      },
    },
    { $addFields: { owner: { $first: "$owner" } } },
  ]);

  const result = await Comment.aggregatePaginate(aggregate, { page, limit });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        results: result.docs,
        page: result.page,
        limit: result.limit,
        total: result.totalDocs,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPreviousPage: result.hasPrevPage,
      },
      "Comments fetched successfully"
    )
  );
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  requireObjectId(videoId, "videoId");

  const { content } = req.body;
  if (!isNonEmptyString(content) || content.trim().length > 2000) {
    throw new ApiError(400, "content is required and must be at most 2000 characters");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  if (!video.isPublished && String(video.owner) !== String(req.user._id)) {
    throw new ApiError(404, "Video not found");
  }

  const comment = await Comment.create({
    content: content.trim(),
    video: videoId,
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  requireObjectId(commentId, "commentId");

  const { content } = req.body;
  if (!isNonEmptyString(content)) {
    throw new ApiError(400, "content is required");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }
  assertOwner(comment.owner, req.user._id);

  comment.content = content.trim();
  await comment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  requireObjectId(commentId, "commentId");

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }
  assertOwner(comment.owner, req.user._id);

  await comment.deleteOne();
  await Like.deleteMany({ comment: commentId });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
