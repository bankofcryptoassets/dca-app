const DCA_ABI = [
	{
		inputs: [
			{ internalType: 'address', name: '_usdcAddress', type: 'address' },
			{ internalType: 'address', name: '_executor', type: 'address' },
			{
				internalType: 'address',
				name: '_uniswapRouter',
				type: 'address',
			},
			{ internalType: 'address', name: '_cbbtcAddress', type: 'address' },
			{
				components: [
					{
						internalType: 'uint24',
						name: 'uniswapPoolFee',
						type: 'uint24',
					},
					{
						internalType: 'uint16',
						name: 'slippage',
						type: 'uint16',
					},
				],
				internalType: 'struct DCAPlan.UniswapHelperConfig',
				name: '_uniswapHelperConfig',
				type: 'tuple',
			},
		],
		stateMutability: 'nonpayable',
		type: 'constructor',
	},
	{ inputs: [], name: 'InvalidAddress', type: 'error' },
	{ inputs: [], name: 'InvalidAmount', type: 'error' },
	{ inputs: [], name: 'InvalidQuotePrice', type: 'error' },
	{ inputs: [], name: 'InvalidSlippage', type: 'error' },
	{ inputs: [], name: 'InvalidSwapData', type: 'error' },
	{ inputs: [], name: 'InvalidUser', type: 'error' },
	{ inputs: [], name: 'OnlyExecutor', type: 'error' },
	{ inputs: [], name: 'OnlyOwner', type: 'error' },
	{
		inputs: [{ internalType: 'bytes', name: 'data', type: 'bytes' }],
		name: 'SwapFailed',
		type: 'error',
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: 'address',
				name: 'user',
				type: 'address',
			},
			{
				indexed: false,
				internalType: 'uint256',
				name: 'amount',
				type: 'uint256',
			},
		],
		name: 'CBBTCDepositSuccess',
		type: 'event',
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: 'address',
				name: 'user',
				type: 'address',
			},
			{
				indexed: false,
				internalType: 'uint256',
				name: 'amount',
				type: 'uint256',
			},
		],
		name: 'CBBTCWithdrawal',
		type: 'event',
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: 'address',
				name: '_tokenIn',
				type: 'address',
			},
			{
				indexed: false,
				internalType: 'address',
				name: '_tokenOut',
				type: 'address',
			},
			{
				indexed: false,
				internalType: 'uint256',
				name: '_amountIn',
				type: 'uint256',
			},
			{
				indexed: false,
				internalType: 'uint256',
				name: '_amountOutMin',
				type: 'uint256',
			},
		],
		name: 'UniswapReverted',
		type: 'event',
	},
	{
		inputs: [
			{ internalType: 'address', name: '_user', type: 'address' },
			{ internalType: 'uint256', name: '_amountIn', type: 'uint256' },
		],
		name: 'executeDCA',
		outputs: [
			{ internalType: 'uint256', name: '_amountOut', type: 'uint256' },
		],
		stateMutability: 'nonpayable',
		type: 'function',
	},
	{
		inputs: [
			{ internalType: 'bytes', name: 'swapData', type: 'bytes' },
			{ internalType: 'address', name: '_user', type: 'address' },
			{ internalType: 'uint256', name: '_amountIn', type: 'uint256' },
		],
		name: 'executeSwap',
		outputs: [{ internalType: 'bytes', name: 'result', type: 'bytes' }],
		stateMutability: 'nonpayable',
		type: 'function',
	},
	{
		inputs: [{ internalType: 'uint24', name: '_poolFee', type: 'uint24' }],
		name: 'setPoolFee',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function',
	},
	{
		inputs: [{ internalType: 'uint16', name: '_slippage', type: 'uint16' }],
		name: 'setSlippage',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function',
	},
	{
		inputs: [
			{
				internalType: 'address',
				name: '_uniswapRouter',
				type: 'address',
			},
		],
		name: 'setUniswapRouter',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function',
	},
	{
		inputs: [],
		name: 'uniswapRouter',
		outputs: [
			{ internalType: 'contract ISwapRouter', name: '', type: 'address' },
		],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [{ internalType: 'address', name: '', type: 'address' }],
		name: 'usersBalance',
		outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [],
		name: 'withdrawCBBTC',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function',
	},
];
module.exports = {
	DCA_ABI
}
