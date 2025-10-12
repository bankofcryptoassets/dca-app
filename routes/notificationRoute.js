const express = require("express")
const router = express.Router()
const {
  handleWebhook,
  getUserNotifications,
  updateUserNotifications,
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

// Public endpoint to get and update user notifications by FID
router.get("/user/:fid", getUserNotifications)
router.patch("/user/:fid", updateUserNotifications)

// Admin endpoints (require basic auth)
router.post("/send", basicAuth, sendNotification)
router.get("/list", basicAuth, getNotifications)
router.get("/stats", basicAuth, getNotificationStats)

module.exports = router
