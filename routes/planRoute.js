// Get Plan

const {
  planSummary,
  getPlan,
  createPlan,
  getUser,
  pausePlan,
  updateUser,
  trackReferralClick,
  getSharePage,
  getLeaderboard,
} = require("../controller/planController")

const router = require("express").Router()

router.post("/summary", planSummary)
router.post("/createPlan", createPlan)
router.post("/trackReferralClick", trackReferralClick)
router.patch("/cancelPlan", pausePlan)
router.patch("/updateUser", updateUser)
router.get("/getUser", getUser)
router.get("/share/:referralId", getSharePage)
router.get("/leaderboard", getLeaderboard)
router.get("/:id", getPlan)
// router.post

module.exports = router
