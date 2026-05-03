import { useEffect, useMemo, useState } from 'react';
import PhaserStage from './components/PhaserStage';
import StatusRing from './components/StatusRing';
import ShopMenu from './components/ShopMenu';
import InventoryModal from './components/InventoryModal';
import { getAvailableModels } from './game/assets';
import { usePet } from './pet/usePet';
import { classifyPlayScore } from './pet/domain';
import CogIcon from './assets/icons/hud/cog.png';
import HamburgerIcon from './assets/icons/hud/hamburger.png';
import HeartIcon from './assets/icons/hud/heart.png';
import LightningIcon from './assets/icons/hud/lightning.png';
import CoinIcon from './assets/icons/coin.png';
import BagIcon from './assets/icons/hud/bag.png';

function App() {
  const models = useMemo(() => getAvailableModels(), []);
  const {
    pet,
    isCritical,
    isSleeping,
    canFeed,
    canPlay,
    canSleep,
    setName,
    setModelId,
    feed,
    applyPlayMiniGameResult,
    setPetState,
    sleep,
    wake,
    reset,
    debugSet,
  } = usePet({
    defaultModelId: models[0] ?? 'fox',
    defaultName: 'Iris',
  });

  const isDev = import.meta.env.DEV;
  const [debugOpen, setDebugOpen] = useState(false);
  const [dbgHunger, setDbgHunger] = useState(pet.hunger);
  const [dbgHealth, setDbgHealth] = useState(pet.health);
  const [dbgEnergy, setDbgEnergy] = useState(pet.energy);
  const [dbgCoins, setDbgCoins] = useState(pet.coins);
  const [dbgSleeping, setDbgSleeping] = useState(pet.isSleeping);

  const feedTitle = isSleeping
    ? 'Não pode alimentar enquanto dorme'
    : canFeed.ok
      ? ''
      : 'reason' in canFeed
        ? canFeed.reason
        : '';
  const playTitle = isSleeping
    ? 'Não pode brincar enquanto dorme'
    : canPlay.ok
      ? ''
      : 'reason' in canPlay
        ? canPlay.reason
        : '';
  const sleepTitle = canSleep.ok
    ? ''
    : 'reason' in canSleep
      ? canSleep.reason
      : '';
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);

  const sleepInfo =
    isSleeping && pet.hunger <= 0
      ? 'Fome zerada: dormindo você perde energia e saúde rapidamente.'
      : isSleeping && pet.hunger < 20
        ? 'Muito faminto: dormir não recupera energia e sua saúde piora.'
        : '';

  const [miniGameState, setMiniGameState] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [playUiMessage, setPlayUiMessage] = useState<string>('');
  const [miniGameSummary, setMiniGameSummary] = useState<{
    score: number;
    applied: { healthDelta: number; energyDelta: number; hungerDelta: number; coinsDelta: number };
  } | null>(null);

  const actionsLocked = miniGameState === 'playing';

  useEffect(() => {
    if (!settingsOpen && !inventoryOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSettingsOpen(false);
        setInventoryOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [settingsOpen, inventoryOpen]);

  useEffect(() => {
    if (!playUiMessage) return;
    const id = window.setTimeout(() => setPlayUiMessage(''), 2800);
    return () => window.clearTimeout(id);
  }, [playUiMessage]);

  useEffect(() => {
    if (miniGameState !== 'playing') return;
    if (pet.health > 0) return;
    // morreu durante o minigame: encerra sem aplicar resultado
    setMiniGameState('idle');
    setMiniGameSummary(null);
    setPlayUiMessage('Seu pet morreu!');
  }, [miniGameState, pet.health]);

  const startMiniGame = () => {
    if (isCritical) return;
    if (actionsLocked) return;
    if (isSleeping) {
      setPlayUiMessage('Não pode brincar enquanto dorme.');
      return;
    }
    if (!canPlay.ok) {
      setPlayUiMessage('reason' in canPlay ? canPlay.reason : 'Não pode brincar agora.');
      return;
    }
    setMiniGameSummary(null);
    setMiniGameState('playing');
  };

  return (
    <main className="h-full w-full grid grid-rows-[auto,1fr,auto] box-border overflow-hidden">
      <header className="shrink-0">
        <section className="flex w-full flex-col gap-2.5 rounded-xl p-3 shrink-0">
          <div className="w-full gap-2 flex items-center justify-center">
            <StatusRing
              label="Fome"
              value={pet.hunger}
              icon={
                <img
                  src={HamburgerIcon}
                  alt=""
                  className="h-5 w-5 opacity-90"
                />
              }
            />
            <StatusRing
              label="Saúde"
              value={pet.health}
              icon={
                <img src={HeartIcon} alt="" className="h-5 w-5 opacity-90" />
              }
            />
            <StatusRing
              label="Energia"
              value={pet.energy}
              icon={
                <img
                  src={LightningIcon}
                  alt=""
                  className="h-5 w-5 opacity-90"
                />
              }
            />
          </div>
        </section>
      </header>

      <section className="min-h-0 flex w-full justify-center overflow-hidden">
        <div className="overflow-hidden rounded-xl w-full min-h-0">
          <PhaserStage
            model={pet.modelId}
            mode={miniGameState === 'playing' ? 'play-minigame' : 'idle'}
            shouldAbortMiniGame={() => pet.health <= 0}
            onMiniGameFinished={(payload) => {
              setMiniGameState('idle');
              if (payload.aborted) return;
              const result = classifyPlayScore(payload.score);
              const res = applyPlayMiniGameResult(result);
              if (!res.ok) {
                setPlayUiMessage('reason' in res ? res.reason : 'Não foi possível aplicar o resultado.');
                return;
              }
              setMiniGameSummary({ score: payload.score, applied: res.applied });
              setMiniGameState('finished');
            }}
          />
        </div>
      </section>

      <section className="flex justify-center shrink-0 py-3">
        {isCritical ? (
          <div className="flex w-full max-w-[720px] flex-col items-center gap-2.5 rounded-xl border border-(--accent-border) bg-[color-mix(in_oklab,var(--accent-bg)_70%,transparent)] px-3 py-2">
            <p>Seu pet entrou em estado crítico. As ações estão travadas.</p>
            <button
              className="cursor-pointer rounded-[10px] border border-(--accent-border) bg-(--accent-bg) px-3 py-2 font-(--mono) text-[14px] text-(--text-h) hover:border-(--accent) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
              type="button"
              onClick={reset}
            >
              Resetar
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {playUiMessage ? (
              <div className="max-w-[720px] rounded-xl border border-(--border) bg-[color-mix(in_oklab,var(--code-bg)_60%,transparent)] px-3 py-2 text-sm opacity-90">
                {playUiMessage}
              </div>
            ) : null}
            {sleepInfo ? (
              <div className="max-w-[720px] rounded-xl border border-(--border) bg-[color-mix(in_oklab,var(--code-bg)_60%,transparent)] px-3 py-2 text-sm opacity-90">
                {sleepInfo}
              </div>
            ) : null}
            <div className="flex flex-wrap justify-center gap-2">
            <button
              className="cursor-pointer rounded-[10px] border border-(--accent-border) bg-(--accent-bg) px-3 py-2 font-(--mono) text-[14px] text-(--text-h) hover:border-(--accent) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              onClick={feed}
              disabled={actionsLocked || isSleeping || !canFeed.ok}
              title={feedTitle}
              aria-disabled={actionsLocked || isSleeping || !canFeed.ok}
            >
              Alimentar
            </button>
            <button
              className="cursor-pointer rounded-[10px] border border-(--accent-border) bg-(--accent-bg) px-3 py-2 font-(--mono) text-[14px] text-(--text-h) hover:border-(--accent) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              onClick={startMiniGame}
              disabled={actionsLocked || isSleeping || !canPlay.ok}
              title={playTitle}
              aria-disabled={actionsLocked || isSleeping || !canPlay.ok}
            >
              Brincar
            </button>
            {isSleeping ? (
              <button
                className="cursor-pointer rounded-[10px] border border-(--accent-border) bg-(--accent-bg) px-3 py-2 font-(--mono) text-[14px] text-(--text-h) hover:border-(--accent) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
                type="button"
                onClick={wake}
              >
                Acordar
              </button>
            ) : (
              <button
                className="cursor-pointer rounded-[10px] border border-(--accent-border) bg-(--accent-bg) px-3 py-2 font-(--mono) text-[14px] text-(--text-h) hover:border-(--accent) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
                onClick={sleep}
                disabled={actionsLocked || !canSleep.ok}
                title={sleepTitle}
                aria-disabled={actionsLocked || !canSleep.ok}
              >
                Dormir
              </button>
            )}
            </div>
          </div>
        )}
      </section>

      <aside className="fixed right-4 top-1/2 -translate-y-1/2 z-50">
        <div className="flex flex-col gap-2 rounded-2xl border border-(--border) bg-[color-mix(in_oklab,var(--code-bg)_70%,transparent)] p-2 shadow-(--shadow)">
          <button
            type="button"
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-(--border) bg-[color-mix(in_oklab,var(--bg)_85%,transparent)] px-2 text-(--text-h) hover:border-(--accent) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
            aria-label={`Moedas: ${pet.coins}. Abrir mercado.`}
            title={`Moedas: ${pet.coins}`}
            onClick={() => setShopOpen(true)}
          >
            <img src={CoinIcon} alt="" className="h-5 w-5 opacity-90" />
            <span className="font-(--mono) text-[14px] tabular-nums">{pet.coins}</span>
          </button>
          <button
            type="button"
            className="grid h-10 w-full place-items-center rounded-xl border border-(--border) bg-[color-mix(in_oklab,var(--bg)_85%,transparent)] text-(--text-h) hover:border-(--accent) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
            aria-label="Abrir estoque"
            title="Estoque"
            onClick={() => setInventoryOpen(true)}
          >
            <img src={BagIcon} alt="" className="h-5 w-5 opacity-90" />
          </button>
          <button
            type="button"
            className="grid h-10 w-full place-items-center rounded-xl border border-(--border) bg-[color-mix(in_oklab,var(--bg)_85%,transparent)] text-(--text-h) hover:border-(--accent) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
            onClick={() => setSettingsOpen(true)}
            aria-label="Configurações"
            title="Configurações"
          >
            <img src={CogIcon} alt="" className="h-5 w-5 opacity-90" />
          </button>

          {isDev ? (
            <button
              type="button"
              className="grid h-10 w-full place-items-center rounded-xl border border-(--border) bg-[color-mix(in_oklab,var(--bg)_85%,transparent)] text-(--text-h) hover:border-(--accent) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
              onClick={() => {
                setDebugOpen((v) => {
                  const next = !v;
                  if (next) {
                    setDbgHunger(pet.hunger);
                    setDbgHealth(pet.health);
                    setDbgEnergy(pet.energy);
                    setDbgCoins(pet.coins);
                    setDbgSleeping(pet.isSleeping);
                  }
                  return next;
                });
              }}
              aria-label="Debug"
              title="Debug"
            >
              <span className="font-(--mono) text-[16px]">DBG</span>
            </button>
          ) : null}

          {isDev && debugOpen ? (
            <div className="absolute right-[calc(100%+12px)] top-1/2 -translate-y-1/2 w-[260px] rounded-2xl border border-(--border) bg-(--bg) p-3 shadow-(--shadow)">
              <div className="flex items-center justify-between">
                <div className="font-(--mono) text-(--text-h)">Debug</div>
                <button
                  type="button"
                  className="grid h-8 w-8 place-items-center rounded-xl border border-(--border) bg-[color-mix(in_oklab,var(--bg)_85%,transparent)] text-(--text-h) hover:border-(--accent) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
                  onClick={() => setDebugOpen(false)}
                  aria-label="Fechar debug"
                  title="Fechar"
                >
                  <IconClose />
                </button>
              </div>

              <div className="mt-3 grid gap-3">
                <DebugRow label="Fome" value={dbgHunger} onChange={setDbgHunger} max={100} />
                <DebugRow label="Saúde" value={dbgHealth} onChange={setDbgHealth} max={100} />
                <DebugRow label="Energia" value={dbgEnergy} onChange={setDbgEnergy} max={100} />
                <DebugRow
                  label="Moedas"
                  value={dbgCoins}
                  onChange={setDbgCoins}
                  showRange={false}
                />

                <label className="flex items-center gap-2 font-(--mono) text-[13px] opacity-90">
                  <input
                    type="checkbox"
                    checked={dbgSleeping}
                    onChange={(e) => setDbgSleeping(e.target.checked)}
                  />
                  Dormindo
                </label>

                <button
                  type="button"
                  className="cursor-pointer rounded-[10px] border border-(--accent-border) bg-(--accent-bg) px-3 py-2 font-(--mono) text-[14px] text-(--text-h) hover:border-(--accent) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
                  onClick={() => {
                    debugSet?.({
                      hunger: dbgHunger,
                      health: dbgHealth,
                      energy: dbgEnergy,
                      coins: dbgCoins,
                      isSleeping: dbgSleeping,
                    });
                  }}
                >
                  Aplicar
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </aside>

      <ShopMenu
        open={shopOpen}
        pet={pet}
        onClose={() => setShopOpen(false)}
        onPetUpdated={setPetState}
        onMessage={(msg) => setPlayUiMessage(msg)}
      />

      <InventoryModal open={inventoryOpen} pet={pet} onClose={() => setInventoryOpen(false)} />

      {settingsOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Configurações"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Fechar modal"
            onClick={() => setSettingsOpen(false)}
          />
          <div className="relative w-[min(560px,92vw)] rounded-2xl border border-(--border) bg-(--bg) p-4 shadow-(--shadow)">
            <div className="flex items-center justify-between gap-3">
              <h2
                className="text-(--text-h) font-medium text-xl"
                style={{ fontFamily: 'var(--heading)' }}
              >
                Configurações
              </h2>
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-xl border border-(--border) bg-[color-mix(in_oklab,var(--bg)_85%,transparent)] text-(--text-h) hover:border-(--accent) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
                aria-label="Fechar"
                onClick={() => setSettingsOpen(false)}
                title="Fechar"
              >
                <IconClose />
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="grid gap-1 text-left">
                <label
                  className="font-(--mono) text-[13px] opacity-85"
                  htmlFor="pet-name"
                >
                  Nome
                </label>
                <input
                  id="pet-name"
                  className="rounded-[10px] border border-(--border) bg-[color-mix(in_oklab,var(--bg)_85%,transparent)] px-2.5 py-2 font-(--mono) text-[14px] text-(--text-h) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
                  value={pet.name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={24}
                  autoFocus
                />
              </div>

              <div className="grid gap-1 text-left">
                <label
                  className="font-(--mono) text-[13px] opacity-85"
                  htmlFor="model"
                >
                  Modelo
                </label>
                <select
                  id="model"
                  className="rounded-[10px] border border-(--border) bg-[color-mix(in_oklab,var(--bg)_85%,transparent)] px-2.5 py-2 font-(--mono) text-[14px] text-(--text-h) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
                  value={pet.modelId}
                  onChange={(e) => setModelId(e.target.value)}
                >
                  {models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  className="cursor-pointer rounded-[10px] border border-(--border) bg-[color-mix(in_oklab,var(--bg)_85%,transparent)] px-3 py-2 font-(--mono) text-[14px] text-(--text-h) hover:border-(--accent) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
                  onClick={() => setSettingsOpen(false)}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {miniGameState === 'finished' && miniGameSummary ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Resultado do minigame"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Fechar resultado"
            onClick={() => {
              setMiniGameState('idle');
              setMiniGameSummary(null);
            }}
          />
          <div className="relative w-[min(560px,92vw)] rounded-2xl border border-(--border) bg-(--bg) p-4 shadow-(--shadow)">
            <div className="flex items-center justify-between gap-3">
              <h2
                className="text-(--text-h) font-medium text-xl"
                style={{ fontFamily: 'var(--heading)' }}
              >
                Bom trabalho!
              </h2>
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-xl border border-(--border) bg-[color-mix(in_oklab,var(--bg)_85%,transparent)] text-(--text-h) hover:border-(--accent) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
                aria-label="Fechar"
                onClick={() => {
                  setMiniGameState('idle');
                  setMiniGameSummary(null);
                }}
                title="Fechar"
              >
                <IconClose />
              </button>
            </div>

            <div className="mt-4 grid gap-2 text-left">
              <p>Você pegou {miniGameSummary.score} estrelas.</p>
              <div className="mt-2 grid gap-1 font-(--mono) text-[14px] opacity-90">
                <div>Saúde {miniGameSummary.applied.healthDelta >= 0 ? '+' : ''}{miniGameSummary.applied.healthDelta}</div>
                <div>Energia {miniGameSummary.applied.energyDelta >= 0 ? '+' : ''}{miniGameSummary.applied.energyDelta}</div>
                <div>Fome {miniGameSummary.applied.hungerDelta >= 0 ? '+' : ''}{miniGameSummary.applied.hungerDelta}</div>
                <div>Moedas +{miniGameSummary.applied.coinsDelta}</div>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="cursor-pointer rounded-[10px] border border-(--border) bg-[color-mix(in_oklab,var(--bg)_85%,transparent)] px-3 py-2 font-(--mono) text-[14px] text-(--text-h) hover:border-(--accent) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
                onClick={() => {
                  setMiniGameState('idle');
                  setMiniGameSummary(null);
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M18 6 6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DebugRow({
  label,
  value,
  onChange,
  max,
  showRange = true,
}: {
  label: string;
  value: number;
  onChange(v: number): void;
  max?: number;
  showRange?: boolean;
}) {
  const maxAttr = typeof max === 'number' ? max : undefined
  return (
    <div className="grid gap-1 text-left">
      <div className="flex items-center justify-between gap-2">
        <span className="font-(--mono) text-[13px] opacity-85">{label}</span>
        <input
          className="w-[72px] rounded-[10px] border border-(--border) bg-[color-mix(in_oklab,var(--bg)_85%,transparent)] px-2 py-1 font-(--mono) text-[13px] text-(--text-h)"
          type="number"
          min={0}
          max={maxAttr}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
      {showRange ? (
        <input
          type="range"
          min={0}
          max={maxAttr ?? 100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      ) : null}
    </div>
  );
}

export default App;
