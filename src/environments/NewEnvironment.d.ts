/// <reference path="../types/Data.d.ts" />
/// <reference path="./EnvironmentHelper.d.ts" />

type NewRule = (agent: Agent) => Data;

interface Helpers {
  kdtree: EnvironmentHelper;
  network: EnvironmentHelper;
}

declare interface NewEnvironment {
  agents: number;
  current: number;
  data: Map<string, any[]>;
  ids: string[];
  idsToIndices: { [key: string]: number };
  helpers: Helpers;
  opts: EnvironmentOptions;
  nextData: Map<string, any[]>;
  rule: NewRule;
  renderers: Renderer[];
  width: number;
  height: number;
  time: number;

  addAgent(data: Data): Agent;
  getAgents(): Agent[];
}
