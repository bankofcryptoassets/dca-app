const User = require("../model/userModel")
const UserNotification = require("../model/userNotificationModel")
const NotificationLog = require("../model/notificationLogModel")
const crypto = require("crypto")
const { combinedLogger } = require("./logger")

/**
 * Check if a user can receive notifications based on their settings and notification token
 * @param {string} userAddress - The user's wallet address
 * @param {string} notificationType - The type of notification (purchaseConfirmations, lackOfFunds, milestonesAchieved)
 * @returns {Promise<{canReceive: boolean, userNotification: Object|null, reason?: string}>}
 */
async function canUserReceiveNotification(userAddress, notificationType) {
  try {
    // Find user by address
    const user = await User.findOne({ userAddress })
    if (!user) {
      return {
        canReceive: false,
        userNotification: null,
        reason: "User not found",
      }
    }

    // Check if user has notification settings enabled for this type
    const notificationSettings = user.notificationSettings
    if (!notificationSettings || !notificationSettings[notificationType]) {
      return {
        canReceive: false,
        userNotification: null,
        reason: `Notification type '${notificationType}' is disabled`,
      }
    }

    // Find user's notification token (by FID)
    if (!user.farcasterId) {
      return {
        canReceive: false,
        userNotification: null,
        reason: "User has no Farcaster ID",
      }
    }

    const userNotification = await UserNotification.findOne({
      fid: parseInt(user.farcasterId),
      enabled: true,
    })

    if (!userNotification) {
      return {
        canReceive: false,
        userNotification: null,
        reason: "User has no notification token or notifications disabled",
      }
    }

    if (
      !userNotification.notificationUrl ||
      !userNotification.notificationToken
    ) {
      return {
        canReceive: false,
        userNotification: null,
        reason: "User has incomplete notification setup",
      }
    }

    return {
      canReceive: true,
      userNotification,
      reason: "User can receive notifications",
    }
  } catch (error) {
    combinedLogger.error(
      "canUserReceiveNotification -- Error checking if user can receive notification: " +
        JSON.stringify(error, Object.getOwnPropertyNames(error))
    )
    return {
      canReceive: false,
      userNotification: null,
      reason: "Error checking notification eligibility",
    }
  }
}

/**
 * Send a notification to a specific user
 * @param {string} userAddress - The user's wallet address
 * @param {string} title - Notification title (max 32 chars)
 * @param {string} body - Notification body (max 128 chars)
 * @param {string} targetUrl - URL to open when notification is clicked
 * @param {string} notificationType - The type of notification for logging
 * @returns {Promise<{success: boolean, notificationId?: string, error?: string}>}
 */
async function sendNotificationToUser(
  userAddress,
  title,
  body,
  targetUrl,
  notificationType
) {
  try {
    // Check if user can receive notifications
    const eligibility = await canUserReceiveNotification(
      userAddress,
      notificationType
    )

    if (!eligibility.canReceive) {
      combinedLogger.error(
        "sendNotificationToUser -- Cannot send notification to " +
          userAddress +
          ": " +
          eligibility.reason
      )
      return {
        success: false,
        error: eligibility.reason,
      }
    }

    const { userNotification } = eligibility

    // Generate unique notification ID
    const notificationId = crypto.randomUUID()

    // Create notification log
    const notificationLog = await NotificationLog.create({
      notificationId,
      title,
      body,
      targetUrl,
      recipientFids: [userNotification.fid],
      sentCount: 1,
      status: "sending",
      sentBy: "system",
      notificationType,
    })

    // Send notification
    try {
      const response = await fetch(userNotification.notificationUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationId,
          title,
          body,
          targetUrl,
          tokens: [userNotification.notificationToken],
        }),
      })

      if (response.ok) {
        const result = (await response.json())?.result

        // Check if token is invalid and disable it
        if (
          result.invalidTokens &&
          result.invalidTokens.includes(userNotification.notificationToken)
        ) {
          await UserNotification.updateOne(
            { notificationToken: userNotification.notificationToken },
            { enabled: false }
          )

          await NotificationLog.findOneAndUpdate(
            { notificationId },
            {
              successfulCount: 0,
              failedCount: 1,
              status: "completed",
              error: "Invalid notification token",
            }
          )

          return {
            success: false,
            error: "Invalid notification token",
          }
        }

        // Update notification log with success
        await NotificationLog.findOneAndUpdate(
          { notificationId },
          {
            successfulCount: 1,
            failedCount: 0,
            status: "completed",
          }
        )

        // Update last notification sent time
        await UserNotification.updateOne(
          { notificationToken: userNotification.notificationToken },
          { lastNotificationSentAt: Date.now() }
        )

        combinedLogger.info(
          "sendNotificationToUser -- Notification sent successfully to " +
            userAddress
        )
        return {
          success: true,
          notificationId,
        }
      } else {
        combinedLogger.error(
          "sendNotificationToUser -- Failed to send notification: " +
            response.status
        )

        await NotificationLog.findOneAndUpdate(
          { notificationId },
          {
            successfulCount: 0,
            failedCount: 1,
            status: "completed",
            error: `HTTP ${response.status}`,
          }
        )

        return {
          success: false,
          error: `HTTP ${response.status}`,
        }
      }
    } catch (fetchError) {
      combinedLogger.error(
        "sendNotificationToUser -- Error sending notification: " +
          JSON.stringify(fetchError, Object.getOwnPropertyNames(fetchError))
      )

      await NotificationLog.findOneAndUpdate(
        { notificationId },
        {
          successfulCount: 0,
          failedCount: 1,
          status: "completed",
          error: fetchError.message,
        }
      )

      return {
        success: false,
        error: fetchError.message,
      }
    }
  } catch (error) {
    combinedLogger.error(
      "sendNotificationToUser -- Error in sendNotificationToUser: " +
        JSON.stringify(error, Object.getOwnPropertyNames(error))
    )
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Send purchase confirmation notification
 * @param {string} userAddress - The user's wallet address
 * @param {number} amount - The amount purchased
 * @param {string} txHash - Transaction hash
 * @returns {Promise<{success: boolean, notificationId?: string, error?: string}>}
 */
async function sendPurchaseConfirmationNotification(userAddress, amount) {
  const title = "Purchase Confirmed"
  const body = `Successfully purchased $${amount} worth of BTC`
  const targetUrl = "https://dca.bitmor.xyz/"

  return await sendNotificationToUser(
    userAddress,
    title,
    body,
    targetUrl,
    "purchaseConfirmations"
  )
}

/**
 * Send lack of funds notification
 * @param {string} userAddress - The user's wallet address
 * @param {number} requiredAmount - The amount that was required
 * @returns {Promise<{success: boolean, notificationId?: string, error?: string}>}
 */
async function sendLackOfFundsNotification(userAddress, requiredAmount) {
  const title = "Insufficient Funds"
  const body = `Need $${requiredAmount} for DCA purchase`
  const targetUrl = "https://dca.bitmor.xyz/" // Link to add funds or settings

  return await sendNotificationToUser(
    userAddress,
    title,
    body,
    targetUrl,
    "lackOfFunds"
  )
}

/**
 * Send milestone achieved notification
 * @param {string} userAddress - The user's wallet address
 * @param {number} milestoneAmount - The milestone amount reached
 * @param {number} totalInvested - Total amount invested so far
 * @returns {Promise<{success: boolean, notificationId?: string, error?: string}>}
 */
async function sendMilestoneAchievedNotification(
  userAddress,
  milestoneAmount,
  totalInvested
) {
  const title = "Milestone Achieved! 🎉"
  const body = `You've invested $${totalInvested} (${milestoneAmount}% of target)`
  const targetUrl = "https://dca.bitmor.xyz/" // Link to portfolio or stats

  return await sendNotificationToUser(
    userAddress,
    title,
    body,
    targetUrl,
    "milestonesAchieved"
  )
}

module.exports = {
  canUserReceiveNotification,
  sendNotificationToUser,
  sendPurchaseConfirmationNotification,
  sendLackOfFundsNotification,
  sendMilestoneAchievedNotification,
}
