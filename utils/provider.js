const { ethers } = require("ethers")

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC)

module.exports = { provider }
