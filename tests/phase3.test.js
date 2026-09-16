import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { auth, createUser, publishVideo, PNG_1X1 } from "./helpers.js";

dotenv.config({ path: "./.env" });
process.env.NODE_ENV = "test";
process.env.ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || "phase3-test-access-secret";
process.env.REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "phase3-test-refresh-secret";
process.env.ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "15m";
process.env.REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "7d";

const { app } = await import("../src/app.js");
const { User } = await import("../src/models/user.model.js");

let mongoServer;
let alice;
let bob;

describe("Phase 3 production hardening", { timeout: 120000 }, () => {
  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    alice = await createUser(app, "alice");
    bob = await createUser(app, "bob");
  });

  after(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it("returns a request id on responses", async () => {
    const res = await request(app).get("/api/v1/healthcheck");
    assert.equal(res.status, 200);
    assert.ok(res.headers["x-request-id"]);
  });

  it("reports readiness when MongoDB is connected", async () => {
    const res = await request(app).get("/api/v1/ready");
    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, "READY");
  });

  it("includes errorCode on validation failures", async () => {
    const res = await request(app).post("/api/v1/users/login").send({});
    assert.equal(res.status, 400);
    assert.equal(res.body.errorCode, "VALIDATION_ERROR");
    assert.ok(res.body.requestId);
  });

  it("strips MongoDB operators from JSON bodies", async () => {
    const res = await request(app)
      .post("/api/v1/users/login")
      .send({ email: { $gt: "" }, password: { $gt: "" } });
    assert.equal(res.status, 400);
  });

  it("rejects invalid upload types", async () => {
    const res = await request(app)
      .patch("/api/v1/users/avater")
      .set(auth(alice.token))
      .attach("avatar", Buffer.from("not-an-image"), {
        filename: "payload.exe",
        contentType: "application/x-msdownload",
      });
    assert.equal(res.status, 400);
  });

  it("runs a realistic user journey", async () => {
    const video = await publishVideo(app, alice.token, "Journey clip");
    assert.equal(video.status, 201);
    const videoId = video.body.data._id;

    const viewed = await request(app)
      .get(`/api/v1/videos/${videoId}`)
      .set(auth(bob.token));
    assert.equal(viewed.status, 200);

    const comment = await request(app)
      .post(`/api/v1/comments/${videoId}`)
      .set(auth(bob.token))
      .send({ content: "Great upload" });
    assert.equal(comment.status, 201);

    const liked = await request(app)
      .post(`/api/v1/likes/toggle/v/${videoId}`)
      .set(auth(bob.token));
    assert.equal(liked.body.data.liked, true);

    const sub = await request(app)
      .post(`/api/v1/subscriptions/c/${alice.user._id}`)
      .set(auth(bob.token));
    assert.equal(sub.body.data.subscribed, true);

    const playlist = await request(app)
      .post("/api/v1/playlist")
      .set(auth(bob.token))
      .send({ name: "Saved", description: "Watch later" });
    await request(app)
      .patch(`/api/v1/playlist/add/${videoId}/${playlist.body.data._id}`)
      .set(auth(bob.token));

    const dash = await request(app)
      .get("/api/v1/dashboard/stats")
      .set(auth(alice.token));
    assert.ok(dash.body.data.totalVideos >= 1);

    const logout = await request(app)
      .post("/api/v1/users/logout")
      .set(auth(bob.token));
    assert.equal(logout.status, 200);
  });

  it("blocks IDOR on another user's video and playlist", async () => {
    const video = await publishVideo(app, alice.token, "Private-ish");
    const playlist = await request(app)
      .post("/api/v1/playlist")
      .set(auth(alice.token))
      .send({ name: "Alice list", description: "mine" });

    const deleteVideo = await request(app)
      .delete(`/api/v1/videos/${video.body.data._id}`)
      .set(auth(bob.token));
    assert.equal(deleteVideo.status, 403);

    const patchPlaylist = await request(app)
      .patch(`/api/v1/playlist/${playlist.body.data._id}`)
      .set(auth(bob.token))
      .send({ name: "stolen" });
    assert.equal(patchPlaylist.status, 403);
  });

  it("does not return password hashes on current user", async () => {
    const res = await request(app)
      .get("/api/v1/users/current_user")
      .set(auth(alice.token));
    assert.equal(res.body.data.password, undefined);
    const raw = await User.findById(alice.user._id);
    assert.equal(raw.password, undefined);
  });

  it("invalidates access tokens after a password change", async () => {
    const oldToken = alice.token;
    const changed = await request(app)
      .post("/api/v1/users/change_password")
      .set(auth(oldToken))
      .send({ oldPassword: alice.password, newPassword: "AlicePass2!" });
    assert.equal(changed.status, 200);

    const rejected = await request(app)
      .get("/api/v1/users/current_user")
      .set(auth(oldToken));
    assert.equal(rejected.status, 401);

    const login = await request(app).post("/api/v1/users/login").send({
      email: alice.email,
      password: "AlicePass2!",
    });
    alice.token = login.body.data.accessToken;
    alice.password = "AlicePass2!";
    assert.equal(login.status, 200);
  });
});
