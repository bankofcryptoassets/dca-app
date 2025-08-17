// Get Plan

const { planSummary, getPlan } = require("../controller/planController");

const router = require("express").Router();

router.post("/summary", planSummary);
router.get("/:id", getPlan);

module.exports = router;