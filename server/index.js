import express from "express"
import cors from "cors"
import morgan from "morgan"
import dotenv from "dotenv"
import { connectDB } from "./config/db.js"
import testRoutes from "./routes/testRoutes.js"

dotenv.config()

const app = express()

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*", credentials: false }))
app.use(express.json())
app.use(morgan("dev"))

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "email-spam-report", time: new Date().toISOString() })
})

app.use("/api", testRoutes)

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
