const { BigNumber } = require("ethers")

const amplify = (a, b) => {
    return BigNumber.from(a).add(
        BigNumber.from(a).mul(BigNumber.from(b)).div(100)
    )
}

module.exports = {
    amplify
}
