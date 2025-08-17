const Activity = require("../model/Activity");
const User = require("../model/userModel");

const getUser = async (req, res) => {
  try {
    let user;
    user = await User.findOne({ userAddress: req.params.id });
    if (!user) {
      user = await User.findOne({ farcasterId: req.params.id });
    }
    if (!user) {
      user = await User.findById(req.params.id);
    }
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const getActivity = async (req, res) => {
  try {
    const user = await Activity.findOne({ user: req.param.id }).populate(
      "user"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ activities: user.activities });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = {
  getUser,
  getActivity,
};
