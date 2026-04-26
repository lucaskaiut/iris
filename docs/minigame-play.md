## Minigame: Pegue as Estrelinhas

### Objetivo

O botão **Brincar** inicia um minigame curto no canvas do Phaser, onde o jogador controla o pet para **coletar estrelinhas** dentro de um tempo limitado. Ao finalizar, o jogo aplica **custos e recompensas** no pet (saúde, energia e fome) de acordo com o desempenho.

---

## Fluxo funcional (React)

### Estados

O `App.tsx` controla o fluxo com um estado simples:

- **idle**: jogo normal (cena “patrol”)
- **playing**: minigame ativo (outras ações travadas)
- **finished**: modal de resultado

### Início (clique em Brincar)

Ao clicar em **Brincar**:

- valida `canPlay(pet)` (e também se está dormindo / crítico)
- se não puder, mostra uma mensagem (ex.: “Energia muito baixa para brincar”)
- se puder, muda o canvas para `mode="play-minigame"` e trava:
  - **Alimentar**
  - **Dormir**
  - **Brincar**

### Finalização

Quando o Phaser termina, ele emite apenas:

```ts
{ score: number }
```

O React:

- converte `score -> result` no domínio (`classifyPlayScore`)
- aplica o resultado no domínio (`applyPlayResult`) via `usePet().applyPlayMiniGameResult(...)`
- persiste no `localStorage` pela store do `usePet()`
- exibe um modal com:
  - “Você pegou X estrelas.”
  - “Saúde +Y / Energia -Y / Fome -Y”

### Morte durante o minigame

Se o pet chegar a `health == 0` durante o minigame:

- o minigame é encerrado imediatamente
- **nenhum resultado é aplicado**
- a UI mostra “Seu pet morreu!”

---

## Mecânica do minigame (Phaser)

### Cena

Implementada em `src/game/StarCatchScene.ts` e montada via `src/game/createGame.ts`.

Durante o minigame, a cena:

- renderiza o pet como personagem controlável no centro
- impede sair dos limites do canvas (`collideWorldBounds`)
- spawna **uma estrela por vez** (`src/assets/icons/minigames/star.png`)
- ao coletar a estrela, incrementa a pontuação e spawna outra em posição aleatória
- mostra HUD:
  - `Estrelas: N`
  - `Tempo: Ns`
- encerra automaticamente ao chegar em 0s

### Controles

- **Desktop**: setas do teclado + WASD
- **Touch**: arrastar/movimento do pointer (o pet segue o alvo)

### Diagonal

A velocidade é normalizada para que a diagonal não fique mais rápida (normalização do vetor de movimento).

---

## Regras de domínio (puras)

Tudo que é regra de negócio do minigame está centralizado em `src/pet/domain.ts`.

### Conversão score -> resultado

Função:

- `classifyPlayScore(score)`

Faixas:

- 0 a 2: `poor`
- 3 a 5: `normal`
- 6 a 9: `good`
- 10+: `excellent`

### Efeitos por resultado

Constante:

- `PLAY_MINIGAME_EFFECTS`

Valores (clamp 0–100):

- **poor**: energia -15, fome -10, saúde +0
- **normal**: energia -20, fome -15, saúde +5
- **good**: energia -20, fome -15, saúde +10
- **excellent**: energia -25, fome -18, saúde +15

### Aplicação do resultado

Função:

- `applyPlayResult(pet, result, nowMs)`

Regras:

- aplica `applyTimeProgress(pet, nowMs)` **antes**
- revalida `canPlay` (mesmas restrições: morto, dormindo, energia<30, fome<30)
- aplica deltas do resultado e faz clamp
- atualiza `updatedAt` e `lastInteractionAt` com `nowMs`

---

## Integração técnica (React ↔ Phaser)

### Componentes envolvidos

- `src/App.tsx`: controla fluxo do minigame, bloqueios e modal
- `src/components/PhaserStage.tsx`: monta o Phaser e escolhe a cena pelo `mode`
- `src/game/createGame.ts`: cria o `Phaser.Game` e habilita Arcade physics no minigame
- `src/game/StarCatchScene.ts`: execução do minigame e emissão do `score`

---

## Testes unitários

Os testes são feitos somente no domínio (sem React/Phaser/localStorage).

Arquivo:

- `src/pet/domain.test.ts`

Cobertura:

- classificação por score (`classifyPlayScore`)
- aplicação de cada resultado (`applyPlayResult`)
- bloqueios equivalentes a `canPlay`
- clamp 0–100
- atualização de timestamps
- aplicação do progresso de tempo antes do resultado

### Como rodar

```bash
npm test
```

