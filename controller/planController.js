const { isAddress } = require("viem")
const Payments = require("../model/paymentsModel")
const Plan = require("../model/planModel")
const User = require("../model/userModel")
const { getBTCRate } = require("../utils/price")
const { generateReferralId } = require("../utils/referral")
const { combinedLogger } = require("../utils/logger")

const planSummary = async (req, res) => {
  const { btcAmount, initialPay, pledgedPay } = req.body

  const btcInUsd = await getBTCRate(btcAmount)

  const remainingAmount = btcInUsd - initialPay
  const timeNeededToComplete = remainingAmount / pledgedPay

  res.status(200).json({ btcInUsd, remainingAmount, timeNeededToComplete })
}

const getPlan = async (req, res) => {
  let plan

  plan = await Plan.findOne({ _id: req.params.id }).populate("user payments")
  if (!plan) {
    plan = await Plan.findOne({ planId: req.params.id }).populate(
      "user payments"
    )
  }

  res.status(200).json({ plan })
}

const getPayments = async (req, res) => {
  try {
    let payment

    payment = payment = await Payments.findOne({
      paymentId: req.param.id,
    }).populate("user")

    if (!payment) {
      payment = await Payments.findById(req.param.id).populate("user")
    }

    res.status(200).json({ payment })
  } catch (error) {
    res.status(500).json({ message: "Server error", error })
  }
}

const createPlan = async (req, res) => {
  try {
    const {
      wallet,
      amount,
      target,
      planType,
      farcasterId,
      username,
      displayName,
      pfpUrl,
      clientFid,
      clientPlatformType,
      referrerReferralId,
    } = req.body

    if (!wallet || !isAddress(wallet)) {
      return res
        .status(400)
        .json({ success: false, message: "invalid wallet address" })
    }

    if (!amount || !target || isNaN(amount) || isNaN(target)) {
      return res
        .status(400)
        .json({ success: false, message: "invalid amount or target" })
    }

    combinedLogger.info(
      `Creating plan for wallet: ${wallet}, plan type: ${planType}`
    )

    if (planType !== "daily" && planType !== "weekly") {
      return res
        .status(400)
        .json({ success: false, message: "invalid plan type" })
    }

    // Generate user's referralId from userAddress
    const referralId = generateReferralId(wallet)

    const newUser = new User({
      amount: Number(amount).toFixed(2),
      userAddress: wallet,
      farcasterId,
      username,
      displayName,
      pfpUrl,
      clientFid,
      clientPlatformType,
      referralId,
      payments: [],
      lastPaid: null,
      plan: planType,
      planCreated: Date.now(),
      targetAmount: Number(target).toFixed(6),
      totalInvested: 0,
    })

    const ret = await newUser.save().catch((err) => {
      combinedLogger.error(
        `Error occurred while saving user to db: ${JSON.stringify(
          err,
          Object.getOwnPropertyNames(err)
        )}`
      )
      return err
    })

    if (ret instanceof Error) {
      return res
        .status(500)
        .json({
          success: false,
          message: "internal server error, could not save in db",
        })
    }

    combinedLogger.info(`New user created successfully for wallet: ${wallet}`)

    // Handle referral logic if referral parameters are provided
    if (wallet && referrerReferralId) {
      try {
        // Find the referring user by their referralId
        const referringUser = await User.findOne({
          referralId: referrerReferralId,
        })

        if (referringUser) {
          await User.updateOne(
            { userAddress: wallet },
            { $set: { referredBy: referringUser.referralId } }
          )
          // Add the new user's referralId to the referring user's referredUsers array
          await User.updateOne(
            { userAddress: referringUser.userAddress },
            { $addToSet: { referredUsers: referralId } }
          )
        }
      } catch (referralError) {
        combinedLogger.error(
          `Error processing referral: ${JSON.stringify(
            referralError,
            Object.getOwnPropertyNames(referralError)
          )}`
        )
        // Don't fail the plan creation if referral processing fails
      }
    }

    return res.status(201).json({ success: true, message: "new user created" })
  } catch (error) {
    combinedLogger.error(
      `Error occurred while creating plan: ${JSON.stringify(
        error,
        Object.getOwnPropertyNames(error)
      )}`
    )
    return res
      .status(500)
      .json({ success: false, message: "internal server error" })
  }
}

const pausePlan = async (req, res) => {
  try {
    const { wallet, unpause } = req.body
    const result = await User.findOne({ userAddress: wallet })

    if (!result) {
      return res
        .status(400)
        .json({ success: false, message: "invalid wallet address" })
    }

    await User.updateOne(
      { userAddress: wallet },
      { $set: { paused: unpause ? false : true } }
    )

    combinedLogger.info(
      `Plan ${unpause ? "unpaused" : "paused"} for wallet: ${wallet}`
    )

    return res
      .status(200)
      .json({
        success: true,
        message: `plan ${unpause ? "unpaused" : "paused"} successfully`,
      })
  } catch (error) {
    combinedLogger.error(
      `Error while pausing/unpausing plan: ${JSON.stringify(
        error,
        Object.getOwnPropertyNames(error)
      )}`
    )
    return res
      .status(500)
      .json({ success: false, message: "internal server error" })
  }
}

const getUser = async (req, res) => {
  try {
    const { wallet } = req.query
    const result = await User.findOne({ userAddress: wallet })

    if (!result) {
      return res
        .status(200)
        .json({ success: false, message: "user not found", data: null })
    }

    // Calculate referral statistics
    const successfulReferralCount = result.referredUsers
      ? result.referredUsers.length
      : 0
    const referralClickCount = result.referralClicks || 0

    // Add referral statistics to the response
    const userData = {
      ...result.toObject(),
      successfulReferralCount,
      referralClickCount,
    }

    return res
      .status(200)
      .json({ success: true, message: "user fetch successful", data: userData })
  } catch (error) {
    combinedLogger.error(
      `Error occurred while fetching user by wallet: ${JSON.stringify(
        error,
        Object.getOwnPropertyNames(error)
      )}`
    )
    return res
      .status(500)
      .json({ success: false, message: "could not find user" })
  }
}

const updateUser = async (req, res) => {
  try {
    const {
      wallet,
      farcasterId,
      username,
      displayName,
      pfpUrl,
      clientFid,
      clientPlatformType,
    } = req.body

    if (!wallet || !isAddress(wallet)) {
      return res
        .status(400)
        .json({ success: false, message: "invalid wallet address" })
    }

    if (
      !farcasterId &&
      !username &&
      !displayName &&
      !pfpUrl &&
      !clientFid &&
      !clientPlatformType
    ) {
      return res
        .status(400)
        .json({ success: false, message: "at least one field is required" })
    }

    const user = await User.findOne({ userAddress: wallet })

    if (!user) {
      return res.status(404).json({ success: false, message: "user not found" })
    }

    const updateData = {}

    // Only update farcasterId if it doesn't exist and is provided
    if (farcasterId && !user.farcasterId) {
      updateData.farcasterId = farcasterId
    }

    // Only update username if it doesn't exist and is provided
    if (username && !user.username) {
      updateData.username = username
    }

    // Only update displayName if it doesn't exist and is provided
    if (displayName && !user.displayName) {
      updateData.displayName = displayName
    }

    // Only update pfpUrl if it doesn't exist and is provided
    if (pfpUrl && !user.pfpUrl) {
      updateData.pfpUrl = pfpUrl
    }

    // Only update clientFid if it doesn't exist and is provided
    if (clientFid && !user.clientFid) {
      updateData.clientFid = clientFid
    }

    // Only update clientPlatformType if it doesn't exist and is provided
    if (clientPlatformType && !user.clientPlatformType) {
      updateData.clientPlatformType = clientPlatformType
    }

    // If no fields to update, return success
    if (Object.keys(updateData).length === 0) {
      return res
        .status(200)
        .json({
          success: true,
          message: "no updates needed - fields already exist",
          data: user,
        })
    }

    const updatedUser = await User.findOneAndUpdate(
      { userAddress: wallet },
      { $set: updateData },
      { new: true }
    )

    return res
      .status(200)
      .json({
        success: true,
        message: "user updated successfully",
        data: updatedUser,
      })
  } catch (error) {
    combinedLogger.error(
      `Error occurred while updating user: ${JSON.stringify(
        error,
        Object.getOwnPropertyNames(error)
      )}`
    )
    return res
      .status(500)
      .json({ success: false, message: "internal server error" })
  }
}

const trackReferralClick = async (req, res) => {
  try {
    const { referrerReferralId } = req.body

    if (!referrerReferralId) {
      return res
        .status(400)
        .json({ success: false, message: "referrerReferralId is required" })
    }

    // Find the user by referralId
    const user = await User.findOne({ referralId: referrerReferralId })

    if (!user) {
      return res
        .status(404)
        .json({
          success: false,
          message: "User with provided referralId not found",
        })
    }

    // Increment referralClicks count
    await User.updateOne(
      { referralId: referrerReferralId },
      { $inc: { referralClicks: 1 } }
    )

    return res
      .status(200)
      .json({ success: true, message: "referral click tracked successfully" })
  } catch (error) {
    combinedLogger.error(
      `Error occurred while tracking referral click: ${JSON.stringify(
        error,
        Object.getOwnPropertyNames(error)
      )}`
    )
    return res
      .status(500)
      .json({ success: false, message: "internal server error" })
  }
}

const getSharePage = async (req, res) => {
  try {
    const { referralId } = req.params

    if (!referralId) {
      return res
        .status(400)
        .json({ success: false, message: "referralId is required" })
    }

    const user = await User.findOne({ referralId })

    if (!user) {
      return res.status(404).json({ success: false, message: "user not found" })
    }

    // Calculate referral statistics
    const successfulReferralCount = user.referredUsers
      ? user.referredUsers.length
      : 0
    const referralClickCount = user.referralClicks || 0
    const paymentsCount = user.payments ? user.payments.length : 0

    // Return only selected fields to prevent doxxing
    const shareData = {
      username: user.username,
      displayName: user.displayName,
      pfpUrl: user.pfpUrl,
      referralId: user.referralId,
      successfulReferralCount,
      referralClickCount,
      btcAmount: user.targetAmount,
      paymentsCount,
      planCadence: user.plan,
      totalInvested: user.totalInvested,
      lastPaid: user.lastPaid,
      amount: user.amount,
    }

    return res
      .status(200)
      .json({
        success: true,
        message: "share page data retrieved successfully",
        data: shareData,
      })
  } catch (error) {
    combinedLogger.error(
      `Error occurred while fetching share page data: ${JSON.stringify(
        error,
        Object.getOwnPropertyNames(error)
      )}`
    )
    return res
      .status(500)
      .json({ success: false, message: "internal server error" })
  }
}

const getLeaderboard = async (req, res) => {
  try {
    const { limit = 10 } = req.query

    // Get users with referral data, sorted by referral count
    const users = await User.find({
      referralId: { $exists: true, $ne: null },
      referredUsers: { $exists: true, $nin: [null, []] },
    })
      .sort({ referredUsers: -1 })
      .limit(parseInt(limit))

    // Transform data to include only selected fields and calculate counts
    const leaderboard = users.map((user) => {
      const successfulReferralCount = user.referredUsers
        ? user.referredUsers.length
        : 0
      const referralClickCount = user.referralClicks || 0

      return {
        username: user.username || user.userAddress,
        displayName: user.displayName,
        pfpUrl: user.pfpUrl,
        referralId: user.referralId,
        successfulReferralCount,
        referralClickCount,
        btcAmount: user.targetAmount,
      }
    })

    return res
      .status(200)
      .json({
        success: true,
        message: "leaderboard retrieved successfully",
        data: leaderboard,
      })
  } catch (error) {
    combinedLogger.error(
      `Error occurred while fetching leaderboard: ${JSON.stringify(
        error,
        Object.getOwnPropertyNames(error)
      )}`
    )
    return res
      .status(500)
      .json({ success: false, message: "internal server error" })
  }
}

module.exports = {
  planSummary,
  getPlan,
  getPayments,
  createPlan,
  getUser,
  pausePlan,
  updateUser,
  trackReferralClick,
  getSharePage,
  getLeaderboard,
}
