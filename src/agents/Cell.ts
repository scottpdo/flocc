import { Agent } from './Agent';

class Cell extends Agent {
  constructor(x: number, y: number) {
    super();
    this.set({ x, y });
  }
};

export { Cell };
