const shouldLog = (level) => {
  const order = { error: 0, warn: 1, info: 2, debug: 3 };
  const current = process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug");
  return (order[level] ?? 2) <= (order[current] ?? 2);
};

const write = (level, message, meta = {}) => {
  if (process.env.NODE_ENV === "test" && level === "debug") {
    return;
  }
  if (!shouldLog(level)) {
    return;
  }

  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...meta,
  };

  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
  } else {
    console.log(line);
  }
};

export const logger = {
  error: (message, meta) => write("error", message, meta),
  warn: (message, meta) => write("warn", message, meta),
  info: (message, meta) => write("info", message, meta),
  debug: (message, meta) => write("debug", message, meta),
};
