const { isAddress } = require("viem");
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

const createPlan = async(req, res) => {
  try {
    const { wallet, amount, target, planType } = req.body;

    if(!wallet || !isAddress(wallet)) {
      return res.status(400).json({
        success: false,
        message: "invalid wallet address"
      });
    }

    if(!amount || !target || isNaN(amount) || isNaN(target)) {
      return res.status(400).json({
        success: false,
        message: "invalid amount or target"
      });
    }

    console.log({ wallet, amount, target, planType });

    if(planType !== "daily" && planType !== "weekly") {
      return res.status(400).json({
        success: false,
        message: "invalid plan type"
      });
    }

    const newUser = new User({
      amount,
      userAddress: wallet,
      payments: [],
      lastPaid: null,
      plan: planType,
      planCreated: Date.now(),
      targetAmount: target,
      totalInvested: 0
    });

    const ret = await newUser.save().catch((err) => {
      console.log("error occurred while saving user to db: ", JSON.stringify(err));
      return err;
    });

    if(ret instanceof Error) {
      return res.status(500).json({
        success: false,
        message: "internal server error, could not save in db"
      });
    }

    return res.status(201).json({
      success: true,
      message: "new user created"
    });
  } catch (error) {
    console.log("error occurred while creating plan: ", JSON.stringify(error));
    return res.status(500).json({
      success: false,
      message: "internal server error"
    })
  }
}

const getUser = async(req, res) => {
  try {
    const {wallet} = req.query;
    const result = await User.findOne({
      userAddress: wallet
    });

    console.log("result: ", result);

    return res.status(200).json({
      success: true,
      message: "user fetch successful",
      data: result
    })
  } catch (error) {
    console.log("error occurred while fetching user by wallet: ", error);
    return res.status(500).json({
      success: false,
      message: "could not find user"
    });
  }
}

module.exports = {
  planSummary,
  getPlan,
  getPayments,
  createPlan,
  getUser
};
