# 🐣 MVP — Escopo Funcional (Tamagotchi moderno)

## 🎯 Objetivo do MVP

Criar um jogo simples onde o usuário cuida de um pet virtual que:

* perde status com o tempo
* reage às ações do jogador
* pode melhorar ou piorar conforme o cuidado

👉 O MVP deve ser **jogável, persistente e previsível**

---

# 🧩 1. Entidade principal

## 🐾 Pet

### Campos obrigatórios:

* `name`
* `hunger` (0–100)
* `happiness` (0–100)
* `energy` (0–100)
* `createdAt`
* `updatedAt`
* `lastInteractionAt`

---

# ⏱️ 2. Regra de tempo (decay)

## 📌 Comportamento

Os atributos diminuem com o tempo, mesmo offline.

### Regras:

* A cada intervalo de tempo:

  * `hunger` diminui
  * `energy` diminui
  * `happiness` diminui (mais lento)

### Exemplo de regra:

* a cada 1 minuto:

  * hunger -2
  * energy -1
  * happiness -1

---

## ✅ DoD

* Ao reabrir o jogo:

  * sistema recalcula os atributos baseado no tempo passado
* Nenhum atributo pode ficar abaixo de 0 ou acima de 100

---

# 🎮 3. Ações do jogador

## 📌 Ações obrigatórias

### 🍖 Feed (alimentar)

* aumenta `hunger`

### 🎮 Play (brincar)

* aumenta `happiness`
* reduz `energy`

### 🌙 Sleep (dormir)

* aumenta `energy`
* reduz levemente `hunger`

---

## 📊 Regras

* ações não podem ultrapassar limite de 100
* ações não podem reduzir abaixo de 0

---

## ✅ DoD

* cada ação altera corretamente os atributos
* UI reflete a mudança imediatamente
* ações são persistidas

---

# 🧠 4. Estados do pet

## 📌 Estados derivados (não persistidos)

O estado do pet é calculado com base nos atributos:

### Regras:

* `hunger < 20` → pet com fome
* `energy < 20` → cansado
* `happiness < 20` → triste
* todos > 70 → feliz

---

## ✅ DoD

* estado é atualizado automaticamente após qualquer mudança
* UI muda conforme estado (texto ou visual simples)

---

# 🖥️ 5. Interface mínima

## 📌 Tela única

### Deve conter:

* representação visual do pet (imagem/sprite)
* indicadores (barra no topo superior):

  * fome
  * felicidade
  * energia
* botões (barra na parte inferior):

  * alimentar
  * brincar
  * dormir

---

## ✅ DoD

* usuário consegue realizar todas as ações pela UI
* status são visíveis claramente
* feedback visual após ações

---

# 💾 6. Persistência

## 📌 Requisitos

* salvar estado do pet localmente, mas com arquitetura pronta para evoluir para backend. Camada de serviço que armazena no localstorage (ou outro sistema de armazenamento frontend), mas que depois pode facilmente ser trocado para HTTP
* manter:

  * atributos
  * dados do pet
  * timestamps (última interação)

---

## ✅ DoD

* ao atualizar/reabrir:

  * estado é restaurado corretamente
* decay é aplicado com base no tempo real

---

# 🔁 7. Loop do jogo

## 📌 Comportamento contínuo

* sistema atualiza status automaticamente em intervalos

---

## ✅ DoD

* atributos mudam com o tempo sem interação
* UI atualiza sem reload manual

---

# ⚠️ 8. Regras de falha (opcional no MVP, mas recomendado)

## 📌 Condição crítica

* se todos atributos chegarem a 0:

  * pet entra em estado crítico

👉 MVP pode:

* apenas exibir mensagem
* ou travar ações

---

## ✅ DoD

* sistema detecta estado crítico corretamente

---

# 🚀 Resultado esperado

Ao final do MVP, o usuário deve conseguir:

* criar/ver um pet
* acompanhar seus status
* interagir com ele
* sair do jogo e voltar depois com o estado atualizado
* perceber que o pet "vive" ao longo do tempo