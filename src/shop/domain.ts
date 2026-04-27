import BedIcon from '../assets/icons/shop/bed.png'
import FoodIcon from '../assets/icons/shop/food.png'
import MedicineIcon from '../assets/icons/shop/medicine.png'
import { clampPet, type Pet } from '../pet/domain'

export type ShopItemId = 'bed' | 'food' | 'medicine'

export type ShopItem = {
  id: ShopItemId
  name: string
  priceCoins: number
  iconSrc: string
}

export const SHOP_ITEMS: readonly ShopItem[] = [
  { id: 'bed', name: 'Cama', priceCoins: 35, iconSrc: BedIcon },
  { id: 'food', name: 'Comida', priceCoins: 12, iconSrc: FoodIcon },
  { id: 'medicine', name: 'Remédio', priceCoins: 28, iconSrc: MedicineIcon },
] as const

export function getShopItems() {
  return SHOP_ITEMS
}

export function getShopItem(id: ShopItemId) {
  return SHOP_ITEMS.find((i) => i.id === id) ?? null
}

export type PurchaseOk = { ok: true; pet: Pet; item: ShopItem }
export type PurchaseErr = { ok: false; reason: string }

export function canPurchaseItem(pet: Pet, item: ShopItem): PurchaseErr | { ok: true } {
  if (pet.health <= 0) return { ok: false, reason: 'Pet morto' }
  if (item.priceCoins <= 0) return { ok: false, reason: 'Item inválido' }
  if (pet.coins < item.priceCoins) return { ok: false, reason: 'Moedas insuficientes' }
  return { ok: true }
}

export function applyPurchaseItem(
  pet: Pet,
  item: ShopItem,
  nowMs: number,
): PurchaseOk | PurchaseErr {
  const block = canPurchaseItem(pet, item)
  if (!block.ok) return block

  const next = clampPet({
    ...pet,
    coins: pet.coins - item.priceCoins,
    updatedAt: nowMs,
    lastInteractionAt: nowMs,
  })

  return { ok: true, pet: next, item }
}

