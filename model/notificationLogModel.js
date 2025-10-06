const mongoose = require("mongoose")

/**
 * Logs all notifications sent to users
 * Tracks delivery status and user interactions
 */
const notificationLogSchema = new mongoose.Schema(
  {
    notificationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    targetUrl: {
      type: String,
      required: true,
    },
    recipientFids: {
      type: [Number],
      default: [],
    },
    sentCount: {
      type: Number,
      default: 0,
    },
    successfulCount: {
      type: Number,
      default: 0,
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    rateLimitedCount: {
      type: Number,
      default: 0,
    },
    clickCount: {
      type: Number,
      default: 0,
    },
    clickedByFids: {
      type: [Number],
      default: [],
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    sentBy: {
      type: String, // username who sent the notification
      default: "admin",
    },
    status: {
      type: String,
      enum: ["pending", "sending", "completed", "failed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
)

const NotificationLog = mongoose.model("NotificationLog", notificationLogSchema)

module.exports = NotificationLog
