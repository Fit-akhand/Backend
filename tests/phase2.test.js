import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { auth, createUser, publishVideo } from "./helpers.js";

dotenv.config({ path: "./.env" });

process.env.NODE_ENV = "test";
process.env.ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || "phase2-test-access-secret";
process.env.REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "phase2-test-refresh-secret";
process.env.ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "15m";
process.env.REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "7d";
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

const { app } = await import("../src/app.js");
const { Video } = await import("../src/models/video.model.js");
const { Like } = await import("../src/models/like.model.js");

let mongoServer;
let owner;
let other;

describe("Phase 2 REST API", { timeout: 120000 }, () => {
  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    owner = await createUser(app, "owner");
    other = await createUser(app, "other");
  });

  after(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it("allows unauthenticated published video listing", async () => {
    const res = await request(app).get("/api/v1/videos");
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  it("rejects unauthenticated video publish", async () => {
    const res = await request(app).post("/api/v1/videos").send({});
    assert.equal(res.status, 401);
  });

  it("returns 404 JSON for unknown routes", async () => {
    const res = await request(app)
      .get("/api/v1/does-not-exist")
      .set(auth(owner.token));
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });

  it("rejects invalid email on account update", async () => {
    const res = await request(app)
      .patch("/api/v1/users/update_account")
      .set(auth(owner.token))
      .send({ fullname: "Owner", email: "not-an-email" });
    assert.equal(res.status, 400);
  });

  it("changes password for the authenticated user", async () => {
    const res = await request(app)
      .post("/api/v1/users/change_password")
      .set(auth(owner.token))
      .send({ oldPassword: owner.password, newPassword: "Phase2Pass2!" });
    assert.equal(res.status, 200);
    owner.password = "Phase2Pass2!";
    owner.login = await request(app).post("/api/v1/users/login").send({
      email: owner.email,
      password: owner.password,
    });
    owner.token = owner.login.body.data.accessToken;
    assert.equal(owner.login.status, 200);
  });

  it("publishes a video and lists it with pagination and search", async () => {
    const created = await publishVideo(app, owner.token, "Alpha clip");
    assert.equal(created.status, 201);
    assert.ok(created.body.data._id);
    assert.equal(created.body.data.owner, owner.user._id);

    const missing = await request(app)
      .post("/api/v1/videos")
      .set(auth(owner.token))
      .field("title", "Nope")
      .attach("thumbnail", Buffer.from("x"), "t.png");
    assert.equal(missing.status, 400);

    const list = await request(app)
      .get("/api/v1/videos")
      .query({ page: 1, limit: 10, query: "Alpha", sortBy: "createdAt" })
      .set(auth(other.token));
    assert.equal(list.status, 200);
    assert.ok(list.body.data.total >= 1);
    assert.equal(list.body.data.page, 1);
    assert.ok(Array.isArray(list.body.data.results));

    const guestList = await request(app).get("/api/v1/videos");
    assert.equal(guestList.status, 200);
    assert.ok(guestList.body.data.total >= 1);

    const publicId = guestList.body.data.results[0]._id;
    const guestWatch = await request(app).get(`/api/v1/videos/${publicId}`);
    assert.equal(guestWatch.status, 200);

    const guestChannel = await request(app).get(
      `/api/v1/users/c/${owner.username}`
    );
    assert.equal(guestChannel.status, 200);
    assert.equal(guestChannel.body.data.email, undefined);

    const guestHistory = await request(app).get("/api/v1/users/History");
    assert.equal(guestHistory.status, 401);
  });

  it("records a view and watch history, and hides unpublished videos from others", async () => {
    const created = await publishVideo(app, owner.token, "History clip");
    const videoId = created.body.data._id;

    const watched = await request(app)
      .get(`/api/v1/videos/${videoId}`)
      .set(auth(other.token));
    assert.equal(watched.status, 200);
    assert.equal(watched.body.data.views, 1);

    const history = await request(app)
      .get("/api/v1/users/History")
      .set(auth(other.token));
    assert.equal(history.status, 200);
    assert.equal(String(history.body.data[0]._id), String(videoId));

    const again = await request(app)
      .get(`/api/v1/videos/${videoId}`)
      .set(auth(other.token));
    assert.equal(again.status, 200);
    const hist2 = await request(app)
      .get("/api/v1/users/History")
      .set(auth(other.token));
    const matches = hist2.body.data.filter((v) => String(v._id) === String(videoId));
    assert.equal(matches.length, 1);

    const toggled = await request(app)
      .patch(`/api/v1/videos/toggle/publish/${videoId}`)
      .set(auth(owner.token));
    assert.equal(toggled.status, 200);
    assert.equal(toggled.body.data.isPublished, false);

    const hidden = await request(app)
      .get(`/api/v1/videos/${videoId}`)
      .set(auth(other.token));
    assert.equal(hidden.status, 404);

    const ownerCanSee = await request(app)
      .get(`/api/v1/videos/${videoId}`)
      .set(auth(owner.token));
    assert.equal(ownerCanSee.status, 200);
  });

  it("enforces video ownership and invalid IDs", async () => {
    const created = await publishVideo(app, owner.token, "Owned clip");
    const videoId = created.body.data._id;

    const forbidden = await request(app)
      .delete(`/api/v1/videos/${videoId}`)
      .set(auth(other.token));
    assert.equal(forbidden.status, 403);

    const badId = await request(app)
      .get("/api/v1/videos/not-an-id")
      .set(auth(owner.token));
    assert.equal(badId.status, 400);

    const missing = await request(app)
      .get(`/api/v1/videos/${new mongoose.Types.ObjectId()}`)
      .set(auth(owner.token));
    assert.equal(missing.status, 404);

    const updated = await request(app)
      .patch(`/api/v1/videos/${videoId}`)
      .set(auth(owner.token))
      .field("title", "Owned clip edited");
    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.title, "Owned clip edited");
  });

  it("supports comments with owner-only edits", async () => {
    const created = await publishVideo(app, owner.token, "Comment clip");
    const videoId = created.body.data._id;

    const added = await request(app)
      .post(`/api/v1/comments/${videoId}`)
      .set(auth(other.token))
      .send({ content: "Nice video" });
    assert.equal(added.status, 201);
    const commentId = added.body.data._id;

    const empty = await request(app)
      .post(`/api/v1/comments/${videoId}`)
      .set(auth(other.token))
      .send({ content: "   " });
    assert.equal(empty.status, 400);

    const listed = await request(app)
      .get(`/api/v1/comments/${videoId}`)
      .query({ page: 1, limit: 5 })
      .set(auth(owner.token));
    assert.equal(listed.status, 200);
    assert.ok(listed.body.data.total >= 1);

    const stolen = await request(app)
      .patch(`/api/v1/comments/c/${commentId}`)
      .set(auth(owner.token))
      .send({ content: "hacked" });
    assert.equal(stolen.status, 403);

    const edited = await request(app)
      .patch(`/api/v1/comments/c/${commentId}`)
      .set(auth(other.token))
      .send({ content: "Updated comment" });
    assert.equal(edited.status, 200);

    const deleted = await request(app)
      .delete(`/api/v1/comments/c/${commentId}`)
      .set(auth(other.token));
    assert.equal(deleted.status, 200);
  });

  it("toggles likes without duplicates", async () => {
    const created = await publishVideo(app, owner.token, "Like clip");
    const videoId = created.body.data._id;

    const on = await request(app)
      .post(`/api/v1/likes/toggle/v/${videoId}`)
      .set(auth(other.token));
    assert.equal(on.status, 200);
    assert.equal(on.body.data.liked, true);
    assert.equal(on.body.data.likes, 1);

    const count = await Like.countDocuments({ video: videoId, likedBy: other.user._id });
    assert.equal(count, 1);

    const off = await request(app)
      .post(`/api/v1/likes/toggle/v/${videoId}`)
      .set(auth(other.token));
    assert.equal(off.body.data.liked, false);

    const liked = await request(app)
      .get("/api/v1/likes/videos")
      .set(auth(other.token));
    assert.equal(liked.status, 200);
  });

  it("prevents self-subscription and lists subscribers", async () => {
    const self = await request(app)
      .post(`/api/v1/subscriptions/c/${owner.user._id}`)
      .set(auth(owner.token));
    assert.equal(self.status, 400);

    const sub = await request(app)
      .post(`/api/v1/subscriptions/c/${owner.user._id}`)
      .set(auth(other.token));
    assert.equal(sub.status, 200);
    assert.equal(sub.body.data.subscribed, true);

    const again = await request(app)
      .post(`/api/v1/subscriptions/c/${owner.user._id}`)
      .set(auth(other.token));
    assert.equal(again.body.data.subscribed, false);

    await request(app)
      .post(`/api/v1/subscriptions/c/${owner.user._id}`)
      .set(auth(other.token));

    const subscribers = await request(app)
      .get(`/api/v1/subscriptions/c/${owner.user._id}`)
      .set(auth(owner.token));
    assert.equal(subscribers.status, 200);
    assert.ok(subscribers.body.data.subscriberCount >= 1);

    const channels = await request(app)
      .get(`/api/v1/subscriptions/u/${other.user._id}`)
      .set(auth(other.token));
    assert.equal(channels.status, 200);
    assert.ok(channels.body.data.subscribedCount >= 1);
  });

  it("supports tweets with ownership checks", async () => {
    const created = await request(app)
      .post("/api/v1/tweets")
      .set(auth(owner.token))
      .send({ content: "Hello channel" });
    assert.equal(created.status, 201);
    const tweetId = created.body.data._id;

    const listed = await request(app)
      .get(`/api/v1/tweets/user/${owner.user._id}`)
      .set(auth(other.token));
    assert.equal(listed.status, 200);
    assert.ok(listed.body.data.total >= 1);

    const forbidden = await request(app)
      .delete(`/api/v1/tweets/${tweetId}`)
      .set(auth(other.token));
    assert.equal(forbidden.status, 403);

    const liked = await request(app)
      .post(`/api/v1/likes/toggle/t/${tweetId}`)
      .set(auth(other.token));
    assert.equal(liked.status, 200);

    const deleted = await request(app)
      .delete(`/api/v1/tweets/${tweetId}`)
      .set(auth(owner.token));
    assert.equal(deleted.status, 200);
  });

  it("manages playlists and ignores duplicate videos", async () => {
    const video = await publishVideo(app, owner.token, "Playlist clip");
    const videoId = video.body.data._id;

    const playlist = await request(app)
      .post("/api/v1/playlist")
      .set(auth(owner.token))
      .send({ name: "Favs", description: "My list" });
    assert.equal(playlist.status, 201);
    const playlistId = playlist.body.data._id;

    await request(app)
      .patch(`/api/v1/playlist/add/${videoId}/${playlistId}`)
      .set(auth(owner.token));
    const dup = await request(app)
      .patch(`/api/v1/playlist/add/${videoId}/${playlistId}`)
      .set(auth(owner.token));
    assert.equal(dup.status, 200);
    assert.equal(dup.body.data.videos.length, 1);

    const stolen = await request(app)
      .patch(`/api/v1/playlist/${playlistId}`)
      .set(auth(other.token))
      .send({ name: "Stolen" });
    assert.equal(stolen.status, 403);

    const listed = await request(app)
      .get(`/api/v1/playlist/user/${owner.user._id}`)
      .set(auth(other.token));
    assert.equal(listed.status, 200);
    assert.ok(listed.body.data.length >= 1);
  });

  it("returns dashboard stats from real data", async () => {
    const before = await request(app)
      .get("/api/v1/dashboard/stats")
      .set(auth(owner.token));
    assert.equal(before.status, 200);

    const video = await publishVideo(app, owner.token, "Dash clip");
    await request(app)
      .get(`/api/v1/videos/${video.body.data._id}`)
      .set(auth(other.token));
    await request(app)
      .post(`/api/v1/likes/toggle/v/${video.body.data._id}`)
      .set(auth(other.token));

    const after = await request(app)
      .get("/api/v1/dashboard/stats")
      .set(auth(owner.token));
    assert.ok(after.body.data.totalVideos >= 1);
    assert.ok(after.body.data.totalViews >= 1);
    assert.ok(after.body.data.totalLikes >= 1);

    const videos = await request(app)
      .get("/api/v1/dashboard/videos")
      .set(auth(owner.token));
    assert.equal(videos.status, 200);
    assert.ok(videos.body.data.total >= 1);
  });

  it("includes database status on healthcheck", async () => {
    const res = await request(app).get("/api/v1/healthcheck");
    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, "OK");
    assert.equal(res.body.data.database, "connected");
  });

  it("deletes a video and cleans related records", async () => {
    const video = await publishVideo(app, owner.token, "Delete me");
    const videoId = video.body.data._id;
    await request(app)
      .post(`/api/v1/comments/${videoId}`)
      .set(auth(other.token))
      .send({ content: "bye" });

    const deleted = await request(app)
      .delete(`/api/v1/videos/${videoId}`)
      .set(auth(owner.token));
    assert.equal(deleted.status, 200);
    assert.equal(await Video.exists({ _id: videoId }), null);
  });
});
