import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { parsePagination, paginationMeta } from "../utils/http.js";

const getChannelStats = asyncHandler(async (req, res) => {
  const ownerId = new mongoose.Types.ObjectId(req.user._id);

  const [videoStats] = await Video.aggregate([
    { $match: { owner: ownerId } },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "video",
        as: "comments",
      },
    },
    {
      $group: {
        _id: null,
        totalVideos: { $sum: 1 },
        totalViews: { $sum: "$views" },
        totalLikes: { $sum: { $size: "$likes" } },
        totalComments: { $sum: { $size: "$comments" } },
      },
    },
  ]);

  const totalSubscribers = await Subscription.countDocuments({
    channel: ownerId,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalVideos: videoStats?.totalVideos || 0,
        totalViews: videoStats?.totalViews || 0,
        totalLikes: videoStats?.totalLikes || 0,
        totalComments: videoStats?.totalComments || 0,
        totalSubscribers,
      },
      "Channel stats fetched successfully"
    )
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = { owner: req.user._id };
  const total = await Video.countDocuments(filter);
  const videos = await Video.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        paginationMeta(videos, total, page, limit),
        "Channel videos fetched successfully"
      )
    );
});

export { getChannelStats, getChannelVideos };
