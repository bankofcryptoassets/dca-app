const User = require("../model/userModel")
const { generateReferralId } = require("../utils/referral")
const { combinedLogger } = require("../utils/logger")

const up = async () => {
  try {
    combinedLogger.info("Starting referralId migration...")

    // Get all users without referralId
    const users = await User.find({ referralId: { $exists: false } })
    combinedLogger.info(`Found ${users.length} users without referralId`)

    for (const user of users) {
      try {
        const referralId = generateReferralId(user.userAddress)

        // Check if referralId already exists (very unlikely but safety check)
        const existingUser = await User.findOne({ referralId })
        if (
          existingUser &&
          existingUser._id.toString() !== user._id.toString()
        ) {
          combinedLogger.warn(
            `ReferralId collision detected for ${user.userAddress}, generating alternative...`
          )
          // Generate with 7 characters instead of 6 to avoid collision
          const alternativeReferralId = generateReferralId(user.userAddress, 7)
          await User.updateOne(
            { _id: user._id },
            { $set: { referralId: alternativeReferralId } }
          )
        } else {
          await User.updateOne({ _id: user._id }, { $set: { referralId } })
        }

        combinedLogger.debug(
          `Generated referralId ${referralId} for user ${user.userAddress}`
        )
      } catch (error) {
        combinedLogger.error(
          `Error processing user ${user.userAddress}: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`
        )
        continue
      }
    }

    combinedLogger.info("Migration completed successfully!")
  } catch (error) {
    combinedLogger.error(
      `Error while adding referralId to users collection: ${error.message}`
    )
    throw error
  }
}

const down = async () => {
  try {
    combinedLogger.info(
      "Starting rollback: removing referralId field from User collection"
    )
    const res = await User.updateMany({}, { $unset: { referralId: "" } })
    combinedLogger.info(
      `Rollback successful, removed referralId field from ${res.modifiedCount} users`
    )
  } catch (error) {
    combinedLogger.error(
      `Error while updating users collection: ${error.message}`
    )
    throw error
  }
}

module.exports = { up, down }
