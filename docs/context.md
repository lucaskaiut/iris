## Contexto do projeto (até agora)

Este projeto é um app **Vite + React + TypeScript** com um “mini palco” 2D usando **Phaser** para exibir um personagem animado (spritesheet) com movimento horizontal manual, como em um jogo de plataforma.

## O que foi implementado

- **Integração do Phaser no React**: o Phaser é montado em um componente React e destruído corretamente no unmount.
- **Spritesheet do personagem**: carregamento de spritesheet a partir do padrão `src/assets/models/{model}/{animation}.png`.
- **Seleção de modelo**: os modelos são detectados automaticamente a partir dos diretórios em `src/assets/models/*` e podem ser escolhidos em um seletor acima do canvas.
- **Seleção de animação**: as animações são detectadas automaticamente a partir de `src/assets/models/{model}/*.png` e exibidas em botões no rodapé. A animação `death` é ignorada.
- **Movimento manual**: setas (←/→) controlam o movimento enquanto pressionadas. Ao soltar, o personagem para e fica de frente (`down`).
- **Animação ao andar**: enquanto se move, o palco tenta trocar para `walk` (se existir no modelo) e volta para a animação selecionada ao parar.
- **Aparência “plataforma”**: um “chão” simples é desenhado na cena para dar referência visual.
- **Specs por modelo**: `getSpriteSheetSpec` define tamanho de frame, colunas e mapeamento de direções por modelo (por exemplo, `great_dane` não usa o mesmo grid do `fox`).

## Arquivos principais

- `src/components/PhaserStage.tsx`
  - Componente React que cria a instância do Phaser e recebe `model`, `animation`, `moveDir`, `patrolWidthRatio` e `heightPx`.
- `src/game/createGame.ts`
  - Função que cria o `Phaser.Game` e aplica resize via `ResizeObserver`.
- `src/game/PatrolScene.ts`
  - Cena responsável por preload do spritesheet, criação de animações por direção e lógica de movimento/virada.
- `src/game/models.ts`
  - `getSpriteSheetSpec` com specs por modelo/animação (grid, fps, escala, velocidade).
- `src/game/assets.ts`
  - Leitura dos assets via `import.meta.glob` e utilitários para listar modelos/ animações (com exclusões).
- `src/assets/models/fox/*.png`
  - Spritesheets do modelo `fox`.
- `src/assets/models/great_dane/*.png`
  - Spritesheets do modelo `great_dane`.

## Como adicionar um novo modelo

1. Crie `src/assets/models/{novoModel}/...png`.
2. Adicione um branch em `getSpriteSheetSpec` em `src/game/models.ts` com `frameWidth`, `frameHeight`, `columns` (ou regra equivalente) e `directionRows`.
3. O seletor de modelos e a lista de animações passam a refletir automaticamente via `import.meta.glob`.
