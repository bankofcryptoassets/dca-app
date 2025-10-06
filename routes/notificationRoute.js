const express = require("express")
const router = express.Router()
const {
  handleWebhook,
  sendNotification,
  getNotifications,
  trackNotificationClick,
  getNotificationStats,
} = require("../controller/notificationController")
const basicAuth = require("../utils/basicAuth")

// Public webhook endpoint (no auth, but should verify Farcaster signature)
router.post("/webhook", handleWebhook)

// Public endpoint to track notification clicks
router.post("/track-click", trackNotificationClick)

// Admin endpoints (require basic auth)
router.post("/send", basicAuth, sendNotification)
router.get("/list", basicAuth, getNotifications)
router.get("/stats", basicAuth, getNotificationStats)

module.exports = router
