import { Address, BigInt, ethereum, log } from '@graphprotocol/graph-ts'
import { BIG_DECIMAL_ZERO, BIG_INT_ONE, BIG_INT_ZERO, FACTORY_ADDRESS, NULL_CALL_RESULT_VALUE } from '../../constants'

import { ERC20 } from '../../../generated/Factory/ERC20'
import { ERC20NameBytes } from '../../../generated/Factory/ERC20NameBytes'
import { ERC20SymbolBytes } from '../../../generated/Factory/ERC20SymbolBytes'
import { Token } from '../../../generated/schema'
import { getFactory } from '.'


export function getToken(address: Address, block: ethereum.Block | null = null): Token | null {
  let token = Token.load(address.toHex())

  if (token === null) {
    const factory = getFactory()
    factory.tokenCount = factory.tokenCount.plus(BIG_INT_ONE)
    factory.save()

    token = new Token(address.toHex());
    token.factory = FACTORY_ADDRESS.toHex()
    token.symbol = getSymbol(address)
    token.name = getName(address)
    token.totalSupply = getTotalSupply(address)
    const decimals = getDecimals(address)

    // TODO: Does this ever happen?
    if (decimals === null) {
      log.warning('Demicals for token {} was null', [address.toHex()])
      return null
    }

    token.decimals = decimals
    token.derivedETH = BIG_DECIMAL_ZERO
    token.volume = BIG_DECIMAL_ZERO
    token.volumeUSD = BIG_DECIMAL_ZERO
    token.untrackedVolumeUSD = BIG_DECIMAL_ZERO
    token.liquidity = BIG_DECIMAL_ZERO
    token.txCount = BIG_INT_ZERO
    token.selltxn = BIG_INT_ZERO
    token.buytxn = BIG_INT_ZERO
    token.oneDayGain = BIG_DECIMAL_ZERO
    token.sevenDayGain = BIG_DECIMAL_ZERO
    token.monthGain = BIG_DECIMAL_ZERO

    if(block){
      token.timestamp = block.timestamp
      token.block = block.number
    }

    token.save()
  }

  return token as Token
}

export function getSymbol(address: Address): string {
  // hard coded override
  if (address.toHex() == '0xe0b7927c4af23765cb51314a0e0521a9645f0e2a') {
    return 'DGD'
  }
  if (address.toHex() == '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9') {
    return 'AAVE'
  }
  if (address.toHex() == '0x5dbcf33d8c2e976c6b560249878e6f1491bca25c') {
    return 'yUSD'
  }

  const contract = ERC20.bind(address)
  const contractSymbolBytes = ERC20SymbolBytes.bind(address)

  // try types string and bytes32 for symbol
  let symbolValue = 'unknown'
  const symbolResult = contract.try_symbol()
  if (symbolResult.reverted) {
    const symbolResultBytes = contractSymbolBytes.try_symbol()
    if (!symbolResultBytes.reverted) {
      // for broken pairs that have no symbol function exposed
      if (symbolResultBytes.value.toHex() != NULL_CALL_RESULT_VALUE) {
        symbolValue = symbolResultBytes.value.toString()
      }
    }
  } else {
    symbolValue = symbolResult.value
  }

  return symbolValue
}

export function getName(address: Address): string {
  if (address.toHex() == '0xe0b7927c4af23765cb51314a0e0521a9645f0e2a') {
    return 'DGD'
  }
  if (address.toHex() == '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9') {
    return 'Aave Token'
  }
  if (address.toHex() == '0x5dbcf33d8c2e976c6b560249878e6f1491bca25c') {
    return 'yUSD'
  }
  if (address.toHex() == '0xf94b5c5651c888d928439ab6514b93944eee6f48') {
    return 'Yield App'
  }

  const contract = ERC20.bind(address)
  const contractNameBytes = ERC20NameBytes.bind(address)

  // try types string and bytes32 for name
  let nameValue = 'unknown'
  const nameResult = contract.try_name()
  if (nameResult.reverted) {
    const nameResultBytes = contractNameBytes.try_name()
    if (!nameResultBytes.reverted) {
      // for broken exchanges that have no name function exposed
      if (nameResultBytes.value.toHex() != NULL_CALL_RESULT_VALUE) {
        nameValue = nameResultBytes.value.toString()
      }
    }
  } else {
    nameValue = nameResult.value
  }

  return nameValue
}

export function getTotalSupply(address: Address): BigInt {
  const contract = ERC20.bind(address)
  let totalSupplyValue: BigInt = BigInt.fromI32(0)
  const totalSupplyResult = contract.try_totalSupply()
  if (!totalSupplyResult.reverted) {
    totalSupplyValue = totalSupplyResult.value
  }
  return totalSupplyValue
}

export function getDecimals(address: Address): BigInt {
  // hardcode overrides
  if (address.toHex() == '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9') {
    return BigInt.fromI32(18)
  }

  const contract = ERC20.bind(address)

  // try types uint8 for decimals
  let decimalValue : i32

  const decimalResult = contract.try_decimals()

  if (!decimalResult.reverted) {
    decimalValue = decimalResult.value
  }

  return BigInt.fromI32(decimalValue as i32)
}
