import { getFactory, getPair } from '../enitites'

import { BIG_INT_ONE } from '../../constants'
import { PairCreated } from '../../../generated/Factory/Factory'
import { Pair as PairTemplate } from '../../../generated/templates'

export function onPairCreated(event: PairCreated): void {
  const factory = getFactory()
  factory.save()

  const pair = getPair(event.params.pair, event.block)

  // We returned null for some reason, we should silently bail without creating this pair
  if (!pair) {
    return
  }

  // Now it's safe to save
  pair.save()

  // create the tracked contract based on the template
  PairTemplate.create(event.params.pair)
}
