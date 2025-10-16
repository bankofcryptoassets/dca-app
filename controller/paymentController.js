const Payments = require("../model/paymentsModel")
const { combinedLogger } = require("../utils/logger")

const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params
    const payment = await Payments.findById(id)
    if (!payment) {
      combinedLogger.error(`Payment not found for id: ${id}`)
      return res
        .status(404)
        .json({ success: false, message: "payment not found" })
    }
    return res
      .status(200)
      .json({
        success: true,
        message: "payment fetched successfully",
        data: payment,
      })
  } catch (error) {
    combinedLogger.error(
      `Error occurred while fetching payment: ${JSON.stringify(
        error,
        Object.getOwnPropertyNames(error)
      )}`
    )
    return res
      .status(500)
      .json({ success: false, message: "internal server error" })
  }
}

const getPaymentsByUserId = async (req, res) => {
  try {
    const { userId } = req.params
    const payments = await Payments.find({ user: userId })
      .sort({ executedAt: -1 })
      .select(
        "_id planType planAmount transactionHash executedAt status usdcAmount cbbtcAmount usdcRaw cbbtcRaw price"
      )
    if (!payments?.length) {
      combinedLogger.error(`Payments not found for user id: ${userId}`)
      return res
        .status(404)
        .json({ success: false, message: "payments not found" })
    }
    return res
      .status(200)
      .json({
        success: true,
        message: "payments fetched successfully",
        data: payments,
      })
  } catch (error) {
    combinedLogger.error(
      `Error occurred while fetching payments by user id: ${JSON.stringify(
        error,
        Object.getOwnPropertyNames(error)
      )}`
    )
    return res
      .status(500)
      .json({ success: false, message: "internal server error" })
  }
}

module.exports = { getPaymentById, getPaymentsByUserId }
