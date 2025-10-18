import { Router } from "express"
import { startTest, checkTest, getHistoryByEmail, getReportPdf } from "../controllers/testController.js"
import { createValidationMiddleware, emailSchema, checkTestSchema } from "../middleware/validation.js"
import { asyncHandler } from "../middleware/errorHandler.js"

const router = Router()

// Start test with email validation
router.post("/start-test", 
  createValidationMiddleware(emailSchema),
  asyncHandler(startTest)
)

// Check test with validation and retry mechanism
router.post("/check/:code", 
  createValidationMiddleware(checkTestSchema),
  asyncHandler(checkTest)
)

// Get history by email
router.get("/history/:email", asyncHandler(getHistoryByEmail))

// Get all history (for general history display)
router.get("/history", asyncHandler(async (req, res) => {
  const { TestResult } = await import("../models/TestResult.js")
  const tests = await TestResult.find({})
    .sort({ createdAt: -1 })
    .limit(50)
  res.json(tests)
}))

// Get PDF report
router.get("/report/:code/pdf", asyncHandler(getReportPdf))

export default router
