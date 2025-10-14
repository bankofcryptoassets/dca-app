const { ethers } = require("ethers")
const { getBTCRate } = require("../utils/price")
const { provider } = require("../utils/provider")
const { EAC_AGG_PROXY_ABI } = require("../abis/eacAggregatorProxy")
const { combinedLogger } = require("../utils/logger")

const getBtcExchangeRate = async (_, res) => {
  try {
    // const convertedPrice = await getBTCRate(1);
    // return res.status(200).send({
    //     success: true,
    //     message: "price fetch successful",
    //     data: {
    //         convertedPrice
    //     }
    // })
    const contract = new ethers.Contract(
      "0x07DA0E54543a844a80ABE69c8A12F22B3aA59f9D", // ChainLink's EAC Aggregator Proxy
      EAC_AGG_PROXY_ABI,
      provider
    )

    const result = await contract.latestAnswer()

    const convertedPrice = Number((result.toNumber() / 10 ** 8).toFixed(2))

    return res
      .status(200)
      .send({
        success: true,
        message: "price fetch successful",
        data: { convertedPrice },
      })
  } catch (error) {
    combinedLogger.error(
      `Error occurred while fetching btc price: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`
    )
    return res
      .status(500)
      .json({ success: false, message: "internal server error" })
  }
}

module.exports = { getBtcExchangeRate }
