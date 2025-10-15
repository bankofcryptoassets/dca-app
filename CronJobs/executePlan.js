const User = require("../model/userModel")
const { Wallet, ethers, Contract } = require("ethers")
const { DCA_ABI } = require("../abis/dca")
const { amplify } = require("../utils/math")
const { generateSwapCalldata } = require("../utils/generateSwapCalldata")
const {
  sendPurchaseConfirmationNotification,
  sendLackOfFundsNotification,
} = require("../utils/notificationUtils")
const { combinedLogger } = require("../utils/logger")
const { getExecutorPrivKey } = require("../aws/secretsManager")
const { getTransactionDetails } = require("../utils/getTransactionDetails")
const { UNISWAPV3_SWAP_ABI } = require("../abis/uniswapv3Swap")

const executePayments = async (plan) => {
  // get all users.
  combinedLogger.info(
    "executePayments -- starting execute payments cron" + plan
  )
  const users = await User.find({ plan, paused: false }).catch((err) => {
    combinedLogger.error(
      "error fetching users for plan: " +
        plan +
        " ,error: " +
        JSON.stringify(err, Object.getOwnPropertyNames(err))
    )
    return
  })
  combinedLogger.info(
    "executePayments -- users: " +
      JSON.stringify(users, Object.getOwnPropertyNames(users))
  )

  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC)
  const swapContractInterface = new ethers.utils.Interface(UNISWAPV3_SWAP_ABI)
  // fetch private key from AWS.
  const executorPvtKey = await getExecutorPrivKey().catch((err) => {
    combinedLogger.error(
      "error fetching executor priv key from secrets manager: " +
        JSON.stringify(err, Object.getOwnPropertyNames(err))
    )
    return
  })

  const wallet = new Wallet(executorPvtKey, provider)
  const contract = new Contract(process.env.DCA_CONTRACT, DCA_ABI, wallet)
  for (const user of users) {
    try {
      combinedLogger.info(
        "executePayments -- trying for user: " + user.userAddress
      )
      const [calldata, gasPrice] = await Promise.all([
        generateSwapCalldata(
          "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
          ethers.utils.parseUnits(user.amount.toString(), 6).toString(),
          "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
          process.env.DCA_CONTRACT,
          provider,
          8453
        ),
        provider.getGasPrice(),
      ])
      combinedLogger.info(
        "executePayments -- calldata: " +
          JSON.stringify(calldata, Object.getOwnPropertyNames(calldata))
      )
      combinedLogger.info(
        "executePayments -- amount: " +
          ethers.utils.parseUnits(user.amount.toString(), 6).toString()
      )
      combinedLogger.info(
        "executePayments -- gasPrice: " +
          JSON.stringify(gasPrice, Object.getOwnPropertyNames(gasPrice))
      )

      const amplifiedGasPrice = amplify(gasPrice, process.env.GAS_PRICE_MARKUP)

      const tx = await contract.executeSwap(
        calldata.calldata,
        user.userAddress,
        ethers.utils.parseUnits(user.amount.toString(), 6).toString(),
        {
          maxFeePerGas: amplifiedGasPrice.toString(),
          maxPriorityFeePerGas: gasPrice.div(4).toString(),
        }
      )
      combinedLogger.info(
        "executePayments -- tx: " +
          JSON.stringify(tx, Object.getOwnPropertyNames(tx))
      )
      const receipt = await tx.wait()
      combinedLogger.info(
        "executePayments -- receipt: " +
          JSON.stringify(receipt, Object.getOwnPropertyNames(receipt))
      )

      // get tx details and store in db
      const txDetails = getTransactionDetails(receipt, swapContractInterface)
      // TODO: store tx details in db

      await User.updateOne(
        { userAddress: user.userAddress },
        {
          $set: {
            totalInvested: user.totalInvested
              ? user.totalInvested + user.amount
              : user.amount,
            lastPaid: Date.now(),
            payments: [...user.payments, receipt.transactionHash],
          },
        }
      )

      /** NOTIFICATIONS */
      // Send purchase confirmation notification
      sendPurchaseConfirmationNotification(user.userAddress, txDetails.cbbtcRaw)

      // TODO: Check for milestone achievements (1%, 2%, 3%, 4%, 5%.........95%, 96%, 97%, 98%, 99%, 100%)
      // Calculate new total invested amount
      // const newTotalInvested = user.totalInvested
      //   ? user.totalInvested + user.amount
      //   : user.amount
      //   const milestonePercentages = [25, 50, 75, 100]
      //   const targetAmount = user.targetAmount
      //   const progressPercentage = (newTotalInvested / targetAmount) * 100

      //   // Check if user just crossed any milestone
      //   const previousProgressPercentage = user.totalInvested
      //     ? (user.totalInvested / targetAmount) * 100
      //     : 0

      //   for (const milestone of milestonePercentages) {
      //     if (
      //       previousProgressPercentage < milestone &&
      //       progressPercentage >= milestone
      //     ) {
      //       sendMilestoneAchievedNotification(
      //         user.userAddress,
      //         milestone,
      //         newTotalInvested
      //       )
      //     }
      //   }
    } catch (error) {
      combinedLogger.error(
        "executePayments -- plan execution failed for wallet: " +
          user.userAddress
      )
      combinedLogger.error(
        "executePayments -- error: " +
          JSON.stringify(error, Object.getOwnPropertyNames(error))
      )

      // Check if it's an insufficient funds error and send notification
      const errorMessage = error.message || error.toString()
      if (
        errorMessage.toLowerCase().includes("insufficient") ||
        errorMessage.toLowerCase().includes("funds") ||
        errorMessage.toLowerCase().includes("balance")
      ) {
        sendLackOfFundsNotification(user.userAddress)
      }
    }

    continue
  }
}

module.exports = { executePayments }
