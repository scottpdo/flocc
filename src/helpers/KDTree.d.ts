/// <reference path="../agents/Agent.d.ts" />
/// <reference path="../environments/NewEnvironment.d.ts" />
import { BBox } from "./BBox";

declare interface KDTree {
  agents: Agent[];
  bbox: BBox;
  depth: number;
  dimension: number;
  environment: NewEnvironment;
  median: number;
  needsUpdating: boolean;
  parent: KDTree;
  left: KDTree;
  right: KDTree;
}
