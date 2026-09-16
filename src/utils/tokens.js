import crypto from "crypto";

export const hashToken = (token) =>
  crypto.createHash("sha256").update(String(token)).digest("hex");

export const matchesStoredRefreshToken = (incoming, stored) => {
  if (!incoming || !stored) {
    return false;
  }
  if (stored === incoming) {
    return true;
  }
  return stored === hashToken(incoming);
};
