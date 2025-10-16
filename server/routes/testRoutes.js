import { Router } from "express"
import { startTest, checkTest, getHistoryByEmail, getReportPdf } from "../controllers/testController.js"

const router = Router()

router.post("/start-test", startTest)
router.get("/check/:code", checkTest)
router.get("/history/:email", getHistoryByEmail)
router.get("/report/:code/pdf", getReportPdf)

export default router
