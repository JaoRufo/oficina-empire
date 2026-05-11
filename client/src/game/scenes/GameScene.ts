import Phaser from "phaser";
// import { socket } from "../service/socket";

type RemotePlayer = {
  id: string;
  x: number;
  y: number;
};

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private suv!: Phaser.Physics.Arcade.Sprite;
  private elevator!: Phaser.GameObjects.Image;

  private suvScale = 0.15;
  private suvStartX = 220;
  private suvStartY = 160;
  private elevatorX = 500;
  private elevatorY = 160;
  private elevatorScale = 0.2;
  private playerScale = 0.15;

  private readonly walkTool1Scale = 0.15 * (244 / 471);
  private readonly walkTool2Scale = 0.15;

  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };

  private interactionZone!: Phaser.GameObjects.Zone;
  private players: Record<string, Phaser.GameObjects.Sprite> = {};
  private suvBalloon!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private canInteract = false;
  private isRepairing = false;

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
    this.load.image("man_thinking", "/assets/player/man-thinking.png");
    this.load.image("man_toolbox", "/assets/player/man-toolbox.png");
    this.load.image("man_walk_tool1", "/assets/player/man-walk-tool1.png");
    this.load.image("man_walk_tool2", "/assets/player/man-walk-tool2.png");
    this.load.image(
      "man_fixing_engine",
      "/assets/player/man-fixing-engine.png",
    );
    this.load.image("man_jumping", "/assets/player/man-jumping.png");

    // CARRO
    this.load.image("suv", "/assets/cars/suv.png");
    this.load.image("suv_returning", "/assets/cars/suv-returning.png");

    // PROPS
    this.load.image(
      "elevator_without_car",
      "/assets/props/elevator-without-car.png",
    );
    this.load.image("car_on_elevator", "/assets/props/car-on-elevator.png");
    this.load.image(
      "red_ram_elevator_broken",
      "/assets/props/red-ram-elevator-broken.png",
    );
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
        if (x === 0 && y === 0) tile = "topLeft";
        else if (x === mapWidth - 1 && y === 0) tile = "topRight";
        else if (x === 0 && y === mapHeight - 1) tile = "bottomLeft";
        else if (x === mapWidth - 1 && y === mapHeight - 1)
          tile = "bottomRight";
        else if (y === 0) tile = "top";
        else if (y === mapHeight - 1) tile = "bottom";
        else if (x === 0) tile = "left";
        else if (x === mapWidth - 1) tile = "right";
        this.add.image(x * TILE_SIZE, y * TILE_SIZE, tile).setOrigin(0);
      }
    }

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

    // ELEVADOR
    this.elevator = this.add.image(
      this.elevatorX,
      this.elevatorY,
      "elevator_without_car",
    );
    this.elevator.setScale(this.elevatorScale);

    // SUV
    this.suv = this.physics.add.sprite(this.suvStartX, this.suvStartY, "suv");
    this.suv.setScale(this.suvScale);
    this.suv.setImmovable(true);
    (this.suv.body as Phaser.Physics.Arcade.Body).setSize(
      this.suv.width * 0.85,
      this.suv.height * 0.12,
    );
    (this.suv.body as Phaser.Physics.Arcade.Body).setOffset(
      this.suv.width * 0.075,
      this.suv.height * 0.55,
    );

    // ZONA DE INTERAÇÃO
    this.interactionZone = this.add.zone(0, 0, 70, 70);
    this.interactionZone.setPosition(this.suv.x, this.suv.y);
    this.physics.add.existing(this.interactionZone);
    const interactionBody = this.interactionZone
      .body as Phaser.Physics.Arcade.Body;
    interactionBody.setAllowGravity(false);
    interactionBody.setImmovable(true);
    interactionBody.setSize(70, 70);

    // PLAYER
    this.player = this.physics.add.sprite(100, 100, "player_idle");
    this.player.setScale(this.playerScale);
    this.player.setCollideWorldBounds(true);
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(
      this.player.width * 0.35,
      this.player.height * 0.55,
    );

    this.physics.add.collider(this.player, this.suv);
    this.physics.add.overlap(this.player, this.interactionZone, () => {
      this.canInteract = true;
    });

    // ANIMAÇÕES
    this.anims.create({
      key: "walk",
      frames: [{ key: "player_idle" }, { key: "player_walk1" }],
      frameRate: 6,
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

    // BALÃO SUV
    this.suvBalloon = this.add.text(0, 0, "[E] Reparar Veiculo", {
      fontSize: "13px",
      color: "#ffffff",
      backgroundColor: "#000000cc",
      padding: { x: 6, y: 3 },
    });
    this.suvBalloon.setOrigin(0.5, 1);
    this.suvBalloon.setDepth(999);
    this.suvBalloon.setScrollFactor(0);
    this.suvBalloon.setVisible(false);

    // STATUS TEXT (UI)
    this.statusText = this.add.text(640, 360, "", {
      fontSize: "18px",
      color: "#ffffff",
      backgroundColor: "#000000cc",
      padding: { x: 16, y: 8 },
    });
    this.statusText.setOrigin(0.5, 0.5);
    this.statusText.setScrollFactor(0);
    this.statusText.setDepth(1000);
    this.statusText.setVisible(false);

    // CAMERA
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setZoom(2);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

    // CAMERA UI
    const uiCamera = this.cameras.add(0, 0, 1280, 720);
    const uiObjects = [this.suvBalloon, this.statusText];
    uiCamera.ignore(
      this.children.list.filter(
        (c) => !uiObjects.includes(c as Phaser.GameObjects.Text),
      ),
    );
    this.cameras.main.ignore(uiObjects);
  }

  addRemotePlayer(player: RemotePlayer) {
    const remotePlayer = this.add.sprite(player.x, player.y, "player_idle");
    remotePlayer.setTint(0x00ff00);
    remotePlayer.setScale(this.playerScale);
    this.players[player.id] = remotePlayer;
  }

  private setWalkToolTexture(toggle: boolean) {
    if (toggle) {
      this.player.setTexture("man_walk_tool1");
      this.player.setScale(this.walkTool1Scale);
    } else {
      this.player.setTexture("man_walk_tool2");
      this.player.setScale(this.walkTool2Scale);
    }
  }

  private startRepair() {
    this.isRepairing = true;
    this.player.setVelocity(0);
    this.player.anims.stop();
    this.statusText.setVisible(true);
    this.statusText.setText("Levando veículo ao elevador...");

    const nearElevatorX = this.elevatorX - 30;
    const nearElevatorY = this.elevatorY + 25;

    this.player.setVisible(false);
    (this.suv.body as Phaser.Physics.Arcade.Body).enable = false;

    // SUV VAI ATÉ ELEVADOR
    this.tweens.add({
      targets: this.suv,
      x: this.elevatorX,
      y: this.elevatorY,
      duration: 2000,
      onComplete: () => {
        this.suv.setVisible(false);
        this.elevator.setTexture("car_on_elevator");

        // PLAYER APARECE JÁ EM THINKING
        this.player.setVisible(true);
        this.player.setPosition(nearElevatorX, nearElevatorY);
        this.player.setTexture("man_thinking");
        this.player.setScale(this.playerScale);
        this.statusText.setText("Analisando problema...");

        this.time.delayedCall(1600, () => {
          this.elevator.setTexture("red_ram_elevator_broken");

          // MAN-TOOLBOX
          this.time.delayedCall(1500, () => {
            this.statusText.setText("Pegando ferramentas...");
            this.player.setTexture("man_toolbox");
            this.player.setScale(this.playerScale);

            // ANDA ATÉ O MOTOR
            this.time.delayedCall(800, () => {
              let toggle = false;
              const toolWalk = this.time.addEvent({
                delay: 150,
                loop: true,
                callback: () => {
                  this.setWalkToolTexture(toggle);
                  toggle = !toggle;
                },
              });

              this.player.setFlipX(false);
              this.tweens.add({
                targets: this.player,
                x: this.elevatorX - 10,
                y: this.elevatorY + 25,
                duration: 900,
                onComplete: () => {
                  toolWalk.remove();
                  this.statusText.setText("Consertando motor...");
                  this.player.setTexture("man_fixing_engine");
                  this.player.setScale(this.playerScale);

                  // VOLTA COM FERRAMENTA
                  this.time.delayedCall(3000, () => {
                    let returnToggle = false;
                    const returnWalk = this.time.addEvent({
                      delay: 150,
                      loop: true,
                      callback: () => {
                        this.setWalkToolTexture(returnToggle);
                        returnToggle = !returnToggle;
                      },
                    });

                    this.player.setFlipX(true);
                    this.tweens.add({
                      targets: this.player,
                      x: nearElevatorX,
                      y: nearElevatorY,
                      duration: 900,
                      onComplete: () => {
                        returnWalk.remove();
                        this.statusText.setText("Guardando ferramentas...");
                        this.player.setTexture("man_toolbox");
                        this.player.setScale(this.playerScale);

                        this.time.delayedCall(1000, () => {
                          this.elevator.setTexture("car_on_elevator");

                          // THINKING FINAL
                          this.player.setTexture("man_thinking");
                          this.player.setScale(this.playerScale);
                          this.statusText.setText("Inspecionando resultado...");

                          this.time.delayedCall(2000, () => {
                            // 1 PULO DE CELEBRAÇÃO
                            this.player.setTexture("man_jumping");
                            this.player.setScale(
                              this.playerScale * (308 / 552),
                            );

                            this.time.delayedCall(500, () => {
                              this.player.setTexture("man_thinking");
                              this.player.setScale(this.playerScale);

                              this.time.delayedCall(300, () => {
                                this.player.setVisible(false);

                                this.time.delayedCall(1200, () => {
                                  this.elevator.setTexture(
                                    "elevator_without_car",
                                  );
                                  this.suv.setVisible(true);
                                  this.suv.setTexture("suv_returning");
                                  this.suv.setScale(this.suvScale);
                                  this.suv.setPosition(
                                    this.elevatorX,
                                    this.elevatorY,
                                  );

                                  this.tweens.add({
                                    targets: this.suv,
                                    x: this.suvStartX,
                                    y: this.suvStartY,
                                    duration: 2000,
                                    onComplete: () => {
                                      this.suv.setTexture("suv");
                                      (
                                        this.suv
                                          .body as Phaser.Physics.Arcade.Body
                                      ).enable = true;
                                      this.statusText.setText(
                                        "Veículo entregue!",
                                      );

                                      // PLAYER APARECE APÓS SUV PARAR
                                      this.player.setVisible(true);
                                      this.player.setPosition(
                                        this.suvStartX - 25,
                                        this.suvStartY + 20,
                                      );
                                      this.player.setTexture("player_idle");
                                      this.player.setScale(this.playerScale);
                                      this.player.setFlipX(false);

                                      this.time.delayedCall(2000, () => {
                                        this.statusText.setVisible(false);
                                        this.isRepairing = false;
                                      });
                                    },
                                  });
                                });
                              }); // fecha delayedCall 300
                            }); // fecha delayedCall 400
                          }); // fecha delayedCall 2000 thinking final
                        });
                      },
                    });
                  });
                },
              });
            });
          });
        });
      },
    });
  }

  update() {
    const wasInteracting = this.canInteract;
    this.canInteract = false;

    // BALÃO DO SUV
    const cam = this.cameras.main;
    const suvScreenX = (this.suv.x - cam.worldView.x) * cam.zoom;
    const suvScreenY = (this.suv.y - cam.worldView.y) * cam.zoom - 50;
    this.suvBalloon.setPosition(suvScreenX, suvScreenY);
    this.suvBalloon.setVisible(wasInteracting && !this.isRepairing);

    if (
      wasInteracting &&
      !this.isRepairing &&
      Phaser.Input.Keyboard.JustDown(this.interactKey)
    ) {
      this.startRepair();
    }

    const speed = 120;
    let moved = false;

    this.player.setVelocity(0);

    if (this.wasd.A.isDown) {
      this.player.setVelocityX(-speed);
      this.player.setFlipX(true);
      moved = true;
    }
    if (this.wasd.D.isDown) {
      this.player.setVelocityX(speed);
      this.player.setFlipX(false);
      moved = true;
    }
    if (this.wasd.W.isDown) {
      this.player.setVelocityY(-speed);
      moved = true;
    }
    if (this.wasd.S.isDown) {
      this.player.setVelocityY(speed);
      moved = true;
    }

    (this.player.body as Phaser.Physics.Arcade.Body).velocity
      .normalize()
      .scale(speed);

    // PROFUNDIDADE (sempre atualiza, mesmo durante reparo)
    this.player.setDepth(this.player.y);
    this.suv.setDepth(this.suv.y);

    if (this.isRepairing) return;

    if (moved) {
      if (!this.player.anims.isPlaying) this.player.play("walk");
    } else {
      this.player.anims.stop();
      this.player.setTexture("player_idle");
    }
  }
}
