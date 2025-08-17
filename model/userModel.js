const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userAddress: { type: String, required: true },
  farcasterId: { type: String },
  username: { type: String },
  plans: [{ type: mongoose.Types.ObjectId, ref: "Plan" }],
  totalInvested: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  telegramId: { type: String, default: null },
  email: { type: String, default: null },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
