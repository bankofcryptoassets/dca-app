const User = require("../model/userModel")

const up = async () => {
  try {
    const res = await User.updateMany(
      {},
      {
        $set: {
          notificationSettings: {
            purchaseConfirmations: true,
            lackOfFunds: true,
            milestonesAchieved: true,
          },
        },
      }
    )
    console.log(
      "migration successful, added notification settings to User collection"
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

const down = async () => {
  try {
    const res = await User.updateMany(
      {},
      { $unset: { notificationSettings: "" } }
    )
    console.log(
      "migration successful, removed notification settings from User collection"
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

module.exports = { up, down }
