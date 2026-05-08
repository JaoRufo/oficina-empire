import Phaser from "phaser";
import { socket } from "../service/socket";

type RemotePlayer = {
  id: string;
  x: number;
  y: number;
};

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;

  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };

  private players: Record<string, Phaser.GameObjects.Sprite> = {};

  constructor() {
    super("game");
  }

  preload() {
    // TILES
    this.load.image("topLeft", "/assets/tiles/tile_0096.png");

    this.load.image("top", "/assets/tiles/tile_0097.png");

    this.load.image("topRight", "/assets/tiles/tile_0098.png");

    this.load.image("left", "/assets/tiles/tile_0108.png");

    this.load.image("center", "/assets/tiles/tile_0109.png");

    this.load.image("right", "/assets/tiles/tile_0110.png");

    this.load.image("bottomLeft", "/assets/tiles/tile_0120.png");

    this.load.image("bottom", "/assets/tiles/tile_0121.png");

    this.load.image("bottomRight", "/assets/tiles/tile_0122.png");

    // PLAYER
    this.load.image("player_idle", "/assets/player/man.png");

    this.load.image("player_walk1", "/assets/player/man_walk1.png");

    this.load.image("player_walk2", "/assets/player/man_walk2.png");

    // CARRO
    this.load.image("suv", "/assets/cars/suv.png");
  }

  create() {
    this.cameras.main.setBackgroundColor("#1e1e1e");

    const TILE_SIZE = 16;

    const mapWidth = 30;
    const mapHeight = 20;

    // MAPA
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        let tile = "center";

        // CANTOS
        if (x === 0 && y === 0) {
          tile = "topLeft";
        } else if (x === mapWidth - 1 && y === 0) {
          tile = "topRight";
        } else if (x === 0 && y === mapHeight - 1) {
          tile = "bottomLeft";
        } else if (x === mapWidth - 1 && y === mapHeight - 1) {
          tile = "bottomRight";
        }

        // BORDAS
        else if (y === 0) {
          tile = "top";
        } else if (y === mapHeight - 1) {
          tile = "bottom";
        } else if (x === 0) {
          tile = "left";
        } else if (x === mapWidth - 1) {
          tile = "right";
        }

        // CENTRO
        else {
          tile = "center";
        }

        this.add.image(x * TILE_SIZE, y * TILE_SIZE, tile).setOrigin(0);
      }
    }

    // CARRO
    const suv = this.add.sprite(600, 300, "suv");

    suv.setScale(2);

    // PLAYER
    this.player = this.add.sprite(400, 300, "player_idle");

    this.player.setScale(2);

    // ANIMAÇÃO
    this.anims.create({
      key: "walk",

      frames: [{ key: "player_walk1" }, { key: "player_walk2" }],

      frameRate: 8,
      repeat: -1,
    });

    // WASD
    this.wasd = this.input.keyboard!.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
    }) as typeof this.wasd;

    // PLAYERS ATUAIS
    socket.on("currentPlayers", (players: Record<string, RemotePlayer>) => {
      Object.values(players).forEach((player) => {
        if (player.id === socket.id) return;

        this.addRemotePlayer(player);
      });
    });

    // NOVO PLAYER
    socket.on("newPlayer", (player: RemotePlayer) => {
      this.addRemotePlayer(player);
    });

    // PLAYER MOVEU
    socket.on("playerMoved", (player: RemotePlayer) => {
      const remotePlayer = this.players[player.id];

      if (!remotePlayer) return;

      remotePlayer.x = player.x;
      remotePlayer.y = player.y;
    });

    // PLAYER DESCONECTOU
    socket.on("playerDisconnected", (playerId: string) => {
      const player = this.players[playerId];

      if (!player) return;

      player.destroy();

      delete this.players[playerId];
    });

    // CAMERA
    this.cameras.main.startFollow(this.player);

    this.cameras.main.setZoom(2);
  }

  addRemotePlayer(player: RemotePlayer) {
    const remotePlayer = this.add.sprite(player.x, player.y, "player_idle");

    remotePlayer.setTint(0x00ff00);

    remotePlayer.setScale(2);

    this.players[player.id] = remotePlayer;
  }

  update() {
    const speed = 2;

    let moved = false;

    // ESQUERDA
    if (this.wasd.A.isDown) {
      this.player.x -= speed;

      this.player.setFlipX(true);

      moved = true;
    }

    // DIREITA
    if (this.wasd.D.isDown) {
      this.player.x += speed;

      this.player.setFlipX(false);

      moved = true;
    }

    // CIMA
    if (this.wasd.W.isDown) {
      this.player.y -= speed;

      moved = true;
    }

    // BAIXO
    if (this.wasd.S.isDown) {
      this.player.y += speed;

      moved = true;
    }

    // TOCA ANIMAÇÃO
    if (moved) {
      if (!this.player.anims.isPlaying) {
        this.player.play("walk");
      }

      socket.emit("playerMove", {
        x: this.player.x,
        y: this.player.y,
      });
    }

    // IDLE
    else {
      this.player.anims.stop();

      this.player.setTexture("player_idle");
    }
  }
}
