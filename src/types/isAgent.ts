/// <reference path="../agents/Agent.d.ts" />

export default function isAgent(a: any): a is Agent {
  return a.environment &&
    a.id &&
    a.get &&
    a.getData &&
    a.set &&
    a.increment &&
    a.decrement
    ? true
    : false;
}
