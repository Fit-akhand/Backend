import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import mongoose from "mongoose";
import request from "supertest";
import jwt from "jsonwebtoken";
import { hashToken } from "../src/utils/tokens.js";
import { MongoMemoryServer } from "mongodb-memory-server";

dotenv.config({ path: "./.env" });

process.env.NODE_ENV = "test";
process.env.ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || "phase1-test-access-secret";
process.env.REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "phase1-test-refresh-secret";
process.env.ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "15m";
process.env.REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "7d";
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

const { app } = await import("../src/app.js");
const { User } = await import("../src/models/user.model.js");

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

const TEST_USERNAME = `phase1_${Date.now()}`;
const TEST_EMAIL = `${TEST_USERNAME}@example.com`;
const TEST_PASSWORD = "Phase1Pass!";

let accessToken;
let refreshToken;
let mongoServer;

describe("Phase 1 backend stabilization", { timeout: 120000 }, () => {
  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  after(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it("boots the Express app export", () => {
    assert.ok(app);
    assert.equal(typeof app.listen, "function");
  });

  it("GET /api/v1/healthcheck returns OK JSON", async () => {
    const res = await request(app).get("/api/v1/healthcheck");
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, "OK");
  });

  it("rejects invalid registration input", async () => {
    const res = await request(app).post("/api/v1/users/register").send({});
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.message);
  });

  it("registers a user, hashes password, and persists the document", async () => {
    const res = await request(app)
      .post("/api/v1/users/register")
      .field("fullname", "Phase One User")
      .field("email", TEST_EMAIL)
      .field("username", TEST_USERNAME)
      .field("password", TEST_PASSWORD)
      .attach("avatar", PNG_1X1, "avatar.png");

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.username, TEST_USERNAME);
    assert.equal(res.body.data.email, TEST_EMAIL);
    assert.equal(res.body.data.password, undefined);
    assert.equal(res.body.data.refreshToken, undefined);
    assert.ok(res.body.data.avatar);

    const stored = await User.findOne({ username: TEST_USERNAME }).select(
      "+password +refreshToken"
    );
    assert.ok(stored);
    assert.notEqual(stored.password, TEST_PASSWORD);
    assert.equal(stored.refreshToken, undefined);
  });

  it("rejects duplicate registration", async () => {
    const res = await request(app)
      .post("/api/v1/users/register")
      .field("fullname", "Phase One User")
      .field("email", TEST_EMAIL)
      .field("username", TEST_USERNAME)
      .field("password", TEST_PASSWORD)
      .attach("avatar", PNG_1X1, "avatar.png");

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
  });

  it("rejects invalid login credentials with an error payload", async () => {
    const res = await request(app).post("/api/v1/users/login").send({
      email: TEST_EMAIL,
      password: "wrong-password",
    });
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.data, null);
  });

  it("logs in, sets cookies, and returns tokens", async () => {
    const res = await request(app).post("/api/v1/users/login").send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.accessToken);
    assert.ok(res.body.data.refreshToken);
    assert.equal(res.body.data.user.password, undefined);
    assert.equal(res.body.data.user.refreshToken, undefined);

    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;

    const cookies = res.headers["set-cookie"] || [];
    assert.ok(cookies.some((cookie) => cookie.startsWith("accessToken=")));
    assert.ok(cookies.some((cookie) => cookie.startsWith("refreshToken=")));

    const stored = await User.findOne({ username: TEST_USERNAME }).select(
      "+refreshToken"
    );
    assert.equal(stored.refreshToken, hashToken(refreshToken));
  });

  it("returns 401 for a missing JWT", async () => {
    const res = await request(app).get("/api/v1/users/current_user");
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it("returns 401 for an invalid JWT", async () => {
    const res = await request(app)
      .get("/api/v1/users/current_user")
      .set("Authorization", "Bearer not-a-valid-token");
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it("returns 401 for an expired JWT", async () => {
    const expired = jwt.sign(
      { _id: new mongoose.Types.ObjectId() },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "0s" }
    );
    const res = await request(app)
      .get("/api/v1/users/current_user")
      .set("Authorization", `Bearer ${expired}`);
    assert.equal(res.status, 401);
  });

  it("returns the current user for a valid JWT", async () => {
    const res = await request(app)
      .get("/api/v1/users/current_user")
      .set("Authorization", `Bearer ${accessToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.username, TEST_USERNAME);
    assert.equal(res.body.data.password, undefined);
    assert.equal(res.body.data.refreshToken, undefined);
  });

  it("accepts the access token from cookies", async () => {
    const res = await request(app)
      .get("/api/v1/users/current_user")
      .set("Cookie", `accessToken=${accessToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.username, TEST_USERNAME);
  });

  it("rotates tokens on refresh", async () => {
    const res = await request(app)
      .post("/api/v1/users/refresh-token")
      .set("Cookie", `refreshToken=${refreshToken}`);

    assert.equal(res.status, 200);
    assert.ok(res.body.data.accessToken);
    assert.ok(res.body.data.refreshToken);
    assert.notEqual(res.body.data.refreshToken, "newrefreshToken");
    assert.notEqual(res.body.data.refreshToken, refreshToken);

    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;

    const stored = await User.findOne({ username: TEST_USERNAME }).select(
      "+refreshToken"
    );
    assert.equal(stored.refreshToken, hashToken(refreshToken));
  });

  it("rejects a previously rotated refresh token", async () => {
    const loginRes = await request(app).post("/api/v1/users/login").send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    const firstRefresh = loginRes.body.data.refreshToken;

    await request(app)
      .post("/api/v1/users/refresh-token")
      .send({ refreshToken: firstRefresh });

    const reused = await request(app)
      .post("/api/v1/users/refresh-token")
      .send({ refreshToken: firstRefresh });

    assert.equal(reused.status, 401);
  });

  it("updates the avatar URL", async () => {
    const loginRes = await request(app).post("/api/v1/users/login").send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    accessToken = loginRes.body.data.accessToken;
    refreshToken = loginRes.body.data.refreshToken;

    const res = await request(app)
      .patch("/api/v1/users/avater")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("avatar", PNG_1X1, "new-avatar.png");

    assert.equal(res.status, 200);
    assert.ok(res.body.data.avatar);
    assert.match(res.body.data.avatar, /new-avatar\.png/);
    assert.equal(res.body.data.password, undefined);

    const stored = await User.findOne({ username: TEST_USERNAME });
    assert.equal(stored.avatar, res.body.data.avatar);
  });

  it("updates the cover image URL", async () => {
    const res = await request(app)
      .patch("/api/v1/users/cover_image")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("coverImage", PNG_1X1, "cover.png");

    assert.equal(res.status, 200);
    assert.ok(res.body.data.coverImage);
    assert.match(res.body.data.coverImage, /cover\.png/);

    const stored = await User.findOne({ username: TEST_USERNAME });
    assert.equal(stored.coverImage, res.body.data.coverImage);
  });

  it("reads watch history as an array", async () => {
    const res = await request(app)
      .get("/api/v1/users/History")
      .set("Authorization", `Bearer ${accessToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  it("logs out, clears cookies, and removes the stored refresh token", async () => {
    const res = await request(app)
      .post("/api/v1/users/logout")
      .set("Authorization", `Bearer ${accessToken}`);

    assert.equal(res.status, 200);

    const cookies = res.headers["set-cookie"] || [];
    assert.ok(
      cookies.some((cookie) => /accessToken=;/.test(cookie) || /accessToken=;/i.test(cookie) || cookie.includes("accessToken=;"))
    );
    assert.ok(cookies.some((cookie) => cookie.includes("refreshToken=")));

    const stored = await User.findOne({ username: TEST_USERNAME }).select(
      "+refreshToken"
    );
    assert.ok(!stored.refreshToken);

    const refreshRes = await request(app)
      .post("/api/v1/users/refresh-token")
      .send({ refreshToken });
    assert.equal(refreshRes.status, 401);
  });
});
