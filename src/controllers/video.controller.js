import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {
  assertOwner,
  escapeRegex,
  isNonEmptyString,
  parsePagination,
  requireObjectId,
} from "../utils/http.js";

const ownerLookup = [
  {
    $lookup: {
      from: "users",
      localField: "owner",
      foreignField: "_id",
      as: "owner",
      pipeline: [
        {
          $project: {
            username: 1,
            fullname: 1,
            avatar: 1,
          },
        },
      ],
    },
  },
  {
    $addFields: {
      owner: { $first: "$owner" },
    },
  },
];

const getAllVideos = asyncHandler(async (req, res) => {
  const { query, sortBy = "createdAt", sortType = "desc", userId } = req.query;
  const { page, limit } = parsePagination(req.query);

  const sortFields = {
    createdAt: "createdAt",
    views: "views",
    title: "title",
    duration: "duration",
  };
  const sortField = sortFields[sortBy] || "createdAt";
  const sortOrder = String(sortType).toLowerCase() === "asc" ? 1 : -1;

  const match = {};

  if (userId) {
    requireObjectId(userId, "userId");
    match.owner = new mongoose.Types.ObjectId(userId);
    if (!req.user || String(userId) !== String(req.user._id)) {
      match.isPublished = true;
    }
  } else {
    match.isPublished = true;
  }

  if (query && typeof query === "string" && query.trim()) {
    const term = query.trim().slice(0, 100);
    if (term.length >= 2) {
      match.$text = { $search: term };
    }
  }

  const runQuery = (matchStage) => {
    const aggregate = Video.aggregate([
      { $match: matchStage },
      { $sort: { [sortField]: sortOrder } },
      ...ownerLookup,
    ]);
    return Video.aggregatePaginate(aggregate, { page, limit });
  };

  let result;
  try {
    result = await runQuery(match);
  } catch (error) {
    if (!match.$text) {
      throw error;
    }
    const term = String(query).trim().slice(0, 100);
    const { $text, ...rest } = match;
    rest.$or = [
      { title: { $regex: escapeRegex(term), $options: "i" } },
      { description: { $regex: escapeRegex(term), $options: "i" } },
    ];
    result = await runQuery(rest);
  }

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
      "Videos fetched successfully"
    )
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (title !== undefined && title.trim().length > 200) {
    throw new ApiError(400, "title is too long");
  }
  if (description !== undefined && description.trim().length > 5000) {
    throw new ApiError(400, "description is too long");
  }

  if (!isNonEmptyString(title) || !isNonEmptyString(description)) {
    throw new ApiError(400, "title and description are required");
  }

  const videoLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoLocalPath) {
    throw new ApiError(400, "videoFile is required");
  }
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "thumbnail is required");
  }

  const uploadedVideo = await uploadOnCloudinary(videoLocalPath);
  const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!uploadedVideo?.url) {
    throw new ApiError(400, "Error while uploading video");
  }
  if (!uploadedThumbnail?.url) {
    throw new ApiError(400, "Error while uploading thumbnail");
  }

  const video = await Video.create({
    title: title.trim(),
    description: description.trim(),
    videoFile: uploadedVideo.url,
    thumbnail: uploadedThumbnail.url,
    duration: uploadedVideo.duration || 0,
    owner: req.user._id,
    isPublished: true,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, video, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  requireObjectId(videoId, "videoId");

  const video = await Video.findById(videoId).populate(
    "owner",
    "username fullname avatar"
  );

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (
    !video.isPublished &&
    String(video.owner._id) !== String(req.user?._id)
  ) {
    throw new ApiError(404, "Video not found");
  }

  await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });

  if (req.user?._id) {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { watchHistory: video._id },
    });
    await User.findByIdAndUpdate(req.user._id, {
      $push: { watchHistory: { $each: [video._id], $position: 0 } },
    });
  }

  video.views += 1;

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  requireObjectId(videoId, "videoId");

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  assertOwner(video.owner, req.user._id);

  const { title, description } = req.body;
  const updates = {};

  if (title !== undefined) {
    if (!isNonEmptyString(title)) {
      throw new ApiError(400, "title cannot be empty");
    }
    updates.title = title.trim();
  }
  if (description !== undefined) {
    if (!isNonEmptyString(description)) {
      throw new ApiError(400, "description cannot be empty");
    }
    updates.description = description.trim();
  }

  if (req.file?.path) {
    const thumbnail = await uploadOnCloudinary(req.file.path);
    if (!thumbnail?.url) {
      throw new ApiError(400, "Error while uploading thumbnail");
    }
    updates.thumbnail = thumbnail.url;
  }

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, "No valid fields to update");
  }

  const updated = await Video.findByIdAndUpdate(
    videoId,
    { $set: updates },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  requireObjectId(videoId, "videoId");

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  assertOwner(video.owner, req.user._id);

  await Video.findByIdAndDelete(videoId);
  await Comment.deleteMany({ video: videoId });
  await Like.deleteMany({ video: videoId });
  await Playlist.updateMany({}, { $pull: { videos: videoId } });
  await User.updateMany({}, { $pull: { watchHistory: videoId } });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  requireObjectId(videoId, "videoId");

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  assertOwner(video.owner, req.user._id);

  video.isPublished = !video.isPublished;
  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Publish status toggled successfully"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
