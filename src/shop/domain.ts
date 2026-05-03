import SimpleBedIcon from '../assets/icons/items/simple_bed.png'
import SimpleFoodIcon from '../assets/icons/items/simple_food.png'
import SimpleMedicineIcon from '../assets/icons/items/simple_medicine.png'
import { clampPet, normalizeInventory, type Pet } from '../pet/domain'

export type ShopItemId = 'bed_simple' | 'food_simple' | 'medicine_simple'

export type ShopItem = {
  id: ShopItemId
  name: string
  priceCoins: number
  iconSrc: string
}

export type ShopItemCatalogInfo = {
  /** Uma frase curta, tomada de humor leve. */
  description: string
  /** Benefícios previstos ao usar o item (texto exibido ao jogador). */
  offers: string[]
}

export const SHOP_ITEM_DETAILS: Record<ShopItemId, ShopItemCatalogInfo> = {
  food_simple: {
    description:
      'Mistura que cheira a culpa boa: dá larica honesta e um empurrão pra aguentar o próximo passeio.',
    offers: ['+30 fome', '+5 energia'],
  },
  medicine_simple: {
    description:
      'Vidrinho de “confia em mim” com rótulo genérico — no fundo, é carinho químico em dose de emergência.',
    offers: ['+30 saúde'],
  },
  bed_simple: {
    description:
      'Tapete fofo com humildade de sofá: o suficiente pra roncar sem culpa e acordar menos derrotado.',
    offers: ['Recuperação de energia no sono em ritmo dobrado'],
  },
}

export function getShopItemDetails(id: ShopItemId): ShopItemCatalogInfo {
  return SHOP_ITEM_DETAILS[id]
}

export const SHOP_ITEMS: readonly ShopItem[] = [
  { id: 'bed_simple', name: 'Cama Simples', priceCoins: 60, iconSrc: SimpleBedIcon },
  { id: 'food_simple', name: 'Ração Simples', priceCoins: 18, iconSrc: SimpleFoodIcon },
  { id: 'medicine_simple', name: 'Remédio Simples', priceCoins: 45, iconSrc: SimpleMedicineIcon },
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

  const inv = normalizeInventory(pet.inventory)
  const next = clampPet({
    ...pet,
    coins: pet.coins - item.priceCoins,
    inventory: {
      ...inv,
      [item.id]: inv[item.id] + 1,
    },
    updatedAt: nowMs,
    lastInteractionAt: nowMs,
  })

  return { ok: true, pet: next, item }
}
