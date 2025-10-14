// write a function to get rate of cBTC <-> USDT

const axios = require("axios")
const { combinedLogger } = require("./logger")

const getBTCRate = async (amount) => {
  const url = `https://priceserver-qrwzxck8.b4a.run/coins/price-convert?amount=${amount}&symbol=cbBTC&convert=USD`
  try {
    const response = await axios.get(url)
    combinedLogger.debug(`BTC Price: ${response.data.convertedPrice}`)
    return response.data.convertedPrice
  } catch (error) {
    combinedLogger.error(
      `Error fetching BTC rate: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`
    )
  }
}

const getUSDRate = async (amount) => {
  const url = `https://priceserver-qrwzxck8.b4a.run/coins/price-convert?amount=${amount}&symbol=USD&convert=BTC`
  try {
    const response = await axios.get(url)
    combinedLogger.debug(`USD Rate: ${response.data.convertedPrice}`)
    return response.data.convertedPrice
  } catch (error) {
    combinedLogger.error(
      `Error fetching USD rate: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`
    )
  }
}

module.exports = { getBTCRate, getUSDRate }
