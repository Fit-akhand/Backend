import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireObjectId } from "../utils/http.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  requireObjectId(channelId, "channelId");

  if (String(channelId) === String(req.user._id)) {
    throw new ApiError(400, "Cannot subscribe to yourself");
  }

  const channel = await User.findById(channelId);
  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  const existing = await Subscription.findOne({
    subscriber: req.user._id,
    channel: channelId,
  });

  if (existing) {
    await existing.deleteOne();
    return res
      .status(200)
      .json(
        new ApiResponse(200, { subscribed: false }, "Unsubscribed successfully")
      );
  }

  try {
    await Subscription.create({
      subscriber: req.user._id,
      channel: channelId,
    });
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { subscribed: true }, "Subscribed successfully"));
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  requireObjectId(channelId, "channelId");

  const channel = await User.findById(channelId);
  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  const subscribers = await Subscription.find({ channel: channelId })
    .populate("subscriber", "username fullname avatar")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        subscribers: subscribers.map((item) => item.subscriber),
        subscriberCount: subscribers.length,
      },
      "Subscribers fetched successfully"
    )
  );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  requireObjectId(subscriberId, "subscriberId");

  const user = await User.findById(subscriberId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const subscriptions = await Subscription.find({ subscriber: subscriberId })
    .populate("channel", "username fullname avatar")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        channels: subscriptions.map((item) => item.channel),
        subscribedCount: subscriptions.length,
      },
      "Subscribed channels fetched successfully"
    )
  );
});

export {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels,
};
