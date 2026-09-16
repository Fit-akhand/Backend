import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import helmet from "helmet"
import { errorHandler } from "./middlewares/error.middleware.js"
import { ApiError } from "./utils/ApiError.js"
import { env } from "./config/env.js"
import { requestId } from "./middlewares/requestId.middleware.js"
import { requestLogger } from "./middlewares/requestLogger.middleware.js"
import { sanitizeMongo } from "./middlewares/sanitizeMongo.middleware.js"
import { generalLimiter } from "./middlewares/rateLimit.middleware.js"

const app = express()

if (env.trustProxy) {
    app.set("trust proxy", 1)
}

app.use(requestId)
app.use(helmet())
app.use(cors({
    origin: env.corsOrigins,
    credentials: true
}))
app.use(express.json({limit: env.jsonLimit}))
app.use(express.urlencoded({extended:true,limit: env.jsonLimit}))
app.use(express.static("public"))
app.use(cookieParser())
app.use(sanitizeMongo)
app.use(requestLogger)
app.use(generalLimiter)

import userRouter from './routes/user.routes.js'
import healthcheckRouter from "./routes/healthcheck.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import videoRouter from "./routes/video.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"
import { readiness } from "./controllers/healthcheck.controller.js"

app.use("/api/v1/healthcheck", healthcheckRouter)
app.get("/api/v1/ready", readiness)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/dashboard", dashboardRouter)

app.use((req, res, next) => {
    next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`))
})

app.use(errorHandler)

export {app}