import mongoose from "mongoose"

const ResultItemSchema = new mongoose.Schema(
  {
    provider: { type: String, required: true }, // e.g., Gmail, Outlook, Yahoo, iCloud, Proton
    placement: { type: String, enum: ["Inbox", "Spam", "Promotions"], required: true },
  },
  { _id: false },
)

const TestResultSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    userEmail: { type: String, required: true, index: true },
    status: { type: String, enum: ["pending", "processing", "completed", "error"], default: "pending" },
    result: { type: [ResultItemSchema], default: [] },
    score: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "test_results" },
)

export const TestResult = mongoose.model("TestResult", TestResultSchema)
