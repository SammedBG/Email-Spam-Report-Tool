import { TestResult } from "../models/TestResult.js"
import PDFDocument from "pdfkit"
import { MailboxAPIService } from "../services/mailboxAPIs.js"

const PROVIDERS = ["Gmail", "Outlook", "Yahoo", "iCloud", "Proton"]
const TEST_INBOXES = [
  { provider: "Gmail", address: "deliverability.test+gmail@example.com" },
  { provider: "Outlook", address: "deliverability.test+outlook@example.com" },
  { provider: "Yahoo", address: "deliverability.test+yahoo@example.com" },
  { provider: "iCloud", address: "deliverability.test+icloud@example.com" },
  { provider: "Proton", address: "deliverability.test+proton@example.com" },
]

// Simple code generator (8-char base36)
function generateCode() {
  return Math.random().toString(36).slice(2, 6) + Math.random().toString(36).slice(2, 6)
}

// Deterministic hash to simulate classification by code+provider
function hashString(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

function simulatePlacement(provider, code) {
  const h = hashString(provider + code)
  const roll = h % 100
  if (roll < 65) return "Inbox"
  if (roll < 85) return "Promotions"
  return "Spam"
}

function computeScore(result) {
  // Inbox=1, Promotions=0.5, Spam=0
  const total = result.length
  if (total === 0) return 0
  const sum = result.reduce((acc, r) => {
    if (r.placement === "Inbox") return acc + 1
    if (r.placement === "Promotions") return acc + 0.5
    return acc
  }, 0)
  return Math.round((sum / total) * 100) // percentage
}

export async function startTest(req, res) {
  try {
    const { email } = req.body || {}
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ error: "Invalid email" })
    }

    const code = generateCode()
    const doc = await TestResult.create({
      code,
      userEmail: email.trim().toLowerCase(),
      status: "pending",
      result: [],
      score: 0,
    })

    res.json({
      code: doc.code,
      instructions: {
        sendTo: TEST_INBOXES,
        subject: `Deliverability Test - ${doc.code}`,
        body: `Please send your test email with this code in subject and body: ${doc.code}.
After sending, click "Check Results" to view placement across inboxes.`,
      },
    })
  } catch (err) {
    console.error("[startTest] error", err)
    res.status(500).json({ error: "Server error" })
  }
}

export async function checkTest(req, res) {
  try {
    const { code } = req.params
    const { tokens } = req.body || {} // OAuth tokens from frontend
    
    const test = await TestResult.findOne({ code })
    if (!test) return res.status(404).json({ error: "Test not found" })

    test.status = "processing"
    await test.save()

    // Use real API integration instead of simulation
    const mailboxService = new MailboxAPIService()
    const apiResults = await mailboxService.checkAllInboxes(code, tokens)
    
    // Convert API results to our format
    const result = PROVIDERS.map(provider => {
      const apiResult = apiResults[provider]
      return {
        provider,
        placement: apiResult.found ? apiResult.placement : 'Not Found',
        found: apiResult.found,
        error: apiResult.error
      }
    })
    
    const score = computeScore(result)

    test.status = "completed"
    test.result = result
    test.score = score
    await test.save()

    res.json({
      code: test.code,
      status: test.status,
      result,
      score,
      createdAt: test.createdAt,
    })
  } catch (err) {
    console.error("[checkTest] error", err)
    res.status(500).json({ error: "Server error" })
  }
}

export async function getHistoryByEmail(req, res) {
  try {
    const { email } = req.params
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Invalid email" })
    }
    const list = await TestResult.find({ userEmail: email.trim().toLowerCase() })
      .sort({ createdAt: -1 })
      .limit(50)
      .select("code status score createdAt result")

    res.json(list)
  } catch (err) {
    console.error("[getHistoryByEmail] error", err)
    res.status(500).json({ error: "Server error" })
  }
}

export async function getReportPdf(req, res) {
  try {
    const { code } = req.params
    const test = await TestResult.findOne({ code })
    if (!test) return res.status(404).json({ error: "Test not found" })

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `inline; filename="report-${code}.pdf"`)

    const doc = new PDFDocument({ margin: 40 })
    doc.pipe(res)

    doc.fontSize(20).text("Email Deliverability Report", { underline: true })
    doc.moveDown()
    doc.fontSize(12).text(`Code: ${test.code}`)
    doc.text(`Email: ${test.userEmail}`)
    doc.text(`Created At: ${new Date(test.createdAt).toLocaleString()}`)
    doc.moveDown()
    doc.fontSize(14).text(`Overall Deliverability Score: ${test.score}%`)
    doc.moveDown()
    doc.fontSize(12).text("Per-Provider Results:")
    doc.moveDown(0.5)

    test.result.forEach((r) => {
      doc.text(`- ${r.provider}: ${r.placement}`)
    })

    doc.moveDown()
    doc
      .fontSize(10)
      .fillColor("#666")
      .text("Notes: This report uses real mailbox API integrations to detect actual email placement across providers.", {
        align: "left",
      })

    doc.end()
  } catch (err) {
    console.error("[getReportPdf] error", err)
    res.status(500).json({ error: "Server error" })
  }
}
