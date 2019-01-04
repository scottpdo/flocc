// @flow
import { GridEnvironment } from '../environments/GridEnvironment';

class ASCIIRenderer {

  /** @member GridEnvironment */
  environment: GridEnvironment;
  /** @member HTMLPreElement */
  pre: HTMLPreElement;

  constructor(environment: GridEnvironment, opts: Object = {}) {

    this.environment = environment;
    // $FlowFixMe
    environment.renderer = this;

    this.pre = document.createElement('pre');
  }

  mount(el: string | HTMLElement) {
    const container = (typeof el === 'string') ? document.querySelector(el) : el;
    if (container) container.appendChild(this.pre);
  }

  render() {
    this.pre.innerHTML = '';
    this.environment.loop((x, y, agent) => {
      let value: string = ' ';
      const cell = this.environment.getCell(x, y);
      if (agent && agent.get('value')) {
        value = agent.get('value');
      } else if (cell && cell.get('value')) {
        value = cell.get('value');
      }
      this.pre.innerHTML += value;
      if (x === this.environment.width - 1) this.pre.innerHTML += '\n';
    });
  }
};

export { ASCIIRenderer };