const User = require("../model/userModel")
const { generateReferralId } = require("../utils/referral")

const up = async () => {
  try {
    console.log("Starting referralId migration...")

    // Get all users without referralId
    const users = await User.find({ referralId: { $exists: false } })
    console.log(`Found ${users.length} users without referralId`)

    for (const user of users) {
      try {
        const referralId = generateReferralId(user.userAddress)

        // Check if referralId already exists (very unlikely but safety check)
        const existingUser = await User.findOne({ referralId })
        if (
          existingUser &&
          existingUser._id.toString() !== user._id.toString()
        ) {
          console.log(
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

        console.log(
          `Generated referralId ${referralId} for user ${user.userAddress}`
        )
      } catch (error) {
        console.error(`Error processing user ${user.userAddress}:`, error)
        continue
      }
    }

    console.log("Migration completed successfully!")
  } catch (error) {
    console.log(
      "error while adding referralId to users collection:: ",
      JSON.stringify(error)
    )
    throw error
  }
}

const down = async () => {
  try {
    const res = await User.updateMany(
      {},
      {
        $unset: {
          referralId: "",
        },
      }
    )
    console.log(
      "migration successful, removed referralId field from User collection"
    )
    console.log(res)
  } catch (error) {
    console.log(
      "error while updating users collection:: ",
      JSON.stringify(error)
    )
    throw error
  }
}

// module.exports = { up, down }
