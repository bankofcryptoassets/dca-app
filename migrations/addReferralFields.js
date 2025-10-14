const User = require("../model/userModel")
const { combinedLogger } = require("../utils/logger")

const up = async () => {
  try {
    combinedLogger.info(
      "Starting migration: adding referral fields to User collection"
    )
    const res = await User.updateMany(
      {},
      { $set: { referredUsers: [], referredBy: null, referralClicks: 0 } }
    )
    combinedLogger.info(
      `Migration successful, added referral fields to ${res.modifiedCount} users`
    )
  } catch (error) {
    combinedLogger.error(
      `Error while updating users collection: ${error.message}`
    )
    throw error
  }
}

const down = async () => {
  try {
    combinedLogger.info(
      "Starting rollback: removing referral fields from User collection"
    )
    const res = await User.updateMany(
      {},
      { $unset: { referredUsers: "", referredBy: "", referralClicks: "" } }
    )
    combinedLogger.info(
      `Rollback successful, removed referral fields from ${res.modifiedCount} users`
    )
  } catch (error) {
    combinedLogger.error(
      `Error while updating users collection: ${error.message}`
    )
    throw error
  }
}

// module.exports = { up, down }
