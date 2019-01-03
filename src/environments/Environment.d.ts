/// <reference path="../agents/Agent.d.ts" />
/// <reference path="../renderers/Renderer.d.ts" />
/// <reference path="../types/EnvironmentOptions.d.ts" />

declare class Environment {

  constructor();

  agents: Array<Agent>;
  renderer: Renderer | null;
  opts: EnvironmentOptions;
  width: number;
  height: number;

  addAgent(agent: Agent): void;
  removeAgent(agent: Agent): void;
  getAgents(): Array<Agent>;
  tick(n?: number): void;
}
