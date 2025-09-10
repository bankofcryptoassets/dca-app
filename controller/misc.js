const { getBTCRate } = require("../utils/price");

const getBtcExchangeRate = async (_, res) => {
    try {
        const convertedPrice = await getBTCRate(1);
        return res.status(200).send({
            success: true,
            message: "price fetch successful",
            data: {
                convertedPrice
            }
        })
    } catch (error) {
        console.log("error occurred while fetching btc price: ", error);
        return res.status(500).json({
            success: false,
            message: "internal server error"
        })
    }
}

module.exports = {
    getBtcExchangeRate
}