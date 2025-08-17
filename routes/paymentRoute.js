// Get Payment

const { getPayments } = require("../controller/planController");
const router = require("express").Router();

router.get("/:id", getPayments);

module.exports = router;