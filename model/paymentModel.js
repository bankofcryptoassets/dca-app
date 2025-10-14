const mongoose = require("mongoose")

// eslint-disable-next-line no-unused-vars
const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Types.ObjectId, ref: "User", required: true },
  userAddress: { type: String, required: true },
  paymentId: { type: String, required: true, unique: true },
  planId: { type: String, required: true },
  amount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  token: { type: String, required: true },
})

// const Payment = mongoose.model("Payment", paymentSchema);

// module.exports = Payment;
