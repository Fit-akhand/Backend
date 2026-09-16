import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema(
  {
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
    },
    tweet: {
      type: Schema.Types.ObjectId,
      ref: "Tweet",
    },
    likedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

likeSchema.index(
  { video: 1, likedBy: 1 },
  { unique: true, partialFilterExpression: { video: { $type: "objectId" } } }
);
likeSchema.index(
  { comment: 1, likedBy: 1 },
  { unique: true, partialFilterExpression: { comment: { $type: "objectId" } } }
);
likeSchema.index(
  { tweet: 1, likedBy: 1 },
  { unique: true, partialFilterExpression: { tweet: { $type: "objectId" } } }
);

export const Like = mongoose.model("Like", likeSchema);
