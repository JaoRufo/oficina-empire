import Phaser from "phaser";
import { socket } from "../service/socket";

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  private socketText!: Phaser.GameObjects.Text;

  constructor() {
    super("game");
  }

  create() {
    this.cameras.main.setBackgroundColor("#1e1e1e");

    this.player = this.add.rectangle(400, 300, 50, 50, 0xff0000);

    this.cursors = this.input.keyboard!.createCursorKeys();

    this.socketText = this.add.text(20, 20, "Connecting...", {
      fontSize: "24px",
      color: "#ffffff",
    });

    socket.on("connect", () => {
      console.log("Connected:", socket.id);

      this.socketText.setText(`Socket: ${socket.id}`);
    });
  }

  update() {
    const speed = 5;

    if (this.cursors.left.isDown) {
      this.player.x -= speed;
    }

    if (this.cursors.right.isDown) {
      this.player.x += speed;
    }

    if (this.cursors.up.isDown) {
      this.player.y -= speed;
    }

    if (this.cursors.down.isDown) {
      this.player.y += speed;
    }
  }
}
