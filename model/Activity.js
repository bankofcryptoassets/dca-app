// models/Activity.js
const mongoose = require("mongoose")
const { Schema } = mongoose

const ActivitySchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, enum: ["CREATE-PLAN", "PAYMENT"], required: true },
  refId: { type: Schema.Types.ObjectId, refPath: "onModel" },
  onModel: { type: String, enum: ["Plan", "Payment"] },
  timestamp: { type: Date, default: Date.now },
})

// const Activity = mongoose.model("Activity", ActivitySchema);

// module.exports = Activity;
