import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { assertOwner, isNonEmptyString, requireObjectId } from "../utils/http.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!isNonEmptyString(name) || !isNonEmptyString(description)) {
    throw new ApiError(400, "name and description are required");
  }

  const playlist = await Playlist.create({
    name: name.trim(),
    description: description.trim(),
    owner: req.user._id,
    videos: [],
  });

  return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  requireObjectId(userId, "userId");

  const owner = await User.findById(userId);
  if (!owner) {
    throw new ApiError(404, "User not found");
  }

  const playlists = await Playlist.find({ owner: userId }).sort({
    createdAt: -1,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, playlists, "Playlists fetched successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  requireObjectId(playlistId, "playlistId");

  const playlist = await Playlist.findById(playlistId)
    .populate({
      path: "videos",
      populate: { path: "owner", select: "username fullname avatar" },
    })
    .populate("owner", "username fullname avatar");

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  const isOwner = String(playlist.owner._id) === String(req.user._id);
  if (!isOwner) {
    playlist.videos = playlist.videos.filter(
      (video) => video && video.isPublished
    );
  } else {
    playlist.videos = playlist.videos.filter(Boolean);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  requireObjectId(playlistId, "playlistId");
  requireObjectId(videoId, "videoId");

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  assertOwner(playlist.owner, req.user._id);

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const updated = await Playlist.findByIdAndUpdate(
    playlistId,
    { $addToSet: { videos: videoId } },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Video added to playlist"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  requireObjectId(playlistId, "playlistId");
  requireObjectId(videoId, "videoId");

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  assertOwner(playlist.owner, req.user._id);

  const updated = await Playlist.findByIdAndUpdate(
    playlistId,
    { $pull: { videos: videoId } },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Video removed from playlist"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  requireObjectId(playlistId, "playlistId");

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  assertOwner(playlist.owner, req.user._id);

  await playlist.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  requireObjectId(playlistId, "playlistId");

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  assertOwner(playlist.owner, req.user._id);

  const { name, description } = req.body;
  const updates = {};
  if (name !== undefined) {
    if (!isNonEmptyString(name)) {
      throw new ApiError(400, "name cannot be empty");
    }
    updates.name = name.trim();
  }
  if (description !== undefined) {
    if (!isNonEmptyString(description)) {
      throw new ApiError(400, "description cannot be empty");
    }
    updates.description = description.trim();
  }

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, "No valid fields to update");
  }

  const updated = await Playlist.findByIdAndUpdate(
    playlistId,
    { $set: updates },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Playlist updated successfully"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
