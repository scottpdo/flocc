/// <reference path="../src/renderers/Renderer.d.ts" />
/// <reference path="../src/renderers/CanvasRendererOptions.d.ts" />
/// <reference path="../src/environments/Environment.d.ts" />
declare class CanvasRenderer implements Renderer {
    /** @member Environment */
    environment: Environment;
    opts: CanvasRendererOptions;
    /** @member HTMLCanvasElement */
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    width: number;
    height: number;
    constructor(environment: Environment, opts?: CanvasRendererOptions);
    mount(el: string | HTMLElement): void;
    render(): void;
}
export { CanvasRenderer };
