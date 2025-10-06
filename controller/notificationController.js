const UserNotification = require("../model/userNotificationModel")
const NotificationLog = require("../model/notificationLogModel")
const crypto = require("crypto")

/**
 * Handle webhook events from Farcaster
 * Events: miniapp_added, miniapp_removed, notifications_enabled, notifications_disabled
 */
async function handleWebhook(req, res) {
  try {
    const webhookData = req.body

    if (!webhookData || !webhookData.event) {
      return res.status(400).json({
        success: false,
        error: "Invalid webhook data",
      })
    }

    const { fid, event } = webhookData

    if (!fid) {
      return res.status(400).json({
        success: false,
        error: "Missing fid in webhook data",
      })
    }

    switch (event.event) {
      case "miniapp_added":
        await handleMiniAppAdded(fid, event.notificationDetails)
        break

      case "miniapp_removed":
        await handleMiniAppRemoved(fid)
        break

      case "notifications_enabled":
        await handleNotificationsEnabled(fid, event.notificationDetails)
        break

      case "notifications_disabled":
        await handleNotificationsDisabled(fid)
        break

      default:
        console.error(`Unknown event type: ${event.event}`)
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error("Webhook handler error:", error)
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

async function handleMiniAppAdded(fid, notificationDetails) {
  if (
    notificationDetails &&
    notificationDetails.token &&
    notificationDetails.url
  ) {
    // User added mini app with notifications enabled
    await UserNotification.findOneAndUpdate(
      { fid },
      {
        fid,
        notificationUrl: notificationDetails.url,
        notificationToken: notificationDetails.token,
        enabled: true,
        miniAppAdded: true,
      },
      { upsert: true, new: true }
    )
  } else {
    // User added mini app but notifications not enabled
    await UserNotification.findOneAndUpdate(
      { fid },
      {
        fid,
        miniAppAdded: true,
        enabled: false,
      },
      { upsert: true, new: true }
    )
  }
}

async function handleMiniAppRemoved(fid) {
  await UserNotification.findOneAndUpdate(
    { fid },
    {
      miniAppAdded: false,
      enabled: false,
    }
  )
}

async function handleNotificationsEnabled(fid, notificationDetails) {
  if (
    !notificationDetails ||
    !notificationDetails.token ||
    !notificationDetails.url
  ) {
    console.error(`Invalid notification details for FID: ${fid}`)
    return
  }

  await UserNotification.findOneAndUpdate(
    { fid },
    {
      fid,
      notificationUrl: notificationDetails.url,
      notificationToken: notificationDetails.token,
      enabled: true,
    },
    { upsert: true, new: true }
  )
}

async function handleNotificationsDisabled(fid) {
  await UserNotification.findOneAndUpdate(
    { fid },
    {
      enabled: false,
    }
  )
}

/**
 * Send a notification to multiple users
 */
async function sendNotification(req, res) {
  try {
    const { title, body, targetUrl, recipientFids } = req.body

    // Validation
    if (!title || title.length > 32) {
      return res.status(400).json({
        success: false,
        error: "Title is required and must be <= 32 characters",
      })
    }

    if (!body || body.length > 128) {
      return res.status(400).json({
        success: false,
        error: "Body is required and must be <= 128 characters",
      })
    }

    if (!targetUrl || targetUrl.length > 1024) {
      return res.status(400).json({
        success: false,
        error: "Target URL is required and must be <= 1024 characters",
      })
    }

    // Generate unique notification ID
    const notificationId = crypto.randomUUID()

    // Determine recipients
    let recipients
    if (
      recipientFids &&
      Array.isArray(recipientFids) &&
      recipientFids.length > 0
    ) {
      // Send to specific FIDs
      recipients = await UserNotification.find({
        fid: { $in: recipientFids },
        enabled: true,
      })
    } else {
      // Send to all users with notifications enabled
      recipients = await UserNotification.find({
        enabled: true,
      })
    }

    if (recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No eligible recipients found",
      })
    }

    // Create notification log
    const notificationLog = await NotificationLog.create({
      notificationId,
      title,
      body,
      targetUrl,
      recipientFids: recipients.map((r) => r.fid),
      sentCount: recipients.length,
      status: "sending",
      sentBy: req.user || "admin",
    })

    // Send notifications in batches of 100 (Farcaster limit)
    const batchSize = 100
    let successfulCount = 0
    let failedCount = 0
    let rateLimitedCount = 0

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize)

      // Group by notification URL (should be same for all, but just in case)
      const groupedByUrl = batch.reduce((acc, recipient) => {
        if (!acc[recipient.notificationUrl]) {
          acc[recipient.notificationUrl] = []
        }
        acc[recipient.notificationUrl].push(recipient)
        return acc
      }, {})

      // Send to each URL group
      for (const [url, urlRecipients] of Object.entries(groupedByUrl)) {
        try {
          const tokens = urlRecipients.map((r) => r.notificationToken)

          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              notificationId,
              title,
              body,
              targetUrl,
              tokens,
            }),
          })

          if (response.ok) {
            const result = await response.json()
            successfulCount += result.successfulTokens?.length || 0
            rateLimitedCount += result.rateLimitedTokens?.length || 0
            failedCount += result.invalidTokens?.length || 0

            // Mark invalid tokens as disabled
            if (result.invalidTokens && result.invalidTokens.length > 0) {
              await UserNotification.updateMany(
                { notificationToken: { $in: result.invalidTokens } },
                { enabled: false }
              )
            }

            // Update last notification sent time for successful sends
            if (result.successfulTokens && result.successfulTokens.length > 0) {
              await UserNotification.updateMany(
                { notificationToken: { $in: result.successfulTokens } },
                { lastNotificationSentAt: Date.now() }
              )
            }
          } else {
            console.error(
              `Failed to send notification batch: ${response.status}`
            )
            failedCount += tokens.length
          }
        } catch (error) {
          console.error(`Error sending notification batch:`, error)
          failedCount += urlRecipients.length
        }
      }
    }

    // Update notification log with results
    await NotificationLog.findOneAndUpdate(
      { notificationId },
      {
        successfulCount,
        failedCount,
        rateLimitedCount,
        status: "completed",
      }
    )

    return res.status(200).json({
      success: true,
      notificationId,
      results: {
        total: recipients.length,
        successful: successfulCount,
        failed: failedCount,
        rateLimited: rateLimitedCount,
      },
    })
  } catch (error) {
    console.error("Send notification error:", error)
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

/**
 * Get list of sent notifications with analytics
 */
async function getNotifications(req, res) {
  try {
    const { page = 1, limit = 20 } = req.query
    const skip = (page - 1) * limit

    const notifications = await NotificationLog.find()
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await NotificationLog.countDocuments()

    return res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Get notifications error:", error)
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

/**
 * Track notification click/open
 */
async function trackNotificationClick(req, res) {
  try {
    const { notificationId, fid } = req.body

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        error: "notificationId is required",
      })
    }

    const notification = await NotificationLog.findOne({ notificationId })

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: "Notification not found",
      })
    }

    // Only increment if this FID hasn't clicked before
    if (fid && !notification.clickedByFids.includes(fid)) {
      await NotificationLog.findOneAndUpdate(
        { notificationId },
        {
          $inc: { clickCount: 1 },
          $push: { clickedByFids: fid },
        }
      )
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error("Track notification click error:", error)
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

/**
 * Get notification statistics
 */
async function getNotificationStats(req, res) {
  try {
    const totalUsers = await UserNotification.countDocuments()
    const enabledUsers = await UserNotification.countDocuments({
      enabled: true,
    })
    const totalNotifications = await NotificationLog.countDocuments()
    const totalClicks = await NotificationLog.aggregate([
      { $group: { _id: null, total: { $sum: "$clickCount" } } },
    ])

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        enabledUsers,
        totalNotificationsSent: totalNotifications,
        totalClicks: totalClicks[0]?.total || 0,
      },
    })
  } catch (error) {
    console.error("Get notification stats error:", error)
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

module.exports = {
  handleWebhook,
  sendNotification,
  getNotifications,
  trackNotificationClick,
  getNotificationStats,
}
