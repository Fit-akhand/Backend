import request from "supertest";

export const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

export const VIDEO_BYTES = Buffer.from("fake-mp4-bytes");

export const createUser = async (app, label) => {
  const username = `p2_${label}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const email = `${username}@example.com`;
  const password = "Phase2Pass!";

  const register = await request(app)
    .post("/api/v1/users/register")
    .field("fullname", `${label} User`)
    .field("email", email)
    .field("username", username)
    .field("password", password)
    .attach("avatar", PNG_1X1, `${label}-avatar.png`);

  const login = await request(app).post("/api/v1/users/login").send({
    email,
    password,
  });

  return {
    username,
    email,
    password,
    token: login.body.data.accessToken,
    user: login.body.data.user,
    register,
    login,
  };
};

export const auth = (token) => ({ Authorization: `Bearer ${token}` });

export const publishVideo = async (app, token, title = "A video") => {
  const res = await request(app)
    .post("/api/v1/videos")
    .set(auth(token))
    .field("title", title)
    .field("description", `${title} description`)
    .attach("videoFile", VIDEO_BYTES, "clip.mp4")
    .attach("thumbnail", PNG_1X1, "thumb.png");
  return res;
};
