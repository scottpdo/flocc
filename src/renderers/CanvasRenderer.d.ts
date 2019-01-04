/// <reference path="./Renderer.d.ts" />
/// <reference path="./CanvasRendererOptions.d.ts" />

declare class CanvasRenderer implements Renderer {

  constructor(environment: Environment, opts?: CanvasRendererOptions);

  environment: Environment;
  opts: CanvasRendererOptions;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  width: number;
  height: number;

  mount(el: string | HTMLElement): void;
  render(): void;
}
