// Get Payment

const {
  getPaymentById,
  getPaymentsByUserId,
} = require("../controller/paymentController")

const router = require("express").Router()

router.get("/:id", getPaymentById)
router.get("/user/:userId", getPaymentsByUserId)

module.exports = router
