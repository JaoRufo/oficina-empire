# 🔧 Oficina Empire

Um jogo multiplayer 2D de simulação de oficina mecânica, desenvolvido com Phaser 4, TypeScript, Vite e Socket.IO.

---

## 🎮 Sobre o Jogo

Em Oficina Empire você controla um mecânico em uma oficina top-down. Veículos chegam com problemas e é sua missão inspecionar, buscar ferramentas, consertar o motor e devolver o carro ao cliente — tudo com animações frame a frame e suporte multiplayer em tempo real.

---

## ✨ Funcionalidades

- 🚗 **Veículo interativo** — aproxime-se do SUV e pressione `E` para iniciar o reparo
- 🔩 **Sequência de animação completa** — thinking → toolbox → walk com ferramenta → fixing engine → jumping de celebração
- 🏗️ **Elevador funcional** — o carro sobe ao elevador, é reparado e retorna à posição original
- 👥 **Multiplayer em tempo real** — múltiplos jogadores visíveis simultaneamente via Socket.IO
- 🎥 **Câmera com zoom** — segue o jogador com zoom 2x e limites de mundo
- 🖼️ **UI separada** — balão de interação acima do veículo e status de progresso na tela
- 🗺️ **Mapa tile-based** — grid 40x22 com bordas e cantos

---

## 🛠️ Stack

| Camada      | Tecnologia                                   |
| ----------- | -------------------------------------------- |
| Engine      | [Phaser 4](https://phaser.io/)               |
| Frontend    | [Vite](https://vitejs.dev/) + TypeScript     |
| Backend     | [Fastify](https://fastify.dev/) + TypeScript |
| Multiplayer | [Socket.IO](https://socket.io/)              |
| Runtime     | [tsx](https://github.com/privatenumber/tsx)  |

---

## 📁 Estrutura do Projeto

```
oficina_empire/
├── client/                  # Frontend — jogo Phaser
│   ├── public/
│   │   └── assets/
│   │       ├── cars/        # Sprites dos veículos
│   │       ├── player/      # Sprites do mecânico
│   │       ├── props/       # Elevador e props
│   │       └── tiles/       # Tiles do mapa
│   └── src/
│       ├── game/
│       │   ├── scenes/      # GameScene principal
│       │   └── service/     # Conexão Socket.IO
│       ├── main.ts          # Inicialização do Phaser
│       └── style.css
└── server/                  # Backend — servidor de jogo
    └── src/
        └── app.ts           # Fastify + Socket.IO
```

---

## 🚀 Como Rodar

### Pré-requisitos

- Node.js 18+
- npm

### 1. Servidor

```bash
cd server
npm install
npm run dev
```

O servidor sobe na porta `3333`.

### 2. Cliente

```bash
cd client
npm install
npm run dev
```

Acesse `http://localhost:5173` no navegador.

> Abra múltiplas abas para testar o multiplayer.

---

## 🎮 Controles

| Tecla           | Ação                                           |
| --------------- | ---------------------------------------------- |
| `W` `A` `S` `D` | Mover o mecânico                               |
| `E`             | Interagir com o veículo (dentro da zona verde) |

---

## 🔄 Fluxo de Reparo

```
Pressiona E
    └── SUV se move até o elevador
        └── Player aparece em thinking
            └── Elevador quebra (red ram)
                └── Player pega ferramentas (man-toolbox)
                    └── Anda até o motor (man-walk-tool)
                        └── Conserta (man-fixing-engine)
                            └── Volta com ferramentas
                                └── Guarda ferramentas
                                    └── Thinking final
                                        └── Jumping de celebração 🎉
                                            └── SUV retorna pronto
```

---

## 🌐 Multiplayer

- Cada jogador conectado recebe uma posição inicial aleatória
- Jogadores remotos são exibidos com tint verde para diferenciação
- Movimentos são sincronizados em tempo real via `playerMove` / `playerMoved`
- Desconexões são tratadas automaticamente removendo o sprite do jogador

---

## 📦 Scripts

### Cliente

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build de produção
npm run preview  # Preview do build
```

### Servidor

```bash
npm run dev      # Inicia com hot-reload via tsx
```
