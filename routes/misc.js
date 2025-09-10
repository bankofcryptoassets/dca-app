const { getBtcExchangeRate } = require("../controller/misc");
const router = require("express").Router();

router.get("/btcExchangeRate", getBtcExchangeRate);

module.exports = router;