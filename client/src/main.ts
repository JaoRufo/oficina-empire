import Phaser from "phaser";
import { GameScene } from "./game/scenes/GameScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,

  width: 1280,
  height: 720,

  parent: "app",

  scene: [GameScene],
};

new Phaser.Game(config);
