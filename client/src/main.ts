import "./style.css";
import Phaser from "phaser";
import { GameScene } from "./game/scenes/GameScene";

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game-container",

  width: 1280,
  height: 720,

  backgroundColor: "#1e1e1e",
  pixelArt: true,

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },

  scene: [GameScene],
});
