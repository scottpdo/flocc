// @flow
import { Environment } from '../environments/Environment';

type Options = {
  width: number;
  height: number;
  trace: boolean;
};

class CanvasRenderer {

  /** @member Environment */
  environment: Environment;
  opts: Options;
  /** @member HTMLCanvasElement */
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  width: number;
  height: number;

  constructor(environment: Environment, opts: Options = { width: 500, height: 500, trace: false }) {

    this.environment = environment;
    // $FlowFixMe
    environment.renderer = this;

    this.opts = opts;

    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');

    this.width = opts.width;
    this.height = opts.height;

    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  mount(el: string | HTMLElement) {
    const container = (typeof el === 'string') ? document.querySelector(el) : el;
    if (container) container.appendChild(this.canvas);
  }

  render() {
    const { context, environment, width, height } = this;

    // if "trace" is truthy, don't clear the canvas with every frame
    // to trace the paths of agents
    if (!this.opts.trace) context.clearRect(0, 0, width, height);

    environment.getAgents().forEach(agent => {
      // $FlowFixMe -- TODO: not sure why .getData() is reading incorrectly here...?
      const { x, y, color, radius } = agent.getData();
      context.beginPath();
      context.moveTo(x, y);
      context.fillStyle = color || 'black';
      context.arc(
        x, 
        y, 
        radius || 1,
        0, 
        2 * Math.PI
        );
        context.fill();
    });
  }
};

export { CanvasRenderer };