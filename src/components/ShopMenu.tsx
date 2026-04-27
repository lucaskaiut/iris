import CoinIcon from '../assets/icons/coin.png'
import type { Pet } from '../pet/domain'
import { applyPurchaseItem, getShopItems, type ShopItemId } from '../shop/domain'

export type ShopMenuProps = {
  open: boolean
  pet: Pet
  onClose(): void
  onPetUpdated(pet: Pet): void
  onMessage?(msg: string): void
}

export default function ShopMenu({ open, pet, onClose, onPetUpdated, onMessage }: ShopMenuProps) {
  if (!open) return null
  const items = getShopItems()

  const onBuy = (id: ShopItemId) => {
    const item = items.find((i) => i.id === id)
    if (!item) return
    const now = Date.now()
    const res = applyPurchaseItem(pet, item, now)
    if (!res.ok) {
      onMessage?.(res.reason)
      return
    }
    onPetUpdated(res.pet)
    onMessage?.(`${item.name} comprado!`)
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Mercado"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Fechar mercado"
        onClick={onClose}
      />

      <div className="relative w-[min(720px,92vw)] rounded-2xl border border-(--border) bg-(--bg) p-4 shadow-(--shadow)">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-(--text-h) font-medium text-xl" style={{ fontFamily: 'var(--heading)' }}>
            Mercado
          </h2>
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-xl border border-(--border) bg-[color-mix(in_oklab,var(--bg)_85%,transparent)] text-(--text-h) hover:border-(--accent) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
            aria-label="Fechar"
            onClick={onClose}
            title="Fechar"
          >
            <IconClose />
          </button>
        </div>

        <div className="mt-1 flex items-center gap-2 font-(--mono) text-sm opacity-90">
          <img src={CoinIcon} alt="" className="h-4 w-4 opacity-90" />
          <span className="tabular-nums">{pet.coins}</span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {items.map((item) => {
            const affordable = pet.coins >= item.priceCoins
            return (
              <div
                key={item.id}
                className="rounded-2xl border border-(--border) bg-[color-mix(in_oklab,var(--code-bg)_70%,transparent)] p-3 shadow-(--shadow)"
              >
                <div className="text-center font-(--mono) text-sm text-(--text-h) opacity-90">
                  {item.name}
                </div>

                <div className="mt-3 grid place-items-center">
                  <div className="grid h-[88px] w-[88px] place-items-center rounded-2xl border border-(--border) bg-[color-mix(in_oklab,var(--bg)_70%,transparent)]">
                    <img src={item.iconSrc} alt="" className="h-12 w-12 opacity-90" />
                  </div>
                </div>

                <div className="mt-3 grid place-items-center">
                  <div className="flex items-center gap-1.5 rounded-xl border border-(--border) bg-[color-mix(in_oklab,var(--bg)_80%,transparent)] px-2 py-1 font-(--mono) text-[13px] text-(--text-h)">
                    <img src={CoinIcon} alt="" className="h-4 w-4 opacity-90" />
                    <span className="tabular-nums">{item.priceCoins}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="mt-3 w-full cursor-pointer rounded-[12px] border border-(--accent-border) bg-(--accent-bg) px-3 py-2 font-(--mono) text-[14px] text-(--text-h) hover:border-(--accent) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => onBuy(item.id)}
                  disabled={!affordable}
                  aria-disabled={!affordable}
                  title={!affordable ? 'Moedas insuficientes' : 'Comprar'}
                >
                  Comprar
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M18 6 6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

