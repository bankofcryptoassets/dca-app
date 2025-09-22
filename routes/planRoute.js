// Get Plan

const {
  planSummary,
  getPlan,
  createPlan,
  getUser,
  pausePlan,
  updateUser,
} = require("../controller/planController")

const router = require("express").Router()

router.post("/summary", planSummary)
router.post("/createPlan", createPlan)
router.patch("/cancelPlan", pausePlan)
router.patch("/updateUser", updateUser)
router.get("/getUser", getUser)
router.get("/:id", getPlan)
// router.post

module.exports = router
