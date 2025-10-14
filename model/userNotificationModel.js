const mongoose = require("mongoose")

/**
 * Stores notification tokens and details for each user (by FID)
 * Updated when users enable/disable notifications or add/remove the mini app
 */
const userNotificationSchema = new mongoose.Schema(
  {
    fid: { type: Number, required: true, unique: true, index: true },
    notificationUrl: { type: String, required: true },
    notificationToken: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    miniAppAdded: { type: Boolean, default: true },
    lastNotificationSentAt: { type: Date, default: null },
  },
  { timestamps: true }
)

const UserNotification = mongoose.model(
  "UserNotification",
  userNotificationSchema
)

module.exports = UserNotification
