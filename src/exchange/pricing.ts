import {
  ADDRESS_ZERO,
  BIG_DECIMAL_1E18,
  BIG_DECIMAL_ONE,
  BIG_DECIMAL_ZERO,
  DAI_WETH_PAIR,
  FACTORY_ADDRESS,
  MINIMUM_LIQUIDITY_THRESHOLD_ETH,
  USDC_WETH_PAIR,
  USDT_WETH_PAIR,
  WETH_ADDRESS
} from '../constants'
import { WHITELIST } from './exchange-constants'
import { Address, BigDecimal, BigInt, dataSource, ethereum, log } from '@graphprotocol/graph-ts'
import { Pair, Token } from '../../generated/schema'

import { Factory as FactoryContract } from '../../generated/templates/Pair/Factory'

// export const uniswapFactoryContract = FactoryContract.bind(Address.fromString("0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"))

export const factoryContract = FactoryContract.bind(FACTORY_ADDRESS)

function selectEthprice(pair: Pair | null): BigDecimal {
  if(!pair) return BIG_DECIMAL_ZERO;
  if(Address.fromString(pair.token0) == WETH_ADDRESS) return pair.token1Price;
  if(Address.fromString(pair.token1) == WETH_ADDRESS) return pair.token0Price;
  return BIG_DECIMAL_ZERO;
}

function selectEthreserve(pair: Pair | null): BigDecimal{
  if(!pair) return BIG_DECIMAL_ZERO;
  if(Address.fromString(pair.token0) == WETH_ADDRESS) return pair.reserve0;
  if(Address.fromString(pair.token1) == WETH_ADDRESS) return pair.reserve1;
  return BIG_DECIMAL_ZERO;
}

export function getEthPrice(block: ethereum.Block = null): BigDecimal {
  // TODO: We can can get weighted averages, but this will do for now.
  // fetch eth prices for each stablecoin
  const daiPair = Pair.load(DAI_WETH_PAIR)
  const usdcPair = Pair.load(USDC_WETH_PAIR)
  const usdtPair = Pair.load(USDT_WETH_PAIR)

  // TODO: the order can be wrong for the pairs above depending on the network
  //       commented out section below can be used when dai is token1 on the first pair

  // Mainnet version
  // DAI -> token1
  // USDC -> token0
  // USDT -> token0
  // all 3 have been created, get the weighted average of them
  log.info(`DAI-WETH Pair : {}`, [DAI_WETH_PAIR])
  log.info(`USDC-WETH Pair : {}`, [USDC_WETH_PAIR])
  log.info(`USDT-WETH Pair : {}`, [USDT_WETH_PAIR])
  // log.info(`DAI PAIR {}`, [daiPair.reserve0.toString()])
  // log.info(`USDC PAIR {}`, [usdcPair.reserve1.toString()])
  // log.info(`USDT PAIR {}`, [usdtPair.reserve1.toString()])

  if (daiPair !== null && usdcPair !== null && usdtPair !== null) {
    const totalLiquidityETH = selectEthreserve(daiPair).plus(selectEthreserve(usdcPair)).plus(selectEthreserve(usdtPair))
    log.info(`Total Liquidity ETH : {}`, [`${totalLiquidityETH}`])
    if(totalLiquidityETH.equals(BIG_DECIMAL_ZERO)) {
       return BIG_DECIMAL_ZERO
    }
    const daiWeight = selectEthreserve(daiPair).div(totalLiquidityETH)
    const usdcWeight = selectEthreserve(usdcPair).div(totalLiquidityETH)
    const usdtWeight = selectEthreserve(usdtPair).div(totalLiquidityETH)  // TODO MAKE THIS CONSISTENT WITH MAINNET
    log.info(`Weight : {}`, [`${daiWeight} ${usdcWeight} ${usdtWeight}`])
    log.info(`Price: {}`, [`${selectEthprice(daiPair).times(daiWeight)} ${selectEthprice(usdcPair).times(usdcWeight)} ${selectEthprice(usdtPair).times(usdtWeight)}`])
    return selectEthprice(daiPair)
      .times(daiWeight)
      .plus(selectEthprice(usdcPair).times(usdcWeight))
      .plus(selectEthprice(usdtPair).times(usdtWeight)) // TODO MAKE THIS CONSISTENT WITH MAINNET
    // dai and USDC have been created
  } else if (daiPair !== null && usdcPair !== null) {
    const totalLiquidityETH = selectEthreserve(daiPair).plus(selectEthreserve(usdcPair))
    if(totalLiquidityETH.equals(BIG_DECIMAL_ZERO)) {
      return BIG_DECIMAL_ZERO
    }
    const daiWeight = selectEthreserve(daiPair).div(totalLiquidityETH)
    const usdcWeight = selectEthreserve(usdcPair).div(totalLiquidityETH)
    return selectEthprice(daiPair).times(daiWeight).plus(selectEthprice(usdcPair).times(usdcWeight))
    // USDC is the only pair so far
  } else if (usdcPair !== null) {
    return selectEthprice(usdcPair)
    // return usdcPair.token1Price
  } else {
    log.warning('No eth pair...', [])
    return BIG_DECIMAL_ZERO
  }

}

export function findEthPerToken(token: Token): BigDecimal {
  if (Address.fromString(token.id) == WETH_ADDRESS) {
    return BIG_DECIMAL_ONE
  }

  // loop through whitelist and check if paired with any
  // TODO: This is slow, and this function is called quite often.
  // What could we do to improve this?
  log.info('enetered function',[]);
  for (let i = 0; i < WHITELIST.length; ++i) {
    // TODO: Cont. This would be a good start, by avoiding multiple calls to getPair...
    log.info('Token outside {} {}',[token.id, WHITELIST[i]])

    const pairAddressResult = factoryContract.try_getPair(Address.fromString(token.id), Address.fromString(WHITELIST[i]))
    let pairAddress = ADDRESS_ZERO;
    if(!pairAddressResult.reverted){
      pairAddress = pairAddressResult.value
    }
    log.info('Pair outside {} {}',[pairAddress.toHex().toString(), MINIMUM_LIQUIDITY_THRESHOLD_ETH.toString()])
    if (pairAddress != ADDRESS_ZERO) {
      const pair = Pair.load(pairAddress.toHex())
      if(pair){
        // log.info('pair in findEthPerToken: pair.id {}  pair.name{} pairAddress {} pair.token0 {} pair.reserveETH {}', [pair.id, pair.name, pairAddress.toHex(), pair.token0,  pair.reserveETH.toString() ]);

        if (pair.token0 == token.id && pair.reserveETH.gt(MINIMUM_LIQUIDITY_THRESHOLD_ETH)) {
          // log.info('token0 price == {} {} {}', [token.id, temp.toString(), pemt.toString()]);
          const token1 = Token.load(pair.token1)
          return token1 !== null ? (pair.token1Price.times(token1.derivedETH as BigDecimal) as BigDecimal) : BigDecimal.fromString("0") // return token1 per our token * Eth per token 1
        }
        // log.info('pair in findEthPerToken: pair.id {}  pair.name{} pairAddress {} pair.token1 {} pair.reserveETH {}', [pair.id, pair.name, pairAddress.toHex(), pair.token1,  pair.reserveETH.toString() ]);
        if (pair.token1 == token.id && pair.reserveETH.gt(MINIMUM_LIQUIDITY_THRESHOLD_ETH)) {
          const token0 = Token.load(pair.token0)
          return token0 !== null ?  (pair.token0Price.times(token0.derivedETH as BigDecimal) as BigDecimal) : BigDecimal.fromString("0") // return token0 per our token * ETH per token 0
        }
      }
    }
  }

  log.info('Nothing was found returning 0', []);
  return BIG_DECIMAL_ZERO // nothing was found return 0
}
