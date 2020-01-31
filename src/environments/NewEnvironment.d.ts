/// <reference path="../types/Data.d.ts" />
import { Network } from "../helpers/Network";
import { KDTree } from "../helpers/KDTree";

type NewRule = (agent: Agent) => Data;

interface Helpers {
  kdtree: KDTree;
  network: Network;
}

declare interface NewEnvironment {
  agents: number;
  current: number;
  data: Map<string, any[]>;
  ids: string[] = [];
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
}
