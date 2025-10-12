const User = require("../model/userModel")

const up = async () => {
  try {
    console.log("Starting migration: convertReferralClicksToNumber")

    // First, let's get a count of all users and their referralClicks types
    const totalUsers = await User.countDocuments()
    const usersWithArrayClicks = await User.countDocuments({
      referralClicks: { $type: "array" },
    })
    const usersWithNumberClicks = await User.countDocuments({
      referralClicks: { $type: "number" },
    })
    const usersWithNullClicks = await User.countDocuments({
      $or: [
        { referralClicks: { $exists: false } },
        { referralClicks: null },
        { referralClicks: "" },
      ],
    })

    console.log(`Total users: ${totalUsers}`)
    console.log(`Users with array referralClicks: ${usersWithArrayClicks}`)
    console.log(`Users with number referralClicks: ${usersWithNumberClicks}`)
    console.log(
      `Users with null/undefined referralClicks: ${usersWithNullClicks}`
    )

    // Convert users with array referralClicks to numbers
    if (usersWithArrayClicks > 0) {
      const usersToUpdate = await User.find({
        referralClicks: { $type: "array" },
      })

      console.log(
        `Converting ${usersToUpdate.length} users with array referralClicks...`
      )

      for (const user of usersToUpdate) {
        const clickCount = Array.isArray(user.referralClicks)
          ? user.referralClicks.length
          : 0

        await User.updateOne(
          { _id: user._id },
          {
            $set: {
              referralClicks: clickCount,
            },
          }
        )

        console.log(
          `Updated user ${user.userAddress}: ${user?.referralClicks?.length} clicks -> ${clickCount}`
        )
      }
    }

    // Handle users with null/undefined referralClicks
    if (usersWithNullClicks > 0) {
      const nullClicksResult = await User.updateMany(
        {
          $or: [
            { referralClicks: { $exists: false } },
            { referralClicks: null },
            { referralClicks: "" },
          ],
        },
        {
          $set: {
            referralClicks: 0,
          },
        }
      )

      console.log(
        `Updated ${nullClicksResult.modifiedCount} users with null/undefined referralClicks to 0`
      )
    }

    // Final validation
    const finalArrayCount = await User.countDocuments({
      referralClicks: { $type: "array" },
    })
    const finalNumberCount = await User.countDocuments({
      referralClicks: { $type: "number" },
    })

    console.log(`Migration completed successfully!`)
    console.log(
      `Final count - Users with array referralClicks: ${finalArrayCount}`
    )
    console.log(
      `Final count - Users with number referralClicks: ${finalNumberCount}`
    )

    if (finalArrayCount > 0) {
      console.warn(
        `WARNING: ${finalArrayCount} users still have array referralClicks. Migration may be incomplete.`
      )
    }
  } catch (error) {
    console.log(
      "Error while converting referralClicks to numbers: ",
      JSON.stringify(error)
    )
    throw error
  }
}

const down = async () => {
  try {
    // Convert all referralClicks numbers back to empty arrays
    const res = await User.updateMany(
      { referralClicks: { $type: "number" } },
      {
        $set: {
          referralClicks: [],
        },
      }
    )

    console.log(
      `Migration rollback successful: converted ${res.modifiedCount} referralClicks numbers back to empty arrays`
    )
  } catch (error) {
    console.log(
      "Error while rolling back referralClicks migration: ",
      JSON.stringify(error)
    )
    throw error
  }
}

// Uncomment the line below to run the migration
// up();

// module.exports = { up, down }
