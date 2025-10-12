const {
  Token,
  CurrencyAmount,
  TradeType,
  Percent,
} = require("@uniswap/sdk-core")
const { AlphaRouter, SwapType } = require("@uniswap/smart-order-router")

const generateSwapCalldata = async (
  fromTokenAddress,
  amount, // input amount in token decimals, e.g. '1000000000000000000' for 1 ETH
  toTokenAddress,
  recipient, // the receiver address
  provider, // Ethers provider
  chainId, // e.g., 1 for mainnet
  fromTokenDecimals = 6
) => {
  // Construct Token objects (you need token decimals)
  const fromToken = new Token(chainId, fromTokenAddress, fromTokenDecimals || 6) // update decimals accordingly
  const toToken = new Token(chainId, toTokenAddress, 8) // cbbtc decimals => 8
  const router = new AlphaRouter({ chainId, provider })
  const amountIn = CurrencyAmount.fromRawAmount(fromToken, amount)
  const route = await router.route(amountIn, toToken, TradeType.EXACT_INPUT, {
    type: SwapType.SWAP_ROUTER_02,
    recipient,
    slippageTolerance: new Percent(5, 100), // 5%
    deadline: Math.floor(Date.now() / 1000 + 1800), // 30 min deadline
  })

  if (!route || !route.methodParameters) {
    combinedLogger.error(
      "generateSwapCalldata -- route: " +
        JSON.stringify(route, Object.getOwnPropertyNames(route))
    )
    throw new Error("No route loaded")
  }

  combinedLogger.info("generateSwapCalldata -- swap calldata generated")

  // Outputs: calldata and value for swap
  return {
    to: route.methodParameters.to,
    calldata: route.methodParameters.calldata,
    value: route.methodParameters.value,
  }
}

module.exports = { generateSwapCalldata }
