import { useEffect, useMemo, useState } from 'react'
import type { Pet } from '../pet/domain'
import {
  getShopItem,
  getShopItemDetails,
  getShopItems,
  type ShopItemId,
} from '../shop/domain'

export type InventoryModalProps = {
  open: boolean
  pet: Pet
  onClose(): void
}

const INV_COLS = 5
const INV_ROWS = 4
const INVENTORY_SLOT_COUNT = INV_COLS * INV_ROWS

type InventorySlotCell = { id: ShopItemId; count: number } | null

function buildAggregatedSlots(inventory: Pet['inventory']): {
  slots: InventorySlotCell[]
  overflowStackKinds: number
} {
  const stocked = getShopItems().filter((item) => inventory[item.id] > 0)
  const overflowStackKinds = Math.max(0, stocked.length - INVENTORY_SLOT_COUNT)
  const slots: InventorySlotCell[] = Array.from({ length: INVENTORY_SLOT_COUNT }, () => null)
  stocked.slice(0, INVENTORY_SLOT_COUNT).forEach((item, index) => {
    slots[index] = { id: item.id, count: inventory[item.id] }
  })
  return { slots, overflowStackKinds }
}

export default function InventoryModal({ open, pet, onClose }: InventoryModalProps) {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null)

  const { slots, overflowStackKinds } = useMemo(
    () => buildAggregatedSlots(pet.inventory),
    [
      pet.inventory.bed_simple,
      pet.inventory.food_simple,
      pet.inventory.medicine_simple,
    ],
  )

  const totalUnits =
    pet.inventory.bed_simple + pet.inventory.food_simple + pet.inventory.medicine_simple

  useEffect(() => {
    if (!open) {
      setSelectedSlotIndex(null)
      return
    }
    const firstFilled = slots.findIndex((c) => c !== null)
    if (firstFilled < 0) {
      setSelectedSlotIndex(null)
      return
    }
    setSelectedSlotIndex((prev) => {
      if (prev !== null && slots[prev] !== null) return prev
      return firstFilled
    })
  }, [open, slots])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const selectedCell =
    selectedSlotIndex !== null ? slots[selectedSlotIndex] : null
  const selectedShopItem = selectedCell ? getShopItem(selectedCell.id) : null
  const selectedDetails = selectedCell ? getShopItemDetails(selectedCell.id) : null

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Estoque"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Fechar estoque"
        onClick={onClose}
      />

      <div className="relative w-[min(900px,94vw)] max-h-[min(640px,85vh)] overflow-y-auto rounded-2xl border border-(--border) bg-(--bg) p-4 shadow-(--shadow)">
        <div className="relative flex min-h-[2.25rem] items-center justify-center pr-10">
          <h2 className="text-center text-(--text-h) font-medium text-xl" style={{ fontFamily: 'var(--heading)' }}>
            Estoque
          </h2>
          <button
            type="button"
            className="absolute right-0 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl border border-(--border) bg-[color-mix(in_oklab,var(--bg)_85%,transparent)] text-(--text-h) hover:border-(--accent) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
            aria-label="Fechar"
            onClick={onClose}
            title="Fechar"
          >
            <IconClose />
          </button>
        </div>

        <p className="mt-2 text-center font-(--mono) text-[13px] opacity-80">
          Grade {INV_COLS}×{INV_ROWS}: cada célula é quadrada; uma pilha por tipo de item (quantidade no
          distintivo). Toque num item para detalhes ou num vazio para limpar a seleção.
        </p>

        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-stretch">
          <div className="min-w-0 flex-1">
            {/* Proporção 5:4 = largura/altura da área da grade, para que cada célula 1/5 × 1/4 seja quadrada. */}
            <div className="mx-auto w-full max-w-md px-0 sm:max-w-lg">
              <div className="aspect-[5/4] w-full">
                <div
                  className="grid h-full w-full gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${INV_COLS}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${INV_ROWS}, minmax(0, 1fr))`,
                  }}
                  aria-label={`Grade de inventário, ${INVENTORY_SLOT_COUNT} slots`}
                >
                  {slots.map((cell, index) => {
                    const isEmpty = cell === null
                    const itemMeta = cell ? getShopItem(cell.id) : null
                    const isSelected = selectedSlotIndex === index
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          if (isEmpty) setSelectedSlotIndex(null)
                          else setSelectedSlotIndex(index)
                        }}
                        aria-label={
                          isEmpty
                            ? `Slot ${index + 1}, vazio`
                            : `Slot ${index + 1}, ${itemMeta?.name ?? cell.id}, quantidade ${cell.count}`
                        }
                        aria-pressed={!isEmpty && isSelected}
                        className={`relative flex min-h-0 min-w-0 flex-col items-center justify-center rounded-xl border p-1 shadow-(--shadow) transition-colors focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2 ${
                          isEmpty
                            ? 'border-dashed border-(--border) bg-[color-mix(in_oklab,var(--code-bg)_35%,transparent)] hover:bg-[color-mix(in_oklab,var(--code-bg)_50%,transparent)]'
                            : isSelected
                              ? 'border-(--accent) bg-[color-mix(in_oklab,var(--accent-bg)_55%,transparent)]'
                              : 'border-(--border) bg-[color-mix(in_oklab,var(--code-bg)_65%,transparent)] hover:border-(--accent)/60'
                        }`}
                      >
                        {itemMeta && cell ? (
                          <>
                            <img
                              src={itemMeta.iconSrc}
                              alt=""
                              className="max-h-[55%] max-w-[55%] object-contain opacity-90"
                            />
                            <span
                              className="absolute right-0.5 top-0.5 flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full border border-(--accent-border) bg-(--accent-bg) px-1 font-(--mono) text-[10px] leading-none text-(--text-h) tabular-nums shadow-(--shadow) sm:text-[11px]"
                              aria-hidden
                            >
                              {cell.count > 99 ? '99+' : cell.count}
                            </span>
                          </>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            {overflowStackKinds > 0 ? (
              <p className="mt-2 font-(--mono) text-[12px] text-(--text-h) opacity-80">
                {overflowStackKinds}{' '}
                {overflowStackKinds === 1 ? 'tipo de item' : 'tipos de item'} sem célula — limite de{' '}
                {INVENTORY_SLOT_COUNT} pilhas distintas na grade.
              </p>
            ) : null}
          </div>

          <aside
            className="flex w-full shrink-0 flex-col rounded-2xl border border-(--border) bg-[color-mix(in_oklab,var(--code-bg)_55%,transparent)] p-3 sm:p-4 lg:w-[min(100%,260px)] lg:border-t-0 lg:border-l"
            aria-label="Detalhes do item"
          >
            {selectedShopItem && selectedDetails && selectedCell && selectedSlotIndex !== null ? (
              <>
                <p className="font-(--mono) text-[11px] tabular-nums opacity-50">
                  Slot {selectedSlotIndex + 1} · {selectedCell.count}{' '}
                  {selectedCell.count === 1 ? 'unidade' : 'unidades'}
                </p>
                <div className="mt-1 flex items-start gap-3">
                  <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-(--border) bg-[color-mix(in_oklab,var(--bg)_70%,transparent)]">
                    <img
                      src={selectedShopItem.iconSrc}
                      alt=""
                      className="h-10 w-10 object-contain opacity-90"
                    />
                    <span className="absolute -right-1 -top-1 flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full border border-(--accent-border) bg-(--accent-bg) px-1 font-(--mono) text-[10px] text-(--text-h) tabular-nums">
                      {selectedCell.count > 99 ? '99+' : selectedCell.count}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-(--mono) text-[15px] font-medium text-(--text-h) leading-snug">
                      {selectedShopItem.name}
                    </h3>
                    <p className="mt-1 font-(--mono) text-[12px] leading-relaxed text-(--text-h) opacity-80">
                      {selectedDetails.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t border-(--border) pt-3">
                  <div className="font-(--mono) text-[11px] uppercase tracking-wide opacity-55">
                    Oferece
                  </div>
                  <ul className="mt-2 list-inside list-disc space-y-1 font-(--mono) text-[13px] text-(--text-h) opacity-90">
                    {selectedDetails.offers.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  className="mt-4 w-full cursor-pointer rounded-[12px] border border-(--accent-border) bg-(--accent-bg) px-3 py-2.5 font-(--mono) text-[14px] text-(--text-h) hover:border-(--accent) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
                  onClick={() => {
                    /* uso do item: a implementar */
                  }}
                >
                  Usar
                </button>
              </>
            ) : (
              <p className="font-(--mono) text-[13px] text-(--text-h) opacity-70">
                {totalUnits === 0
                  ? 'Nenhum item no estoque. Compre no mercado para preencher os slots.'
                  : 'Selecione um item na grade.'}
              </p>
            )}
          </aside>
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
