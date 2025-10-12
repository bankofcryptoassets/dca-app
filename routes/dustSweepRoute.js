const express = require("express")
const router = express.Router()
const {
  recordDustSweepTransaction,
  getDustSweepHistory,
  updateDustSweepStatus,
  getSwapCalldata,
} = require("../controller/dustSweepController")

// Record a dust sweep transaction
router.post("/transaction", recordDustSweepTransaction)

// Get dust sweep history for a user
router.get("/history", getDustSweepHistory)

// Update dust sweep transaction status
router.patch("/transaction/:transactionHash", updateDustSweepStatus)

// Generate swap calldata for dust sweep
router.post("/generate-swap-calldata", getSwapCalldata)

module.exports = router
