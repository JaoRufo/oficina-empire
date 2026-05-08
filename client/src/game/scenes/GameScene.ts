import Phaser from "phaser";
import { socket } from "../service/socket";

type RemotePlayer = {
  id: string;
  x: number;
  y: number;
};

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;

  private suv!: Phaser.Physics.Arcade.Sprite;

  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };

  private interactionZone!: Phaser.GameObjects.Zone;

  private players: Record<string, Phaser.GameObjects.Sprite> = {};

  private interactionText!: Phaser.GameObjects.Text;

  private interactKey!: Phaser.Input.Keyboard.Key;

  private canInteract = false;

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

    const mapWidth = 40;
    const mapHeight = 22;

    const worldWidth = mapWidth * TILE_SIZE;
    const worldHeight = mapHeight * TILE_SIZE;

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

    // LIMITES DO MUNDO
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

    // SUV

    this.suv = this.physics.add.sprite(220, 160, "suv");

    this.suv.setScale(2);

    this.suv.setImmovable(true);

    // ZONA DE INTERAÇÃO
    this.interactionZone = this.add.zone(0, 0, 70, 70);
    this.interactionZone.setPosition(this.suv.x, this.suv.y);

    this.physics.add.existing(this.interactionZone);

    const graphics = this.add.graphics();

    graphics.lineStyle(2, 0x00ff00);

    graphics.strokeRect(
      this.interactionZone.x - 35,
      this.interactionZone.y - 35,
      70,
      70,
    );

    const interactionBody = this.interactionZone
      .body as Phaser.Physics.Arcade.Body;

    interactionBody.setAllowGravity(false);

    interactionBody.setImmovable(true);

    interactionBody.setSize(70, 70);

    // PLAYER
    this.player = this.physics.add.sprite(100, 100, "player_idle");

    this.player.setScale(2);

    this.player.setCollideWorldBounds(true);

    // HITBOX PLAYER
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(
      this.player.width * 0.5,
      this.player.height * 0.7,
    );

    // COLISÃO
    this.physics.add.collider(this.player, this.suv);

    // OVERLAP INTERAÇÃO
    this.physics.add.overlap(this.player, this.interactionZone, () => {
      this.canInteract = true;
    });

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

    this.interactKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.E,
    );

    this.interactionText = this.add.text(0, 0, "[E] Reparar SUV", {
      fontSize: "14px",

      color: "#ffffff",

      backgroundColor: "#000000",

      padding: {
        x: 8,
        y: 4,
      },
    });

    this.interactionText.setVisible(false);

    this.interactionText.setScrollFactor(0);

    this.interactionText.setDepth(999);

    this.interactionText.setOrigin(0, 0);

    // MULTIPLAYER
    socket.on("currentPlayers", (players: Record<string, RemotePlayer>) => {
      Object.values(players).forEach((player) => {
        if (player.id === socket.id) return;

        this.addRemotePlayer(player);
      });
    });

    socket.on("newPlayer", (player: RemotePlayer) => {
      this.addRemotePlayer(player);
    });

    socket.on("playerMoved", (player: RemotePlayer) => {
      const remotePlayer = this.players[player.id];

      if (!remotePlayer) return;

      remotePlayer.x = player.x;
      remotePlayer.y = player.y;
    });

    socket.on("playerDisconnected", (playerId: string) => {
      const player = this.players[playerId];

      if (!player) return;

      player.destroy();

      delete this.players[playerId];
    });

    // CAMERA
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setZoom(2);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

    // CAMERA UI
    const uiCamera = this.cameras.add(0, 0, 1280, 720);
    uiCamera.ignore([
      ...this.children.list.filter((c) => c !== this.interactionText),
    ]);
    this.cameras.main.ignore(this.interactionText);

    this.interactionText.setPosition(
      640 - this.interactionText.displayWidth / 2,
      660,
    );
  }

  addRemotePlayer(player: RemotePlayer) {
    const remotePlayer = this.add.sprite(player.x, player.y, "player_idle");

    remotePlayer.setTint(0x00ff00);

    remotePlayer.setScale(2);

    this.players[player.id] = remotePlayer;
  }

  update() {
    const wasInteracting = this.canInteract;
    this.canInteract = false;

    // usa o valor do frame anterior (setado pelo overlap callback)
    this.interactionText.setVisible(wasInteracting);

    if (wasInteracting) {
      this.interactionText.setPosition(
        640 - this.interactionText.displayWidth / 2,
        660,
      );

      if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        console.log("🔧 Reparando SUV...");
      }
    }

    const speed = 120;

    let moved = false;

    this.player.setVelocity(0);

    // ESQUERDA
    if (this.wasd.A.isDown) {
      this.player.setVelocityX(-speed);

      this.player.setFlipX(true);

      moved = true;
    }

    // DIREITA
    if (this.wasd.D.isDown) {
      this.player.setVelocityX(speed);

      this.player.setFlipX(false);

      moved = true;
    }

    // CIMA
    if (this.wasd.W.isDown) {
      this.player.setVelocityY(-speed);

      moved = true;
    }

    // BAIXO
    if (this.wasd.S.isDown) {
      this.player.setVelocityY(speed);

      moved = true;
    }

    // NORMALIZA DIAGONAL
    (this.player.body as Phaser.Physics.Arcade.Body).velocity
      .normalize()
      .scale(speed);

    // ANIMAÇÃO
    if (moved) {
      if (!this.player.anims.isPlaying) {
        this.player.play("walk");
      }

      socket.emit("playerMove", {
        x: this.player.x,
        y: this.player.y,
      });
    } else {
      this.player.anims.stop();

      this.player.setTexture("player_idle");
    }
  }
}
