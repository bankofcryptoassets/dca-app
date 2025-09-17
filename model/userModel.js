const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userAddress: { type: String, required: true },
  farcasterId: { type: String },
  // username: { type: String },
  // plans: [{ type: mongoose.Types.ObjectId, ref: "Plan" }],
  plan: { type: String, enum: ["daily", "weekly"], required: true },
  amount: { type: Number, required: true },
  targetAmount: { type: Number, required: true },
  totalInvested: { type: Number, default: 0 },
  planCreated: { type: Date, required: true },
  paused: { type: Boolean, required: true, default: false },
  lastPaid: { type: Date, required: false },
  payments: {type: [String]}, // will contain tx hashes
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  // telegramId: { type: String, default: null },
  // email: { type: String, default: null },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
