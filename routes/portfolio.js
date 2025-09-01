const { getWalletPortfolio } = require("../controller/portfolio");

const router = require("express").Router();

router.get("/portfolio", getWalletPortfolio);

module.exports = router;