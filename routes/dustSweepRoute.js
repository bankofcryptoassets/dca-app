const express = require("express")
const router = express.Router()
const {
  recordDustSweepTransaction,
  getDustSweepHistory,
  updateDustSweepStatus,
} = require("../controller/dustSweepController")

// Record a dust sweep transaction
router.post("/transaction", recordDustSweepTransaction)

// Get dust sweep history for a user
router.get("/history", getDustSweepHistory)

// Update dust sweep transaction status
router.patch("/transaction/:transactionHash", updateDustSweepStatus)

module.exports = router
