const Big = require("big.js")
const { combinedLogger } = require("./logger")

const calculatePriceFromSqrtPriceX96 = (
  sqrtPriceX96,
  token0Decimals = 6, // USDC
  token1Decimals = 8 // cbBTC
) => {
  try {
    const decimalAdjustment = new Big(10).pow(token1Decimals - token0Decimals)
    const sqrtPriceX96Pow2 = new Big(sqrtPriceX96).pow(2)
    const twoPow192 = new Big(2).pow(192)
    const sqrtPriceX96Pow2Div2Pow192 = sqrtPriceX96Pow2.div(twoPow192)
    const price = decimalAdjustment
      .div(sqrtPriceX96Pow2Div2Pow192)
      .round(2)
      ?.toString()
    return price
  } catch (error) {
    combinedLogger.error(
      `calculatePriceFromSqrtPriceX96 -- error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`
    )
    return "0"
  }
}

module.exports = { calculatePriceFromSqrtPriceX96 }
