import { describe, expect, it } from 'vitest'
import { createPet } from '../pet/domain'
import { applyPurchaseItem, getShopItem } from './domain'

describe('shop domain', () => {
  it('preços balanceados', () => {
    expect(getShopItem('food_simple')?.priceCoins).toBe(18)
    expect(getShopItem('bed_simple')?.priceCoins).toBe(60)
    expect(getShopItem('medicine_simple')?.priceCoins).toBe(45)
  })

  it('compra adiciona ao estoque e desconta moedas', () => {
    const now = 1_000_000
    const pet = {
      ...createPet({
        name: 'X',
        modelId: 'fox',
        nowMs: now,
        initial: { hunger: 40, health: 72, energy: 55 },
      }),
      coins: 100,
    }
    const food = getShopItem('food_simple')!
    const res = applyPurchaseItem(pet, food, now + 1)
    expect(res.ok).toBe(true)
    if (!res.ok) throw new Error('expected ok')
    expect(res.pet.coins).toBe(82)
    expect(res.pet.inventory.food_simple).toBe(1)
    expect(res.pet.inventory.bed_simple).toBe(0)
    expect(res.pet.hunger).toBe(40)
    expect(res.pet.health).toBe(72)
    expect(res.pet.energy).toBe(55)

    const res2 = applyPurchaseItem(res.pet, food, now + 2)
    expect(res2.ok).toBe(true)
    if (!res2.ok) throw new Error('expected ok')
    expect(res2.pet.inventory.food_simple).toBe(2)
  })
})
