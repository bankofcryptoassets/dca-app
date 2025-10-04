const mongoose = require("mongoose")

/**
 * Stores dust sweep transaction history
 * Tracks successful dust sweep conversions to cBBTC
 */
const dustSweepSchema = new mongoose.Schema(
  {
    userAddress: {
      type: String,
      required: true,
      index: true,
    },
    transactionHash: {
      type: String,
      required: true,
      unique: true,
    },
    // Basic info about the sweep
    assetsSwept: {
      type: Number,
      required: true,
    },
    cbbtcReceived: {
      type: Number,
      required: true,
    },
    usdValue: {
      type: Number,
      required: true,
    },
    // Transaction status
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "completed",
    },
  },
  {
    timestamps: true,
  }
)

// Index for efficient queries
dustSweepSchema.index({ userAddress: 1, timestamp: -1 })
dustSweepSchema.index({ transactionHash: 1 })

const DustSweep = mongoose.model("DustSweep", dustSweepSchema)

module.exports = DustSweep
