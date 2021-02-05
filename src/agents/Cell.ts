import { Agent } from "./Agent";

/**
 * @since 0.0.14
 */
class Cell extends Agent {
  constructor(x: number, y: number) {
    super();
    this.set({ x, y });
  }
}

export { Cell };
