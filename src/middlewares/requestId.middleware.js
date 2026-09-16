import crypto from "crypto";

export const requestId = (req, res, next) => {
  const incoming = req.header("x-request-id");
  const safe =
    incoming && /^[A-Za-z0-9-]{8,64}$/.test(incoming)
      ? incoming
      : crypto.randomUUID();
  req.requestId = safe;
  res.setHeader("X-Request-ID", safe);
  next();
};
