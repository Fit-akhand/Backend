const dangerous = (key) => key.startsWith("$") || key.includes(".");

const strip = (value) => {
  if (!value || typeof value !== "object") {
    return;
  }
  if (Array.isArray(value)) {
    value.forEach(strip);
    return;
  }
  for (const key of Object.keys(value)) {
    if (dangerous(key)) {
      delete value[key];
    } else {
      strip(value[key]);
    }
  }
};

export const sanitizeMongo = (req, res, next) => {
  strip(req.body);
  strip(req.query);
  strip(req.params);
  next();
};
