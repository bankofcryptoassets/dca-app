// services/recordPaymentEvents.js
const { contract, provider } = require("../constants")
const { ethers } = require("ethers")
const Plan = require("../model/planModel")
const Payment = require("../model/paymentModel")
const { getBTCRate } = require("../utils/price")
const { combinedLogger } = require("../utils/logger")

// Optional envs
const TOKEN_DECIMALS = Number(process.env.TOKEN_DECIMALS || 8)
const DEFAULT_TOKEN = process.env.DEFAULT_TOKEN || "USDC"

/**
 * Scan last 100 blocks for Payment events and persist them.
 */
const recordPaymentEvents = async () => {
  const blockNumber = await provider.getBlockNumber()
  combinedLogger.info(`Latest block number: ${blockNumber}`)

  const fromBlock = Math.max(blockNumber - 100, 0)

  try {
    const paymentEvents = await contract.queryFilter(
      contract.filters.Payment(),
      fromBlock,
      blockNumber
    )

    combinedLogger.info(`Found ${paymentEvents.length} Payment events`)

    for (const event of paymentEvents) {
      await processPaymentEvent(event)
    }
  } catch (error) {
    combinedLogger.error(
      `Error recording payment events: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`
    )
  }
}

/**
 * Process a single Payment event.
 * Expected event args (adjust to your ABI):
 *   Payment(address user, uint256 amount, string planId, string paymentId [, string token])
 */
const processPaymentEvent = async (event) => {
  try {
    const args = event.args || []
    const user = args.user || args[0]
    const amountRaw = args.amount || args[1]
    const planId = args.planId || args[2]
    const paymentId = args.paymentId || args[3]
    const tokenFromEvent = args.token || args[4] // may be undefined

    // Format amount (uint256 -> Number)
    let amount
    try {
      amount = Number(ethers.formatUnits(amountRaw, TOKEN_DECIMALS))
    } catch {
      amount = Number(amountRaw)
    }
    const token = tokenFromEvent || DEFAULT_TOKEN

    combinedLogger.debug(
      `Processing Payment: planId=${planId}, user=${user}, amount=${amount} ${token}, paymentId=${paymentId}`
    )

    // Idempotency: skip if payment already recorded
    const existing = await Payment.findOne({ paymentId }).lean()
    if (existing) {
      combinedLogger.warn(`Payment ${paymentId} already processed. Skipping`)
      return
    }

    // Locate matching plan
    const plan = await Plan.findOne({ planId, userAddress: user })
    if (!plan) {
      combinedLogger.error(`Plan not found for planId=${planId}, user=${user}`)
      return
    }

    // Block timestamp -> lastPayment
    const blk = await provider.getBlock(event.blockNumber)
    const paidAt = new Date(
      ((blk && blk.timestamp) || Math.floor(Date.now() / 1000)) * 1000
    )

    // Create Payment document
    const paymentDoc = new Payment({
      user: plan.user, // reference from Plan
      userAddress: plan.userAddress,
      paymentId,
      planId,
      amount,
      token,
      createdAt: paidAt,
    })
    await paymentDoc.save()

    const amountInUSD = await getBTCRate(amount)

    // Update Plan
    plan.valueAccured = (plan.valueAccured || 0) + amount
    plan.remainingToBePaid = (plan.remainingToBePaid || 0) - amountInUSD
    plan.streak = (plan.streak || 0) + 1
    plan.totalPaid = (plan.totalPaid || 0) + amount
    plan.payments.push(paymentDoc._id)

    await plan.save()

    combinedLogger.info(
      `Marked payment ${paymentId} for Plan ${plan.planId}. New streak=${plan.streak}, totalPaid=${plan.totalPaid}`
    )
  } catch (error) {
    combinedLogger.error(
      `Error processing Payment event: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`
    )
  }
}

module.exports = { recordPaymentEvents, processPaymentEvent }
