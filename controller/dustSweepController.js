const DustSweep = require("../model/dustSweepModel")
const { ethers } = require("ethers")
const { combinedLogger } = require("../utils/logger")
const { generateSwapCalldata } = require("../utils/generateSwapCalldata")

/**
 * Record a successful dust sweep transaction
 */
const recordDustSweepTransaction = async (req, res) => {
  try {
    const {
      userAddress,
      transactionHash,
      assetsSwept,
      cbbtcReceived,
      usdValue,
    } = req.body

    // Validate required fields
    if (
      !userAddress ||
      !transactionHash ||
      !assetsSwept ||
      !Array.isArray(assetsSwept) ||
      assetsSwept.length === 0 ||
      !cbbtcReceived ||
      !usdValue
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      })
    }

    // Check if transaction already exists
    const existingTransaction = await DustSweep.findOne({
      transactionHash,
    })

    if (existingTransaction) {
      return res.status(400).json({
        success: false,
        message: "Transaction already recorded",
      })
    }

    // Create new dust sweep record
    const dustSweepRecord = new DustSweep({
      userAddress,
      transactionHash,
      assetsSwept,
      cbbtcReceived,
      usdValue,
      status: "completed",
    })

    await dustSweepRecord.save()

    return res.status(201).json({
      success: true,
      message: "Dust sweep transaction recorded successfully",
      data: dustSweepRecord,
    })

    combinedLogger.info(
      `Dust sweep transaction recorded for user: ${userAddress}, tx: ${transactionHash}`
    )
  } catch (error) {
    combinedLogger.error(
      `Error in recordDustSweepTransaction: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`
    )
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    })
  }
}

/**
 * Get dust sweep history for a user
 */
const getDustSweepHistory = async (req, res) => {
  try {
    const { wallet } = req.query
    const { page = 1, limit = 10 } = req.query

    if (!wallet) {
      return res.status(400).json({
        success: false,
        message: "Wallet address is required",
      })
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Get dust sweep history for the user
    const dustSweepHistory = await DustSweep.find({ userAddress: wallet })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const totalCount = await DustSweep.countDocuments({ userAddress: wallet })

    // Calculate total dust swept
    const totalDustSwept = await DustSweep.aggregate([
      { $match: { userAddress: wallet, status: "completed" } },
      {
        $group: {
          _id: null,
          totalCBBTC: { $sum: "$cbbtcReceived" },
          totalUSD: { $sum: "$usdValue" },
          count: { $sum: 1 },
        },
      },
    ])

    return res.status(200).json({
      success: true,
      message: "Dust sweep history retrieved successfully",
      data: {
        history: dustSweepHistory,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / parseInt(limit)),
        },
        summary: totalDustSwept[0] || {
          totalCBBTC: 0,
          totalUSD: 0,
          count: 0,
        },
      },
    })
  } catch (error) {
    combinedLogger.error(`Error in getDustSweepHistory: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`)
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    })
  }
}

/**
 * Update dust sweep transaction status
 */
const updateDustSweepStatus = async (req, res) => {
  try {
    const { transactionHash } = req.params
    const { status, gasUsed, blockNumber } = req.body

    if (!status || !["pending", "completed", "failed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status provided",
      })
    }

    const updateData = { status }
    if (gasUsed) updateData.gasUsed = gasUsed
    if (blockNumber) updateData.blockNumber = blockNumber

    const updatedTransaction = await DustSweep.findOneAndUpdate(
      { transactionHash },
      updateData,
      { new: true }
    )

    if (!updatedTransaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      })
    }

    return res.status(200).json({
      success: true,
      message: "Dust sweep transaction updated successfully",
      data: updatedTransaction,
    })
  } catch (error) {
    combinedLogger.error(`Error in updateDustSweepStatus: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`)
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    })
  }
}

/**
 * Generate swap calldata for dust sweep
 */
const getSwapCalldata = async (req, res) => {
  combinedLogger.info(
    "getSwapCalldata -- Generating swap calldata for dust sweep: " +
      JSON.stringify(req.body, Object.getOwnPropertyNames(req.body))
  )

  try {
    const {
      fromTokenAddress,
      amount,
      toTokenAddress,
      recipient,
      chainId,
      fromTokenDecimals = 18,
    } = req.body

    // Validate required fields
    if (
      !fromTokenAddress ||
      !amount ||
      !toTokenAddress ||
      !recipient ||
      !chainId
    ) {
      combinedLogger.error(
        "getSwapCalldata -- Missing required fields: " +
          JSON.stringify(req.body, Object.getOwnPropertyNames(req.body))
      )
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      })
    }

    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC)

    const data = await generateSwapCalldata(
      fromTokenAddress,
      amount,
      toTokenAddress,
      recipient,
      provider,
      chainId,
      fromTokenDecimals
    )

    return res.status(200).json({ success: true, data })
  } catch (error) {
    combinedLogger.error(
      "getSwapCalldata -- Failed to generate swap calldata: " +
        JSON.stringify(error, Object.getOwnPropertyNames(error))
    )
    return res.status(500).json({
      success: false,
      message: error.message || "Unknown error",
    })
  }
}

module.exports = {
  recordDustSweepTransaction,
  getDustSweepHistory,
  updateDustSweepStatus,
  getSwapCalldata,
}
