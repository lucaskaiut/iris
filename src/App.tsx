import { useEffect, useMemo, useState } from 'react';
import PhaserStage from './components/PhaserStage';
import StatusRing from './components/StatusRing';
import { getAvailableModels } from './game/assets';
import { usePet } from './pet/usePet';
import CogIcon from './assets/icons/hud/cog.png';
import HamburgerIcon from './assets/icons/hud/hamburger.png';
import HeartIcon from './assets/icons/hud/heart.png';

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
    play,
    sleep,
    wake,
    reset,
  } = usePet({
      defaultModelId: models[0] ?? 'fox',
      defaultName: 'Iris',
    });

  const feedTitle = isSleeping
    ? 'Não pode alimentar enquanto dorme'
    : canFeed.ok
      ? ''
      : 'reason' in canFeed
        ? canFeed.reason
        : ''
  const playTitle = isSleeping
    ? 'Não pode brincar enquanto dorme'
    : canPlay.ok
      ? ''
      : 'reason' in canPlay
        ? canPlay.reason
        : ''
  const sleepTitle = canSleep.ok ? '' : 'reason' in canSleep ? canSleep.reason : ''
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (!settingsOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSettingsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [settingsOpen]);

  return (
    <main className="h-full w-full grid grid-rows-[auto,1fr,auto] box-border overflow-hidden">
      <header className="shrink-0">
        <section className="flex w-full flex-col gap-2.5 rounded-xl p-3 shrink-0">
          <div className="w-full gap-2 flex justify-center">
            <StatusRing
              label="Fome"
              value={pet.hunger}
              icon={<img src={HamburgerIcon} alt="" className="h-5 w-5 opacity-90" />}
            />
            <StatusRing
              label="Saúde"
              value={pet.health}
              icon={<img src={HeartIcon} alt="" className="h-5 w-5 opacity-90" />}
            />
            <StatusRing label="Energia" value={pet.energy} icon={<IconBolt />} />
          </div>
        </section>
      </header>

      <section className="min-h-0 flex w-full justify-center overflow-hidden">
        <div className="overflow-hidden rounded-xl w-full min-h-0">
          <PhaserStage model={pet.modelId} />
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
          <div className="flex flex-wrap justify-center gap-2">
            <button
                className="cursor-pointer rounded-[10px] border border-(--accent-border) bg-(--accent-bg) px-3 py-2 font-(--mono) text-[14px] text-(--text-h) hover:border-(--accent) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
                onClick={feed}
                disabled={isSleeping || !canFeed.ok}
                title={feedTitle}
                aria-disabled={isSleeping || !canFeed.ok}
            >
              Alimentar
            </button>
            <button
                className="cursor-pointer rounded-[10px] border border-(--accent-border) bg-(--accent-bg) px-3 py-2 font-(--mono) text-[14px] text-(--text-h) hover:border-(--accent) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
                onClick={play}
                disabled={isSleeping || !canPlay.ok}
                title={playTitle}
                aria-disabled={isSleeping || !canPlay.ok}
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
                disabled={!canSleep.ok}
                title={sleepTitle}
                aria-disabled={!canSleep.ok}
              >
                Dormir
              </button>
            )}
          </div>
        )}
      </section>

      <aside className="fixed right-4 top-1/2 -translate-y-1/2 z-50">
        <div className="flex flex-col gap-2 rounded-2xl border border-(--border) bg-[color-mix(in_oklab,var(--code-bg)_70%,transparent)] p-2 shadow-(--shadow)">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-xl border border-(--border) bg-[color-mix(in_oklab,var(--bg)_85%,transparent)] text-(--text-h) hover:border-(--accent) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
            onClick={() => setSettingsOpen(true)}
            aria-label="Configurações"
            title="Configurações"
          >
            <img src={CogIcon} alt="" className="h-5 w-5 opacity-90" />
          </button>
        </div>
      </aside>

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
                <label className="font-(--mono) text-[13px] opacity-85" htmlFor="pet-name">
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
                <label className="font-(--mono) text-[13px] opacity-85" htmlFor="model">
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
    </main>
  );
}

function IconBolt() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M13 2 3 14h8l-1 8 10-12h-8l1-8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
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

export default App;
