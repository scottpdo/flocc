/// <reference path="../environments/GridEnvironment.d.ts" />
/// <reference path="./Renderer.d.ts" />

declare class ASCIIRenderer implements Renderer {

  constructor(environment: GridEnvironment);

  environment: GridEnvironment;
  pre: HTMLPreElement;

  render(): void;
  mount(el: string | HTMLElement): void;
}
