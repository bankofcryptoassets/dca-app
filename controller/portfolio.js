const { isAddress } = require("viem")
const { get } = require("../utils/axios")
const { combinedLogger } = require("../utils/logger")

const filterDustSweepableBalances = (portfolioData) => {
  // Logic to flag dust sweepable balances set true when usd equivalent is less than threshold
  let dustSweepableBalance = 0
  if (
    portfolioData &&
    portfolioData.assets &&
    portfolioData.assets.length > 0
  ) {
    portfolioData.assets = portfolioData.assets
      .map((asset) => {
        if (
          asset.estimated_balance &&
          asset.estimated_balance < Number(process.env.DUST_SWEEP_THRESHOLD)
        ) {
          asset.flagDustSweep = true
          dustSweepableBalance += asset.estimated_balance
        } else {
          asset.flagDustSweep = false
        }
        return asset
      })
      ?.filter((asset) => asset.flagDustSweep)
  }

  portfolioData.dust_sweepable_balance = dustSweepableBalance

  return portfolioData
}

const getWalletPortfolio = async (req, res) => {
  const { wallet } = req.query

  if (!wallet || !isAddress(wallet)) {
    return res.status(400).json({ error: "Invalid wallet address" })
  }

  const portfolioData = await get({
    url: `${process.env.MOBULA_BASE_URL}/api/1/wallet/portfolio?wallet=${wallet}&blockchains=base`,
    headers: { Authorization: `${process.env.MOBULA_API_KEY}` },
  }).catch((error) => {
    combinedLogger.error(
      `Error fetching portfolio data: ${JSON.stringify(
        error,
        Object.getOwnPropertyNames(error)
      )}`
    )
    return error
  })

  if (portfolioData instanceof Error) {
    return res
      .status(500)
      .json({
        error: "Failed to fetch portfolio data",
        reason: portfolioData?.data,
      })
  }

  return res
    .status(200)
    .json({
      message: "Portfolio data",
      data: filterDustSweepableBalances(portfolioData?.data),
    })
}

module.exports = { getWalletPortfolio }
