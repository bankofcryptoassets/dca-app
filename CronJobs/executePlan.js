const User = require("../model/userModel");
const {Wallet, ethers, Contract} = require("ethers");
const { getBTCRate } = require("../utils/price");
const { DCA_ABI } = require("../abis/dca");
const {Token, CurrencyAmount, TradeType, Percent} = require("@uniswap/sdk-core");
const { AlphaRouter, SwapType } = require("@uniswap/smart-order-router");


async function generateSwapCalldata(
    fromTokenAddress,
    amount,          // input amount in token decimals, e.g. '1000000000000000000' for 1 ETH
    toTokenAddress,
    recipient,       // the receiver address
    provider, // Ethers provider
    chainId          // e.g., 1 for mainnet
) {
    // Construct Token objects (you need token decimals)
    const fromToken = new Token(chainId, fromTokenAddress, 6); // update decimals accordingly
    const toToken = new Token(chainId, toTokenAddress, 8);      // update decimals accordingly
    const router = new AlphaRouter({ chainId, provider });
    const amountIn = CurrencyAmount.fromRawAmount(fromToken, amount);
    const route = await router.route(
        amountIn,
        toToken,
        TradeType.EXACT_INPUT,
        {
            type: SwapType.SWAP_ROUTER_02,
            recipient,
            slippageTolerance: new Percent(5, 100), // 5%
            deadline: Math.floor(Date.now() / 1000 + 1800), // 30 min deadline
        }
    );

    if (!route || !route.methodParameters) throw new Error("No route loaded");

    console.log("swap calldata generated");
    console.log("route: ", route);

    // Outputs: calldata and value for swap
    return {
        to: route.methodParameters.to,
        calldata: route.methodParameters.calldata,
        value: route.methodParameters.value
    };
}

const executePayments = async (plan) => {
    // get all users.
    console.log('\x1b[33m%s\x1b[0m', 'starting execute payments cron');
    const users = await User.find({plan});
    console.log(users);

    const oneCbbtc = await getBTCRate(1);
    console.log('\x1b[33m%s\x1b[0m', "oneCbbtc", oneCbbtc);

    const provider = new ethers.providers.JsonRpcProvider(
        process.env.RPC
    );
    const wallet = new Wallet(
        process.env.EXECUTOR,
        provider
    );
    const contract = new Contract(
        process.env.DCA_CONTRACT,
        DCA_ABI,
        wallet
    );
    console.log(wallet.address);
    for(const user of users) {
        try {
            console.log("\n\n\n");
            console.log("trying for user: ", user.userAddress);
            const {calldata} = await generateSwapCalldata(
                "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
                ethers.utils.parseUnits(user.amount.toString(), 6).toString(),
                "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
                process.env.DCA_CONTRACT,
                provider,
                8453
            );
            console.log("calldata:: ", calldata);
            console.log("amount:: ", ethers.utils.parseUnits(user.amount.toString(), 6).toString());
            
            const tx = await contract.executeSwap(
                calldata,
                user.userAddress,
                ethers.utils.parseUnits(user.amount.toString(), 6).toString()
            );
            console.log("tx:: ", tx);
            const receipt = await tx.wait();
            console.log("receipt:: ", receipt);
            console.log("\n\n\n");

            await User.updateOne(
                {
                    userAddress: user.userAddress
                },
                {
                    $set: {
                        totalInvested: user.totalInvested ? user.totalInvested + user.amount : user.amount,
                        lastPaid: Date.now(),
                        payments: [...user.payments, receipt.transactionHash],
                    }
                }
            );
        } catch (error) {
            console.log("plan execution failed for wallet: ", user.userAddress);
            console.log("error: ", JSON.stringify(error));
            continue;
        }
    }
}

module.exports = {
    executePayments
}
