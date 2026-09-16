import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { env } from "../config/env.js";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 32,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
      index: true,
    },
    avatar: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "password is required"],
      select: false,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    passwordChangedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, env.bcryptRounds);
    if (!this.isNew) {
      this.passwordChangedAt = new Date();
    }
  }
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullname: this.fullname,
      pca: this.passwordChangedAt ? this.passwordChangedAt.getTime() : 0,
    },
    env.accessTokenSecret,
    {
      expiresIn: env.accessTokenExpiry,
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    env.refreshTokenSecret,
    {
      expiresIn: env.refreshTokenExpiry,
      jwtid: crypto.randomUUID(),
    }
  );
};

export const User = mongoose.model("User", userSchema);
