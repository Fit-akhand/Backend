import { env } from "../config/env.js";

export const getCookieOptions = () => ({
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: env.cookieSameSite,
});
