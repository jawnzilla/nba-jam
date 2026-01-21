import Phaser from 'phaser';

export enum InputAction {
  MOVE_LEFT = 'move_left',
  MOVE_RIGHT = 'move_right',
  MOVE_UP = 'move_up',
  MOVE_DOWN = 'move_down',
  SHOOT = 'shoot',
  PASS = 'pass',
  TURBO = 'turbo',
  STEAL = 'steal',
  PAUSE = 'pause',
  CONFIRM = 'confirm',
  CANCEL = 'cancel',
  MENU_UP = 'menu_up',
  MENU_DOWN = 'menu_down',
}

export interface InputState {
  moveX: number;
  moveY: number;
  shoot: boolean;
  pass: boolean;
  turbo: boolean;
  steal: boolean;
}

type ActionCallback = () => void;

export class InputManager {
  private scene: Phaser.Scene;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys: Map<string, Phaser.Input.Keyboard.Key> = new Map();
  private actionCallbacks: Map<InputAction, ActionCallback[]> = new Map();
  private inputBuffer: InputAction[] = [];
  private bufferTimeout = 100;
  private enabled = true;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupKeyboard();
  }

  private setupKeyboard(): void {
    if (!this.scene.input.keyboard) return;

    this.cursors = this.scene.input.keyboard.createCursorKeys();

    const keyBindings = [
      { key: 'W', action: InputAction.MOVE_UP },
      { key: 'A', action: InputAction.MOVE_LEFT },
      { key: 'S', action: InputAction.MOVE_DOWN },
      { key: 'D', action: InputAction.MOVE_RIGHT },
      { key: 'SPACE', action: InputAction.SHOOT },
      { key: 'E', action: InputAction.PASS },
      { key: 'SHIFT', action: InputAction.TURBO },
      { key: 'Q', action: InputAction.STEAL },
      { key: 'ESC', action: InputAction.PAUSE },
      { key: 'ENTER', action: InputAction.CONFIRM },
    ];

    keyBindings.forEach(({ key, action }) => {
      const keyObj = this.scene.input.keyboard!.addKey(key);
      this.keys.set(action, keyObj);
    });

    this.scene.input.keyboard.on('keydown-ESC', () => this.triggerAction(InputAction.PAUSE));
    this.scene.input.keyboard.on('keydown-SPACE', () => this.triggerAction(InputAction.SHOOT));
    this.scene.input.keyboard.on('keydown-ENTER', () => this.triggerAction(InputAction.CONFIRM));
    this.scene.input.keyboard.on('keydown-E', () => this.triggerAction(InputAction.PASS));
    this.scene.input.keyboard.on('keydown-Q', () => this.triggerAction(InputAction.STEAL));
    this.scene.input.keyboard.on('keydown-UP', () => this.triggerAction(InputAction.MENU_UP));
    this.scene.input.keyboard.on('keydown-DOWN', () => this.triggerAction(InputAction.MENU_DOWN));
    this.scene.input.keyboard.on('keydown-W', () => this.triggerAction(InputAction.MENU_UP));
    this.scene.input.keyboard.on('keydown-S', () => this.triggerAction(InputAction.MENU_DOWN));
  }

  public getInputState(): InputState {
    if (!this.enabled) {
      return { moveX: 0, moveY: 0, shoot: false, pass: false, turbo: false, steal: false };
    }

    let moveX = 0;
    let moveY = 0;

    const leftKey = this.keys.get(InputAction.MOVE_LEFT);
    const rightKey = this.keys.get(InputAction.MOVE_RIGHT);
    const upKey = this.keys.get(InputAction.MOVE_UP);
    const downKey = this.keys.get(InputAction.MOVE_DOWN);
    const turboKey = this.keys.get(InputAction.TURBO);
    const shootKey = this.keys.get(InputAction.SHOOT);
    const passKey = this.keys.get(InputAction.PASS);
    const stealKey = this.keys.get(InputAction.STEAL);

    if (this.cursors?.left.isDown || leftKey?.isDown) {
      moveX = -1;
    } else if (this.cursors?.right.isDown || rightKey?.isDown) {
      moveX = 1;
    }

    if (this.cursors?.up.isDown || upKey?.isDown) {
      moveY = -1;
    } else if (this.cursors?.down.isDown || downKey?.isDown) {
      moveY = 1;
    }

    return {
      moveX,
      moveY,
      shoot: shootKey?.isDown ?? false,
      pass: passKey?.isDown ?? false,
      turbo: turboKey?.isDown ?? false,
      steal: stealKey?.isDown ?? false,
    };
  }

  public onAction(action: InputAction, callback: ActionCallback): () => void {
    if (!this.actionCallbacks.has(action)) {
      this.actionCallbacks.set(action, []);
    }
    this.actionCallbacks.get(action)!.push(callback);

    return () => {
      const callbacks = this.actionCallbacks.get(action);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  private triggerAction(action: InputAction): void {
    if (!this.enabled) return;

    this.inputBuffer.push(action);
    this.scene.time.delayedCall(this.bufferTimeout, () => {
      const index = this.inputBuffer.indexOf(action);
      if (index > -1) {
        this.inputBuffer.splice(index, 1);
      }
    });

    const callbacks = this.actionCallbacks.get(action);
    if (callbacks) {
      callbacks.forEach(cb => cb());
    }
  }

  public hasBufferedAction(action: InputAction): boolean {
    return this.inputBuffer.includes(action);
  }

  public consumeBufferedAction(action: InputAction): boolean {
    const index = this.inputBuffer.indexOf(action);
    if (index > -1) {
      this.inputBuffer.splice(index, 1);
      return true;
    }
    return false;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public clearCallbacks(): void {
    this.actionCallbacks.clear();
  }

  public destroy(): void {
    this.clearCallbacks();
    this.keys.clear();
    this.inputBuffer = [];
  }
}
