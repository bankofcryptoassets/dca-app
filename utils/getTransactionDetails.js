const { CONTRACT_ADDRESSES } = require("./constants")
const { combinedLogger } = require("./logger")
const {
  calculatePriceFromSqrtPriceX96,
} = require("./calculatePriceFromSqrtPriceX96")

/**
 * Get transaction details
 * @param {ethers.providers.JsonRpcProvider} provider - The provider to use
 * @param {ethers.utils.Interface} swapContractInterface - The contract interface to use
 * @returns {Promise<Object>} The transaction details
 */
const getTransactionDetails = (receipt, swapContractInterface) => {
  try {
    const logs = receipt.logs
    const transactionHash = receipt.transactionHash
    if (logs.length === 0) {
      combinedLogger.error(
        "getTransactionDetails -- No logs found for this transaction." +
          transactionHash
      )
      return null
    }

    const swapLog = logs?.find(
      (log) =>
        log.address.toLowerCase() ===
        CONTRACT_ADDRESSES.UNISWAP_V3_USDC_CBBTC_POOL.toLowerCase()
    )
    if (!swapLog) {
      combinedLogger.error(
        "getTransactionDetails -- No swap log found for this transaction." +
          transactionHash
      )
      return null
    }

    const parsedLog = swapContractInterface.parseLog(swapLog)
    let sqrtPriceX96 = null
    let amount0 = null
    let amount1 = null
    let price = null

    parsedLog.args.forEach((arg, idx) => {
      const input = parsedLog.eventFragment.inputs[idx]
      // console.log(`  ${input.name} (${input.type}): ${arg}`)
      // Extract key values for price calculation
      if (input.name === "sqrtPriceX96") {
        sqrtPriceX96 = arg
      }
      if (input.name === "amount0") {
        amount0 = arg
      }
      if (input.name === "amount1") {
        amount1 = arg
      }
    })

    // Calculate and display price information
    if (sqrtPriceX96) {
      price = calculatePriceFromSqrtPriceX96(sqrtPriceX96, 6, 8)
    }

    return {
      transactionHash,
      price,
      usdcRaw: amount0.toString(),
      cbbtcRaw: amount1.abs().toString(),
      sqrtPriceX96: sqrtPriceX96.toString(),
    }
  } catch (error) {
    combinedLogger.error(
      "getTransactionDetails -- failed for transaction: " +
        receipt.transactionHash +
        " , error: " +
        JSON.stringify(error, Object.getOwnPropertyNames(error))
    )
    return null
  }
}

module.exports = { getTransactionDetails }
