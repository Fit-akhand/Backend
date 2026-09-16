import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uplodeonCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getCookieOptions } from "../utils/cookieOptions.js";
import { isValidEmail } from "../utils/http.js";
import { hashToken, matchesStoredRefreshToken } from "../utils/tokens.js";
import { env } from "../config/env.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefressTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "user not exist");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = hashToken(refreshToken);
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      500,
      "something went wrong while generating access and refress token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, username, password } = req.body;

  if (
    [fullname, email, username, password].some(
      (field) => !field || field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  if (!isValidEmail(email)) {
    throw new ApiError(400, "Invalid email");
  }

  if (password.length < 8 || password.length > 128) {
    throw new ApiError(400, "Password must be between 8 and 128 characters");
  }

  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    throw new ApiError(409, "Username already exists");
  }

  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    throw new ApiError(409, "Email already exists");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar file is required");
  }

  const avatar = await uplodeonCloudinary(avatarLocalPath);
  const coverImage = await uplodeonCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registring a user");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { ...createdUser._doc },
        "user registered successfully"
      )
    );
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "username and email is required ");
  }

  if (!password) {
    throw new ApiError(400, "password is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  }).select("+password");

  if (!user) {
    throw new ApiError(404, "user not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(404, "Invalid user cradiantials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefressTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = getCookieOptions();

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User loggedIn successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = getCookieOptions();

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logedout Successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      env.refreshTokenSecret
    );

    const user = await User.findById(decodedToken?._id).select("+refreshToken");

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (!matchesStoredRefreshToken(incomingRefreshToken, user.refreshToken)) {
      throw new ApiError(401, "Refresh token expired or used");
    }

    const options = getCookieOptions();

    const { accessToken, refreshToken } = await generateAccessAndRefressTokens(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken,
          },
          "access token refresh successffuly"
        )
      );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "oldPassword and newPassword are required");
  }

  if (newPassword.length < 8 || newPassword.length > 128) {
    throw new ApiError(400, "Password must be between 8 and 128 characters");
  }

  const user = await User.findById(req.user?._id).select("+password +refreshToken");

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Innvalid old password");
  }

  user.password = newPassword;
  user.refreshToken = undefined;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password change successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user frtched successfuly"));
});

const updateAccountDetail = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!fullname || !email) {
    throw new ApiError(400, "All fields are require");
  }

  if (!isValidEmail(email)) {
    throw new ApiError(400, "Invalid email");
  }

  const emailTaken = await User.findOne({
    email: email.toLowerCase(),
    _id: { $ne: req.user?._id },
  });
  if (emailTaken) {
    throw new ApiError(409, "Email already exists");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = await uplodeonCloudinary(avatarLocalPath);

  if (!avatar?.url) {
    throw new ApiError(400, "ERROR While uplodind on cloudinary");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

const updateUserCoverimage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "CoverImage file is missing");
  }

  const coverImage = await uplodeonCloudinary(coverImageLocalPath);

  if (!coverImage?.url) {
    throw new ApiError(400, "ERROR While uplodind on cloudinary");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Coverimage updated successfully"));
});

const getUserChanelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "Username is missing");
  }

  const chanell = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscribers",
        },
        channelsubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: {
              $in: [req.user?._id || null, "$subscribers.subscriber"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscriberCount: 1,
        channelsubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: {
          $cond: {
            if: { $eq: ["$_id", req.user?._id || null] },
            then: "$email",
            else: "$$REMOVE",
          },
        },
      },
    },
  ]);

  if (!chanell?.length) {
    throw new ApiError(400, "chanell dosenot exists");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, chanell[0], "User chanell fetched successfuly"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $addFields: {
        watchHistory: { $slice: ["$watchHistory", 50] },
      },
    },
    {
      $lookup: {
        from: "videos",
        let: { historyIds: "$watchHistory" },
        pipeline: [
          { $match: { $expr: { $in: ["$_id", "$$historyIds"] } } },
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
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
        ],
        as: "watchHistoryDocs",
      },
    },
    {
      $addFields: {
        watchHistory: {
          $filter: {
            input: {
              $map: {
                input: "$watchHistory",
                as: "id",
                in: {
                  $first: {
                    $filter: {
                      input: "$watchHistoryDocs",
                      as: "video",
                      cond: { $eq: ["$$video._id", "$$id"] },
                    },
                  },
                },
              },
            },
            as: "video",
            cond: { $ne: ["$$video", null] },
          },
        },
      },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      user[0]?.watchHistory || [],
      "Watch history fetched successfuly"
    )
  );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetail,
  updateUserAvatar,
  updateUserCoverimage,
  getUserChanelProfile,
  getWatchHistory,
};
