const mongoose = require("mongoose")

const userSchema = new mongoose.Schema(
  {
    // user fields
    userAddress: { type: String, required: true },
    farcasterId: { type: String },
    username: { type: String },
    displayName: { type: String },
    pfpUrl: { type: String },
    clientFid: { type: String },
    clientPlatformType: { type: String },
    // telegramId: { type: String, default: null },
    // email: { type: String, default: null },

    // Plan fields
    // plans: [{ type: mongoose.Types.ObjectId, ref: "Plan" }],
    plan: { type: String, enum: ["daily", "weekly"], required: true },
    amount: { type: Number, required: true },
    targetAmount: { type: Number, required: true },
    totalInvested: { type: Number, default: 0 },
    planCreated: { type: Date, required: true },
    paused: { type: Boolean, required: true, default: false },
    lastPaid: { type: Date, required: false },
    payments: { type: [String] }, // will contain tx hashes
    // TODO: PAYMENT DETAILS
    // payment details model with one to one relation with user
    // totalInvestedSats

    // Referral system fields
    referralId: { type: String, unique: true, required: true }, // Unique referral ID generated from userAddress
    referredUsers: { type: [String], default: [] }, // Array of referralIds that this user referred
    referredBy: { type: String, default: null }, // referralId of the user who referred this user
    referralClicks: { type: Number, default: 0 }, // Number of clicks on this user's referral link

    // Notification settings
    notificationSettings: {
      purchaseConfirmations: { type: Boolean, default: true },
      lackOfFunds: { type: Boolean, default: true },
      milestonesAchieved: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
)

const User = mongoose.model("User", userSchema)

module.exports = User
