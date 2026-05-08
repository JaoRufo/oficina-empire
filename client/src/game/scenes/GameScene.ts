import Phaser from "phaser";
import { socket } from "../service/socket";

type RemotePlayer = {
  id: string;
  x: number;
  y: number;
};

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  private players: Record<string, Phaser.GameObjects.Sprite> = {};

  constructor() {
    super("game");
  }

  preload() {
    this.load.image("topLeft", "/assets/tiles/tile_0096.png");

    this.load.image("top", "/assets/tiles/tile_0097.png");

    this.load.image("topRight", "/assets/tiles/tile_0098.png");

    this.load.image("left", "/assets/tiles/tile_0108.png");

    this.load.image("center", "/assets/tiles/tile_0109.png");

    this.load.image("right", "/assets/tiles/tile_0110.png");

    this.load.image("bottomLeft", "/assets/tiles/tile_0120.png");

    this.load.image("bottom", "/assets/tiles/tile_0121.png");

    this.load.image("bottomRight", "/assets/tiles/tile_0122.png");

    this.load.image("player", "/assets/player/man.png");

    this.load.image("suv", "/assets/cars/suv.png");
  }

  create() {
    this.cameras.main.setBackgroundColor("#1e1e1e");

    const TILE_SIZE = 16;

    const mapWidth = 30;
    const mapHeight = 20;

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

    // CARRO EXEMPLO
    const suv = this.add.sprite(600, 300, "suv");

    suv.setScale(2);

    // PLAYER LOCAL
    this.player = this.add.sprite(400, 300, "player");

    this.player.setScale(2);

    this.cursors = this.input.keyboard!.createCursorKeys();

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

    // PLAYER SAIU
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
    const remotePlayer = this.add.sprite(player.x, player.y, "player");

    remotePlayer.setTint(0x00ff00);

    remotePlayer.setScale(2);

    this.players[player.id] = remotePlayer;
  }

  update() {
    const speed = 4;

    let moved = false;

    if (this.cursors.left.isDown) {
      this.player.x -= speed;
      moved = true;
    }

    if (this.cursors.right.isDown) {
      this.player.x += speed;
      moved = true;
    }

    if (this.cursors.up.isDown) {
      this.player.y -= speed;
      moved = true;
    }

    if (this.cursors.down.isDown) {
      this.player.y += speed;
      moved = true;
    }

    if (moved) {
      socket.emit("playerMove", {
        x: this.player.x,
        y: this.player.y,
      });
    }
  }
}
