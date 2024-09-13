import { BigDecimal, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { Token, TokenDayData, TokenHourData } from '../../../generated/schema'

import { BIG_DECIMAL_ZERO } from '../../constants'
import { getBundle } from '.'

export function getTokenHourData(token: Token, id: string,  event: ethereum.Event): TokenHourData {
  const bundle = getBundle()
  let tokenHourData = TokenHourData.load(id)
  const day = event.block.timestamp.toI32() / 3600
  const date = day * 3600

  if (tokenHourData === null) {
    tokenHourData = new TokenHourData(id)
    tokenHourData.date = date
    tokenHourData.token = token.id
    tokenHourData.priceUSD = token.derivedETH.times(bundle.ethPrice)
    tokenHourData.volume = BIG_DECIMAL_ZERO
    tokenHourData.sellVolume = BIG_DECIMAL_ZERO
    tokenHourData.buyVolume = BIG_DECIMAL_ZERO
    tokenHourData.volumeETH = BIG_DECIMAL_ZERO
    tokenHourData.volumeUSD = BIG_DECIMAL_ZERO
    tokenHourData.liquidityUSD = BIG_DECIMAL_ZERO
    tokenHourData.txCount = BigInt.fromI32(0)
    tokenHourData.selltxn = BigInt.fromI32(0)
    tokenHourData.buytxn = BigInt.fromI32(0)
  }

  return tokenHourData as TokenHourData
}

export function updateTokenHourData(token: Token, event: ethereum.Event): TokenHourData {
  const bundle = getBundle()

  const day = event.block.timestamp.toI32() / 3600

  const date = day * 3600

  const id = token.id.toString().concat('-').concat(BigInt.fromI32(day).toString())

  const tokenHourData = getTokenHourData(token, id, event)

  tokenHourData.priceUSD = token.derivedETH.times(bundle.ethPrice)
  tokenHourData.liquidity = token.liquidity
  tokenHourData.liquidityETH = token.liquidity.times(token.derivedETH as BigDecimal)
  tokenHourData.liquidityUSD = tokenHourData.liquidityETH.times(bundle.ethPrice)
  tokenHourData.txCount = tokenHourData.txCount.plus(BigInt.fromI32(1))

  tokenHourData.save()

  return tokenHourData as TokenHourData
}
