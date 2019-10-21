/// <reference path="./Renderer.d.ts" />
/// <reference path="../types/Point.d.ts" />
import { Environment } from "../environments/Environment";
import { utils } from "../utils/utils";

export default class Histogram implements Renderer {
  environment: Environment;

  constructor(environment: Environment) {
    this.environment = environment;
  }

  mount(el: string | HTMLElement): void {}
  render(): void {}
}
