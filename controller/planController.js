const Payment = require("../model/paymentModel");
const Plan = require("../model/planModel");
const User = require("../model/userModel");
const { getBTCRate } = require("../utils/price");

const planSummary = async (req, res) => {
  const { btcAmount, initialPay, pledgedPay } = req.body;

  const btcInUsd = await getBTCRate(btcAmount);

  const remainingAmount = btcInUsd - initialPay;
  const timeNeededToComplete = remainingAmount / pledgedPay;

  res.status(200).json({
    btcInUsd,
    remainingAmount,
    timeNeededToComplete,
  });
};

const getPlan = async (req, res) => {
  let plan;

  plan = await Plan.findOne({ _id: req.params.id }).populate("user payments");
  if (!plan) {
    plan = await Plan.findOne({ planId: req.params.id }).populate(
      "user payments"
    );
  }

  res.status(200).json({
    plan,
  });
};

const getPayments = async (req, res) => {
  try {
    let payment;

    payment = payment = await Payment.findOne({
      paymentId: req.param.id,
    }).populate("user");

    if (!payment) {
      payment = await Payment.findById(req.param.id).populate("user");
    }

    res.status(200).json({
      payment,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = {
  planSummary,
  getPlan,
  getPayments,
};
