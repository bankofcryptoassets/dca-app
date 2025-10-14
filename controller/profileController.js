const Activity = require("../model/Activity")
const User = require("../model/userModel")

const getUser = async (req, res) => {
  try {
    let user
    user = await User.findOne({ userAddress: req.params.id })
    if (!user) {
      user = await User.findOne({ farcasterId: req.params.id })
    }
    if (!user) {
      user = await User.findById(req.params.id)
    }
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    res.status(200).json({ user })
  } catch (error) {
    res.status(500).json({ message: "Server error", error })
  }
}

const getActivity = async (req, res) => {
  try {
    const user = await Activity.findOne({ user: req.param.id }).populate("user")
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    res.status(200).json({ activities: user.activities })
  } catch (error) {
    res.status(500).json({ message: "Server error", error })
  }
}

const getNotificationSettings = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Return notification settings with defaults if not set
    const notificationSettings = user.notificationSettings || {
      purchaseConfirmations: true,
      lackOfFunds: true,
      milestonesAchieved: true,
    }

    res.status(200).json({ notificationSettings })
  } catch (error) {
    res.status(500).json({ message: "Server error", error })
  }
}

const updateNotificationSettings = async (req, res) => {
  try {
    const { purchaseConfirmations, lackOfFunds, milestonesAchieved } = req.body

    // Validate the request body
    if (
      typeof purchaseConfirmations !== "boolean" ||
      typeof lackOfFunds !== "boolean" ||
      typeof milestonesAchieved !== "boolean"
    ) {
      return res
        .status(400)
        .json({
          message: "Invalid request body. All fields must be boolean values.",
        })
    }

    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Update notification settings
    user.notificationSettings = {
      purchaseConfirmations,
      lackOfFunds,
      milestonesAchieved,
    }

    await user.save()

    res
      .status(200)
      .json({
        message: "Notification settings updated successfully",
        notificationSettings: user.notificationSettings,
      })
  } catch (error) {
    res.status(500).json({ message: "Server error", error })
  }
}

module.exports = {
  getUser,
  getActivity,
  getNotificationSettings,
  updateNotificationSettings,
}
