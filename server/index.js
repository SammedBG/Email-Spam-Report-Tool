import express from "express"
import cors from "cors"
import morgan from "morgan"
import dotenv from "dotenv"
import { connectDB } from "./config/db.js"
import testRoutes from "./routes/testRoutes.js"
import authRoutes from "./routes/authRoutes.js"
import monitoringRoutes from "./routes/monitoringRoutes.js"
import trackingRoutes from "./routes/trackingRoutes.js"
import analyticsRoutes from "./routes/analyticsRoutes.js"
import webhookRoutes from "./routes/webhookRoutes.js"
import authUserRoutes from "./routes/authUserRoutes.js"
import advancedRoutes from "./routes/advancedRoutes.js"
import { globalErrorHandler, healthCheck, rateLimiter } from "./middleware/errorHandler.js"
import { createValidationMiddleware, emailSchema, checkTestSchema } from "./middleware/validation.js"

dotenv.config()

const app = express()

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*", credentials: false }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(morgan("dev"))

// Rate limiting middleware
app.use((req, res, next) => {
  const identifier = req.ip || req.connection.remoteAddress
  if (!rateLimiter.isAllowed(identifier, 100, 60000)) { // 100 requests per minute
    return res.status(429).json({
      error: 'Rate Limit Exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter: 60
    })
  }
  next()
})

// Health check endpoint
app.get("/api/health", healthCheck)

// API routes with validation
app.use("/api", testRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/auth/user", authUserRoutes)
app.use("/api/monitoring", monitoringRoutes)
app.use("/api/tracking", trackingRoutes)
app.use("/api/analytics", analyticsRoutes)
app.use("/api/webhooks", webhookRoutes)

// Global error handler (must be last)
app.use(globalErrorHandler)

const PORT = process.env.PORT || 5000

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[server] running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error("[server] failed to connect db", err)
    process.exit(1)
  })
