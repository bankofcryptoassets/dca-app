const { isAddress } = require("viem")
const Payment = require("../model/paymentModel")
const Plan = require("../model/planModel")
const User = require("../model/userModel")
const { getBTCRate } = require("../utils/price")
const { generateReferralId } = require("../utils/referral")

const planSummary = async (req, res) => {
  const { btcAmount, initialPay, pledgedPay } = req.body

  const btcInUsd = await getBTCRate(btcAmount)

  const remainingAmount = btcInUsd - initialPay
  const timeNeededToComplete = remainingAmount / pledgedPay

  res.status(200).json({
    btcInUsd,
    remainingAmount,
    timeNeededToComplete,
  })
}

const getPlan = async (req, res) => {
  let plan

  plan = await Plan.findOne({ _id: req.params.id }).populate("user payments")
  if (!plan) {
    plan = await Plan.findOne({ planId: req.params.id }).populate(
      "user payments"
    )
  }

  res.status(200).json({
    plan,
  })
}

const getPayments = async (req, res) => {
  try {
    let payment

    payment = payment = await Payment.findOne({
      paymentId: req.param.id,
    }).populate("user")

    if (!payment) {
      payment = await Payment.findById(req.param.id).populate("user")
    }

    res.status(200).json({
      payment,
    })
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
      referrerReferralId,
    } = req.body

    if (!wallet || !isAddress(wallet)) {
      return res.status(400).json({
        success: false,
        message: "invalid wallet address",
      })
    }

    if (!amount || !target || isNaN(amount) || isNaN(target)) {
      return res.status(400).json({
        success: false,
        message: "invalid amount or target",
      })
    }

    console.log({
      wallet,
      amount,
      target,
      planType,
      referrerReferralId,
    })

    if (planType !== "daily" && planType !== "weekly") {
      return res.status(400).json({
        success: false,
        message: "invalid plan type",
      })
    }

    // Generate user's referralId from userAddress
    const referralId = generateReferralId(wallet)

    const newUser = new User({
      amount: Number(amount).toFixed(2),
      userAddress: wallet,
      farcasterId,
      username,
      referralId,
      payments: [],
      lastPaid: null,
      plan: planType,
      planCreated: Date.now(),
      targetAmount: Number(target).toFixed(6),
      totalInvested: 0,
    })

    const ret = await newUser.save().catch((err) => {
      console.log(
        "error occurred while saving user to db: ",
        JSON.stringify(err)
      )
      return err
    })

    if (ret instanceof Error) {
      return res.status(500).json({
        success: false,
        message: "internal server error, could not save in db",
      })
    }

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
            {
              $set: {
                referredBy: referringUser.referralId,
                updatedAt: Date.now(),
              },
            }
          )
          // Add the new user's referralId to the referring user's referredUsers array
          await User.updateOne(
            { userAddress: referringUser.userAddress },
            {
              $addToSet: { referredUsers: referralId },
              $set: { updatedAt: Date.now() },
            }
          )
        }
      } catch (referralError) {
        console.log("Error processing referral:", referralError)
        // Don't fail the plan creation if referral processing fails
      }
    }

    return res.status(201).json({
      success: true,
      message: "new user created",
    })
  } catch (error) {
    console.log("error occurred while creating plan: ", JSON.stringify(error))
    return res.status(500).json({
      success: false,
      message: "internal server error",
    })
  }
}

const pausePlan = async (req, res) => {
  try {
    const { wallet, unpause } = req.body
    const result = await User.findOne({
      userAddress: wallet,
    })

    if (!result) {
      return res.status(400).json({
        success: false,
        message: "invalid wallet address",
      })
    }

    await User.updateOne(
      {
        userAddress: wallet,
      },
      {
        $set: {
          paused: unpause ? false : true,
        },
      }
    )

    return res.status(200).json({
      success: true,
      message: `plan ${unpause ? "unpaused" : "paused"} successfully`,
    })
  } catch (error) {
    console.log("error while pausing/unpausing plan: ", JSON.stringify(error))
    return res.status(500).json({
      success: false,
      message: "internal server error",
    })
  }
}

const getUser = async (req, res) => {
  try {
    const { wallet } = req.query
    const result = await User.findOne({
      userAddress: wallet,
    })

    if (!result) {
      return res.status(200).json({
        success: false,
        message: "user not found",
        data: null,
      })
    }

    console.log("result: ", result)

    // Calculate referral statistics
    const successfulReferralCount = result.referredUsers
      ? result.referredUsers.length
      : 0
    const referralClickCount = result.referralClicks
      ? result.referralClicks.length
      : 0

    // Add referral statistics to the response
    const userData = {
      ...result.toObject(),
      successfulReferralCount,
      referralClickCount,
    }

    return res.status(200).json({
      success: true,
      message: "user fetch successful",
      data: userData,
    })
  } catch (error) {
    console.log("error occurred while fetching user by wallet: ", error)
    return res.status(500).json({
      success: false,
      message: "could not find user",
    })
  }
}

const updateUser = async (req, res) => {
  try {
    const { wallet, farcasterId, username } = req.body

    if (!wallet || !isAddress(wallet)) {
      return res.status(400).json({
        success: false,
        message: "invalid wallet address",
      })
    }

    if (!farcasterId && !username) {
      return res.status(400).json({
        success: false,
        message: "farcasterId or username is required",
      })
    }

    const user = await User.findOne({
      userAddress: wallet,
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "user not found",
      })
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

    // If no fields to update, return success
    if (Object.keys(updateData).length === 0) {
      return res.status(200).json({
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

    return res.status(200).json({
      success: true,
      message: "user updated successfully",
      data: updatedUser,
    })
  } catch (error) {
    console.log("error occurred while updating user: ", error)
    return res.status(500).json({
      success: false,
      message: "internal server error",
    })
  }
}

const trackReferralClick = async (req, res) => {
  try {
    const { farcasterId, referrerReferralId } = req.body

    if (!referrerReferralId) {
      return res.status(400).json({
        success: false,
        message: "referrerReferralId is required",
      })
    }

    // If farcasterId is provided, validate it
    if (farcasterId && (!farcasterId || farcasterId.trim() === "")) {
      return res.status(400).json({
        success: false,
        message: "invalid farcasterId",
      })
    }

    // Find the user by referralId
    const user = await User.findOne({ referralId: referrerReferralId })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User with provided referralId not found",
      })
    }

    // If farcasterId is provided, add it to referralClicks array
    if (farcasterId) {
      await User.updateOne(
        { referralId: referrerReferralId },
        {
          $addToSet: { referralClicks: farcasterId },
          $set: { updatedAt: Date.now() },
        }
      )
    }

    return res.status(200).json({
      success: true,
      message: "referral click tracked successfully",
    })
  } catch (error) {
    console.log("error occurred while tracking referral click: ", error)
    return res.status(500).json({
      success: false,
      message: "internal server error",
    })
  }
}

const getSharePage = async (req, res) => {
  try {
    const { referralId } = req.params

    if (!referralId) {
      return res.status(400).json({
        success: false,
        message: "referralId is required",
      })
    }

    const user = await User.findOne({ referralId })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "user not found",
      })
    }

    // Calculate referral statistics
    const successfulReferralCount = user.referredUsers
      ? user.referredUsers.length
      : 0
    const referralClickCount = user.referralClicks
      ? user.referralClicks.length
      : 0
    const paymentsCount = user.payments ? user.payments.length : 0

    // Return only selected fields to prevent doxxing
    const shareData = {
      username: user.username,
      referralId: user.referralId,
      successfulReferralCount,
      referralClickCount,
      btcAmount: user.targetAmount,
      paymentsCount,
      planCadence: user.plan,
      totalInvested: user.totalInvested,
      lastPaid: user.lastPaid,
    }

    return res.status(200).json({
      success: true,
      message: "share page data retrieved successfully",
      data: shareData,
    })
  } catch (error) {
    console.log("error occurred while fetching share page data: ", error)
    return res.status(500).json({
      success: false,
      message: "internal server error",
    })
  }
}

const getLeaderboard = async (req, res) => {
  try {
    const { limit = 10 } = req.query

    // Get users with referral data, sorted by referral count
    const users = await User.find({
      referralId: { $exists: true, $ne: null },
      username: { $exists: true, $ne: null },
    })
      .select("username referralId referredUsers referralClicks targetAmount")
      .sort({ referredUsers: -1 })
      .limit(parseInt(limit))

    // Transform data to include only selected fields and calculate counts
    const leaderboard = users.map((user) => {
      const successfulReferralCount = user.referredUsers
        ? user.referredUsers.length
        : 0
      const referralClickCount = user.referralClicks
        ? user.referralClicks.length
        : 0

      return {
        username: user.username,
        referralId: user.referralId,
        successfulReferralCount,
        referralClickCount,
        btcAmount: user.targetAmount,
      }
    })

    return res.status(200).json({
      success: true,
      message: "leaderboard retrieved successfully",
      data: leaderboard,
    })
  } catch (error) {
    console.log("error occurred while fetching leaderboard: ", error)
    return res.status(500).json({
      success: false,
      message: "internal server error",
    })
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
