FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src

RUN addgroup -S app && adduser -S app -G app \
  && mkdir -p public/temp \
  && chown -R app:app /app
USER app

EXPOSE 8000
CMD ["node", "-r", "dotenv/config", "src/index.js"]
