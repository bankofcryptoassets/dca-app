const mongoose = require("mongoose")

const paymentsSchema = new mongoose.Schema(
  {
    // Reference to the user who made this payment
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    planType: { type: String, enum: ["daily", "weekly"], required: true },
    planAmount: { type: Number, required: true }, // The planned amount for this payment

    // Transaction details
    transactionHash: { type: String, required: true, unique: true },
    executedAt: { type: Date, required: true },
    blockNumber: { type: String, required: true },
    gasUsed: { type: String, required: true },
    gasPrice: { type: String, required: true },
    status: {
      type: String,
      enum: ["completed", "failed", "pending"],
      default: "completed",
    },

    // Transaction amounts
    usdcAmount: { type: String, required: true },
    cbbtcAmount: { type: String, required: true },
    usdcRaw: { type: String, required: true }, // Raw USDC amount as string
    cbbtcRaw: { type: String, required: true }, // Raw cBBTC amount as string
    price: { type: Number, required: true }, // Calculated price from sqrtPriceX96
    sqrtPriceX96: { type: String, required: true }, // Raw sqrtPriceX96 value
  },
  { timestamps: true }
)

// Index for efficient queries
paymentsSchema.index({ user: 1, executedAt: -1 })

const Payments = mongoose.model("Payments", paymentsSchema)

module.exports = Payments
