const mongoose = require("mongoose")

const planSchema = new mongoose.Schema({
  user: { type: mongoose.Types.ObjectId, ref: "User", required: true },
  userAddress: { type: String, required: true },
  planId: { type: String, required: true, unique: true },
  btcAmount: { type: Number, required: true },
  initialPay: { type: Number },
  totalPaid: { type: Number },
  remainingToBePaid: { type: Number },
  valueAccured: { type: Number },
  status: {
    type: String,
    enum: ["active", "liquidating", "inactive", "liquidated"],
    default: "active",
  },
  intervalPayable: { type: Number },
  streak: { type: Number, default: 0 },
  daysCompleted: { type: Number, default: 0 },
  daysToComplete: { type: Number },
  paymentInterval: {
    type: String,
    enum: ["daily", "weekly"],
    default: "daily",
  },
  payments: [{ type: mongoose.Types.ObjectId, ref: "Payment" }],
  nextPayment: { type: Date },
  lastPayment: { type: Date },

  createdAt: { type: Date, default: Date.now },
  nearLiquidation: { type: Boolean, default: false },
  slashAblePercentage: { type: Number },
  rewardsEarned: { type: Number, default: 0 },
})

// const Plan = mongoose.model("Plan", planSchema);

// module.exports = Plan;
