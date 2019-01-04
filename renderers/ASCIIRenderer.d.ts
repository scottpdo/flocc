/// <reference path="../src/renderers/Renderer.d.ts" />
/// <reference path="../src/environments/GridEnvironment.d.ts" />
declare class ASCIIRenderer implements Renderer {
    /** @member GridEnvironment */
    environment: GridEnvironment;
    /** @member HTMLPreElement */
    pre: HTMLPreElement;
    constructor(environment: GridEnvironment, opts?: Object);
    mount(el: string | HTMLElement): void;
    render(): void;
}
export { ASCIIRenderer };
