import mongoose from "mongoose"

export async function connectDB() {
  const uri = process.env.MONGO_URI
  if (!uri) {
    throw new Error("MONGO_URI is not set in environment variables")
  }
  mongoose.set("strictQuery", true)
  await mongoose.connect(uri, { dbName: process.env.MONGO_DB_NAME || "email_spam_report" })
  console.log("[server] MongoDB connected")
}
