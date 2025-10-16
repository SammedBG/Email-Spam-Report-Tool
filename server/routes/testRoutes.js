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

// Get PDF report
router.get("/report/:code/pdf", asyncHandler(getReportPdf))

export default router
