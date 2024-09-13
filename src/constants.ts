import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

export const ADDRESS_ZERO = Address.fromString('0x0000000000000000000000000000000000000000')

export const BIG_DECIMAL_1E6 = BigDecimal.fromString('1e6')

export const BIG_DECIMAL_1E18 = BigDecimal.fromString('1e18')

export const BIG_DECIMAL_ZERO = BigDecimal.fromString('0')

export const BIG_DECIMAL_ONE = BigDecimal.fromString('1')

export const BIG_INT_ONE = BigInt.fromI32(1)

export const BIG_INT_ZERO = BigInt.fromI32(0)

export const FACTORY_ADDRESS = Address.fromString('0x0f8018bd90c61ee0b4d3c75b0fbde738a70b788e')

export const NULL_CALL_RESULT_VALUE = '0x0000000000000000000000000000000000000000000000000000000000000001'

// TODO: DAI address to be updated
export const DAI_WETH_PAIR = '0x1a09da9d1dfc0d358ae91c75c290d25b65b19aeb' // TODO 0 => Needs to be NONCHECKSUMED

export const USDC_WETH_PAIR = '0xb0a1810138522a0520b22a072afbd8024e34d4f1'

export const USDT_WETH_PAIR = '0xfcd5d7c56329a1ca2f7b263f3703932c98f1addb'

// minimum liquidity required to count towards tracked volume for pairs with small # of Lps
export const MINIMUM_USD_THRESHOLD_NEW_PAIRS = BigDecimal.fromString('0')

// minimum liquidity for price to get tracked
export const MINIMUM_LIQUIDITY_THRESHOLD_ETH = BigDecimal.fromString('0')

export const WETH_ADDRESS = Address.fromString('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2')
