## Contexto do projeto (até agora)

Este projeto é um app **Vite + React + TypeScript** com um “mini palco” 2D usando **Phaser** para exibir um personagem animado (spritesheet) se movimentando automaticamente, como em um jogo de plataforma.

## O que foi implementado

- **Integração do Phaser no React**: o Phaser é montado em um componente React e destruído corretamente no unmount.
- **Spritesheet do personagem**: carregamento de spritesheet a partir do padrão `src/assets/models/{model}/{animation}.png`.
- **Animação "walk" do modelo "fox"**: por padrão o app instancia `model="fox"` e `animation="walk"`.
- **Movimento automático (patrol)**: o personagem anda continuamente de um lado para o outro dentro de uma faixa central de aproximadamente **60% da largura da tela**.
- **Controle de direção da animação**: o spritesheet pode ser resolvido por direção (`up`, `down`, `left`, `right`) e o palco pode tocar uma direção fixa (prop) ou alternar automaticamente entre esquerda/direita durante o patrol.
- **Virada com “olhar pra frente”**: ao chegar no fim do patrol, o personagem toca rapidamente a direção `down` (de frente pra tela) e então volta a andar na direção oposta.
- **Aparência “plataforma”**: um “chão” simples é desenhado na cena para dar referência visual.
- **Estrutura para troca fácil de modelo**: as specs do spritesheet (frames, fps, escala, velocidade, etc.) ficam centralizadas em um único arquivo, facilitando adicionar novos modelos/animações.

## Arquivos principais

- `src/components/PhaserStage.tsx`
  - Componente React que cria a instância do Phaser e recebe `model`, `animation`, `direction`, `patrolWidthRatio` e `heightPx`.
- `src/game/createGame.ts`
  - Função que cria o `Phaser.Game` e aplica resize via `ResizeObserver`.
- `src/game/PatrolScene.ts`
  - Cena responsável por preload do spritesheet, criação de animações por direção e lógica de “ir e voltar” (patrol).
- `src/game/models.ts`
  - Registro `SPRITESHEETS` com as specs por `model` e `animation` (inclui mapeamento de linhas por direção).
- `src/assets/models/fox/walk.png`
  - Spritesheet usado atualmente (grid de frames de 32×32).

## Como trocar o personagem depois

1. Adicione o PNG em `src/assets/models/{novoModel}/{novaAnim}.png`.
2. Inclua a entrada correspondente em `SPRITESHEETS` em `src/game/models.ts` (src, tamanhos de frame e intervalo de frames).
3. Atualize o uso do componente em `src/App.tsx` (ou crie uma UI de seleção) para apontar para o novo `model`/`animation`.

