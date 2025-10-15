const User = require("../model/userModel")
const Payments = require("../model/paymentsModel")
const { combinedLogger } = require("../utils/logger")
const { ethers } = require("ethers")
const { getTransactionDetails } = require("../utils/getTransactionDetails")
const { UNISWAPV3_SWAP_ABI } = require("../abis/uniswapv3Swap")
const Big = require("big.js")
const dotenv = require("dotenv")
dotenv.config()

const up = async () => {
  try {
    combinedLogger.info(
      "\n\n\n\n\n\n\n\n\n\n\nStarting migration: populating Payments from existing transaction hashes"
    )

    // Get all users with payment hashes
    const users = await User.find({
      payments: { $exists: true, $not: { $size: 0 } },
    })

    combinedLogger.info(`\n\n\nFound ${users.length} users with payment hashes`)

    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC)
    const swapContractInterface = new ethers.utils.Interface(UNISWAPV3_SWAP_ABI)

    let totalProcessed = 0
    let totalErrors = 0
    let failedPayments = []

    for (const user of users) {
      combinedLogger.info(
        `\n\n\nProcessing user: ${user.userAddress} with ${user.payments.length} payments`
      )

      let userTotalInvestedSats = "0"
      let processedPayments = 0

      for (const txHash of user.payments) {
        try {
          // Check if payment detail already exists
          const existingPayment = await Payments.findOne({
            transactionHash: txHash,
          })

          if (existingPayment) {
            combinedLogger.info(
              `\nPayment detail already exists for tx: ${txHash}`
            )
            userTotalInvestedSats = new Big(userTotalInvestedSats)
              .add(existingPayment.cbbtcRaw)
              .toString()
            processedPayments++
            continue
          }

          // Get transaction receipt
          const receipt = await provider.getTransactionReceipt(txHash)
          const executedAt = new Date(
            (await provider.getBlock(receipt.blockNumber)).timestamp * 1000
          )

          if (!receipt) {
            combinedLogger.warn(`\nNo receipt found for tx: ${txHash}`)
            totalErrors++
            failedPayments.push(txHash)
            continue
          }

          // Get transaction details
          const txDetails = getTransactionDetails(
            receipt,
            swapContractInterface
          )

          if (!txDetails) {
            combinedLogger.warn(
              `\nFailed to get transaction details for tx: ${txHash}\n`
            )
            totalErrors++
            failedPayments.push(txHash)
            continue
          }

          // Create payment detail
          const paymentDetail = new Payments({
            user: user._id,
            transactionHash: txHash,
            usdcAmount: txDetails.usdcAmount,
            cbbtcAmount: txDetails.cbbtcAmount,
            price: txDetails.price,
            sqrtPriceX96: txDetails.sqrtPriceX96,
            usdcRaw: txDetails.usdcRaw,
            cbbtcRaw: txDetails.cbbtcRaw,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            gasPrice: receipt.effectiveGasPrice?.toString() || "0",
            planType: user.plan,
            planAmount: user.amount,
            status: "completed",
            executedAt,
          })

          await paymentDetail.save()

          // Add to user's total invested sats
          userTotalInvestedSats = new Big(userTotalInvestedSats)
            .add(txDetails.cbbtcRaw)
            .toString()
          processedPayments++
          totalProcessed++

          combinedLogger.info(`\n\nSuccessfully processed payment: ${txHash}`)
        } catch (error) {
          combinedLogger.error(
            `\n\nError processing payment ${txHash} for user ${user.userAddress}: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}\n\n`
          )
          totalErrors++
          failedPayments.push(txHash)
        }
      }

      // Update user's totalInvestedSats
      if (processedPayments > 0) {
        await User.updateOne(
          { _id: user._id },
          { $set: { totalInvestedSats: userTotalInvestedSats } }
        )
        combinedLogger.info(
          `\n\nUpdated user ${user.userAddress} with totalInvestedSats: ${userTotalInvestedSats}`
        )
      }
    }

    combinedLogger.info(
      `\n\n\n\nMigration completed successfully. Processed: ${totalProcessed} payments, Errors: ${totalErrors}`
    )
    combinedLogger.info(`\n\n\nFailed payments: ${failedPayments.length}`)
    combinedLogger.info(`\n\n\nFailed payments: ${failedPayments}`)
  } catch (error) {
    combinedLogger.error(
      `\n\nError during migration: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`
    )
    throw error
  }
}

const down = async () => {
  try {
    combinedLogger.info(
      "Starting rollback: removing Payments and resetting totalInvestedSats"
    )

    // Remove all Payments
    const deletedPayments = await Payments.deleteMany({})
    combinedLogger.info(
      `Deleted ${deletedPayments.deletedCount} payment details`
    )

    // Reset totalInvestedSats for all users
    const resetUsers = await User.updateMany(
      {},
      { $set: { totalInvestedSats: 0 } }
    )
    combinedLogger.info(
      `Reset totalInvestedSats for ${resetUsers.modifiedCount} users`
    )
  } catch (error) {
    combinedLogger.error(
      `Error during rollback: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`
    )
    throw error
  }
}

module.exports = { up, down }
