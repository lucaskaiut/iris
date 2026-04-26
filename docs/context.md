## Contexto do projeto (estado atual)

Este projeto é um jogo **Vite + React + TypeScript** com renderização 2D via **Phaser** e um “pet virtual” com **persistência local**, **regras de tempo real (inclusive offline)** e **interações com trade-offs** (alimentar / brincar / dormir).

O objetivo é ter um MVP jogável e previsível, com um loop natural:

```text
comer → brincar → energia cai → dormir → fome cai → comer → repetir
```

## Stack e arquitetura

- **Frontend**: React + TypeScript (Vite).
- **Jogo/Canvas**: Phaser 3 (um sprite central em uma cena simples).
- **Estilos**: Tailwind v4 (via imports em `src/index.css`), com tema (cores/variáveis) aplicado via JS em `src/theme.ts`.
- **Domínio do jogo**: regras puras em `src/pet/domain.ts`.
- **Persistência**: `localStorage` via `src/pet/stores/localStoragePetStore.ts`, com migrações simples.

## Entidade principal (Pet)

O estado persistido do pet é definido em `src/pet/domain.ts` como `Pet` e inclui:

- **Identidade**: `name`, `modelId`
- **Atributos (0–100)**: `hunger` (fome), `health` (saúde), `energy` (energia)
- **Sono**: `isSleeping` (controla travas e regen)
- **Tempo**:
  - `createdAt`, `updatedAt`, `lastInteractionAt`
  - acumuladores de tempo por atributo: `hungerAccMs`, `energyAccMs`, `healthAccMs` (evitam “interferência” entre timers)

## Regras de tempo real (inclui offline)

O progresso do jogo é calculado em `applyTimeProgress(pet, nowMs)` (`src/pet/domain.ts`):

- **Fome**: `-1` a cada **40s** (cai mesmo dormindo)
- **Energia acordado**: `-1` a cada **30s**
- **Energia dormindo (base)**: `+1` a cada **8s**, mas com **eficiência por fome**
- **Saúde (tick)**: a cada **40s**, reage a estados críticos:
  - `fome < 20` → `-2`
  - `energia < 20` → `-2`
  - durante sono, há penalidades extras quando fome crítica/zero (ver seção Sono)

A UI chama o progresso periodicamente via `usePet()` a cada ~2s para refletir mudanças “em tempo real”.

## Ações do jogador (com bloqueios inteligentes)

As ações estão centralizadas no domínio (evita regra espalhada):

- **Bloqueios**: `canFeed(pet)`, `canPlay(pet)`, `canSleep(pet)`
- **Aplicação**: `applyFeed(pet, nowMs)`, `applyPlay(pet, nowMs)`, `applySleep(pet, nowMs)`, `applyWake(pet, nowMs)`

### Alimentar

- **Restrição**: bloqueia se `fome > 90`
- **Efeitos**:
  - `fome +30`
  - `energia +5`
  - se `fome > 70` antes da ação → `saúde -5` (excesso)

### Brincar

- **Restrições**: bloqueia se `energia < 30` ou `fome < 30`
- **Efeitos**:
  - `energia -20`
  - `fome -15`
  - `saúde +10` **somente** se `energia >= 50` **e** `fome >= 50` (brincar “bem”)

### Dormir / Acordar (modo de sono)

Ao dormir:

- **Troca de modo**: `isSleeping = true`
- **Efeito imediato**: `fome -10`
- **UI**:
  - ações **Alimentar** e **Brincar** ficam travadas
  - botão **Dormir** vira **Acordar**

Enquanto dorme:

- **Energia** sobe com **eficiência contínua por fome**:

  \[
  eficiência = clamp(fome/100, 0, 1)
  \]

  - fome alta → regen mais rápida (próxima de +1/8s)
  - fome média → regen mais lenta

- **Fome crítica / fome zero** (anti-exploit):
  - se `fome < 20`: energia **não recupera** e a saúde piora mais rápido (`-2` extra por tick)
  - se `fome == 0`: energia passa a **cair** como acordado e saúde cai ainda mais (`-5` extra por tick)

Ao acordar:

- **Troca de modo**: `isSleeping = false`
- energia volta a cair normalmente

## Condição de falha (MVP)

- **Morte**: `saúde == 0`
  - o pet entra em estado crítico final (ação travada) e a UI sugere reset.

## UI (tela única)

Implementada em `src/App.tsx`, com 3 áreas em grid:

- **Header**: indicadores (rings)
- **Canvas**: Phaser ocupando o espaço restante, responsivo
- **Ações**: botões (alimentar, brincar, dormir/acordar) + travas

Além disso:

- **Sidebar flutuante direita**: botão de configurações (ícone `cog.png`) abre modal central com `Nome` e `Modelo`.

## Debug (somente em dev)

Em `DEV` (`import.meta.env.DEV`), a barra direita mostra um botão **DBG** que abre um painel para ajustar:

- `Fome`, `Saúde`, `Energia` (slider + input)
- `Dormindo` (checkbox)

O debug persiste via `usePet().debugSet(...)` (clamp 0–100) e reseta acumuladores para evitar saltos inesperados.

## Persistência e migração

- Store: `src/pet/stores/localStoragePetStore.ts` (`iris.pet.v1`)
- Migração simples:
  - versões antigas com `happiness` são normalizadas para `health`
  - campos ausentes (`isSleeping`, acumuladores) recebem defaults seguros

## Arquivos principais

- `src/pet/domain.ts`: regras puras (tempo real, ações, bloqueios, sono, morte)
- `src/pet/usePet.ts`: loop/react state + persistência + debug setter
- `src/pet/stores/localStoragePetStore.ts`: load/save + normalização
- `src/App.tsx`: UI (rings, canvas, ações, modal, sidebar, debug dev-only)
- `src/components/StatusRing.tsx`: indicador circular (progress ring) com tooltip embaixo
- `src/components/PhaserStage.tsx` + `src/game/createGame.ts`: canvas responsivo (resize width+height)
- `src/theme.ts`: tema (variáveis + fontes) aplicado via JS
