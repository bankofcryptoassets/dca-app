const User = require("../model/userModel")

const up = async () => {
  try {
    const res = await User.updateMany(
      {},
      {
        $set: {
          referredUsers: [],
          referredBy: null,
          referralClicks: [],
        },
      }
    )
    console.log(
      "migration successful, added referral fields to User collection"
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
      {
        $unset: {
          referredUsers: "",
          referredBy: "",
          referralClicks: "",
        },
      }
    )
    console.log(
      "migration successful, removed referral fields from User collection"
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
