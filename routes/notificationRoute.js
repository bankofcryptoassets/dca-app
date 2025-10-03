const express = require("express")
const router = express.Router()
const {
  handleWebhook,
  sendNotification,
  getNotifications,
  trackNotificationClick,
  getNotificationStats,
} = require("../controller/notificationController")

// Basic auth middleware for admin endpoints
function basicAuth(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Admin Area"')
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    })
  }

  const base64Credentials = authHeader.split(" ")[1]
  const credentials = Buffer.from(base64Credentials, "base64").toString("ascii")
  const [username, password] = credentials.split(":")

  // Get credentials from environment variables
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.user = username
    next()
  } else {
    res.setHeader("WWW-Authenticate", 'Basic realm="Admin Area"')
    return res.status(401).json({
      success: false,
      error: "Invalid credentials",
    })
  }
}

// Public webhook endpoint (no auth, but should verify Farcaster signature)
router.post("/webhook", handleWebhook)

// Public endpoint to track notification clicks
router.post("/track-click", trackNotificationClick)

// Admin endpoints (require basic auth)
router.post("/send", basicAuth, sendNotification)
router.get("/list", basicAuth, getNotifications)
router.get("/stats", basicAuth, getNotificationStats)

module.exports = router
