import series from "../utils/series";

interface TerrainOptions {
  async?: boolean;
  grayscale?: boolean;
  scale?: number;
}

const defaultTerrainOptions: TerrainOptions = {
  async: false,
  grayscale: false,
  scale: 1
};

interface Pixel {
  r: number;
  g: number;
  b: number;
  a: number;
}

type TerrainRule = (x: number, y: number) => Pixel | number | void;

const BLACK: Pixel = { r: 0, g: 0, b: 0, a: 255 };
const WHITE: Pixel = { r: 255, g: 255, b: 255, a: 255 };
const RED: Pixel = { r: 255, g: 0, b: 0, a: 255 };
const MAROON: Pixel = { r: 127, g: 0, b: 0, a: 255 };
const YELLOW: Pixel = { r: 255, g: 255, b: 0, a: 255 };
const BLUE: Pixel = { r: 0, g: 0, b: 255, a: 255 };
const GREEN: Pixel = { r: 0, g: 127, b: 0, a: 255 };
const LIME: Pixel = { r: 0, g: 255, b: 0, a: 255 };
const AQUA: Pixel = { r: 0, g: 255, b: 255, a: 255 };
const ORANGE: Pixel = { r: 255, g: 165, b: 0, a: 255 };
const FUCHSIA: Pixel = { r: 255, g: 0, b: 255, a: 255 };
const PURPLE: Pixel = { r: 127, g: 0, b: 127, a: 255 };

/**
 * Each static member of the `Colors` class (e.g. `Colors.GREEN`, `Colors.RED`) is a pixel-like object with `r`, `g`, `b`, and `a` values that range from `0` to `255`.
 * @since 0.4.0
 */
export class Colors {
  /** <div style="width: 100%; height: 20px; background-color: rgb(0, 0, 0);"></div> */
  static BLACK = BLACK;
  /** <div style="width: 100%; height: 20px; background-color: rgb(255, 255, 255); border: 1px solid #eee;"></div> */
  static WHITE = WHITE;
  /** <div style="width: 100%; height: 20px; background-color: rgb(255, 0, 0);"></div> */
  static RED = RED;
  /** <div style="width: 100%; height: 20px; background-color: rgb(127, 0, 0);"></div> */
  static MAROON = MAROON;
  /** <div style="width: 100%; height: 20px; background-color: rgb(255,255, 0);"></div> */
  static YELLOW = YELLOW;
  /** <div style="width: 100%; height: 20px; background-color: rgb(0, 0, 255);"></div> */
  static BLUE = BLUE;
  /** <div style="width: 100%; height: 20px; background-color: rgb(0, 127, 0);"></div> */
  static GREEN = GREEN;
  /** <div style="width: 100%; height: 20px; background-color: rgb(0, 255, 0);"></div> */
  static LIME = LIME;
  /** <div style="width: 100%; height: 20px; background-color: rgb(0, 255, 255);"></div> */
  static AQUA = AQUA;
  /** <div style="width: 100%; height: 20px; background-color: rgb(255, 165, 0);"></div> */
  static ORANGE = ORANGE;
  /** <div style="width: 100%; height: 20px; background-color: rgb(255, 0, 255);"></div> */
  static FUCHSIA = FUCHSIA;
  /** <div style="width: 100%; height: 20px; background-color: rgb(127, 0, 127);"></div> */
  static PURPLE = PURPLE;
}

/**
 * The `Terrain` class lets {@linkcode Environment}s function as lattices upon which {@link https://en.wikipedia.org/wiki/Cellular_automaton | cellular automata} can grow. With a `Terrain`, {@linkcode Agent}s may not be necessary, since all the cells of a `Terrain` can follow update rules (similar to but simplified from `Agent`s).
 *
 * ### Usage
 *
 * ```js
 * const environment = new Environment();
 * const terrain = new Terrain(30, 30); // create a 30 x 30 Terrain
 * environment.use(terrain); // tell the Environment to 'use' this Terrain as a helper
 * ```
 *
 * @since 0.4.0
 */
class Terrain implements EnvironmentHelper {
  /** @hidden */
  data: Uint8ClampedArray;
  /** @hidden */
  nextData: Uint8ClampedArray;
  /** @hidden */
  opts: TerrainOptions;
  /**
   * The number of cells across in a `Terrain`. If you use a `scale` larger than `1`, the `Terrain` will be rendered at `width * scale` pixels wide on the screen.
   */
  width: number;
  /**
   * The number of cells from top to bottom in a `Terrain`. If you use a `scale` larger than `1`, the `Terrain` will be rendered at `height * scale` pixels high on the screen.
   */
  height: number;
  /** @hidden */
  rule: TerrainRule;

  /**
   * Instantiate a new `Terrain` by passing its `width` and `height` as the first two parameters, and an optional configuration object as the third.
   *
   * ### Options
   *
   * - `async` (*boolean* = `false`) &mdash; Whether to run the `Terrain` in synchronous (`true`) or asynchronous (`mode`). Defaults to synchronous. Depending on the timing mode, {@link addRule | Terrain update rules} should be written differently.
   * - `grayscale` (*boolean* = `false`)
   *   - In **color mode** (the default), each cell of a `Terrain` is represented by a {@link Colors | pixel-like object} (an object with numeric keys `r`, `g`, `b`, and `a` ranging from 0-255).
   *   - In **grayscale mode**, each cell of a `Terrain` is represented by a single number ranging from 0 (black) to 255 (white).
   * - `scale` (*number* = `1`) &mdash; The size, in pixels, of each cell's width and height when the `Terrain` is rendered using a {@linkcode CanvasRenderer}. In the below screenshots, the `Terrain` on the left uses a scale of `1` while the one on the right uses a scale of `5`:
   *
   * <img alt="Terrain with scale = 1" style="width: 49%;" src="https://cms.flocc.network/wp-content/uploads/2020/04/terrain-1.png">
   * <img alt="Terrain with scale = 5" style="width: 49%;" src="https://cms.flocc.network/wp-content/uploads/2020/04/terrain-5.png">
   *
   * In addition to the above setup, you will need to {@link init | initialize} the `Terrain` and {@link addRule | add an update rule}.
   */
  constructor(
    width: number,
    height: number,
    options: TerrainOptions = defaultTerrainOptions
  ) {
    this.width = width;
    this.height = height;
    this.opts = Object.assign({}, defaultTerrainOptions);
    this.opts = Object.assign(this.opts, options);
    const { scale } = this.opts;

    const size = scale ** 2 * width * height * 4;
    this.data = new Uint8ClampedArray(size);
    for (let i = 0; i < size; i += 4) {
      this.data[i] = 0;
      this.data[i + 1] = 0;
      this.data[i + 2] = 0;
      this.data[i + 3] = 255;
    }
    this.nextData = new Uint8ClampedArray(this.data);
  }

  /**
   * Initialize (or overwrite) all cell values. The rule you pass has the same signature
   * as {@linkcode addRule}, but should always return a value (either a number or {@linkcode Colors | pixel-like object}).
   *
   * ```js
   * // initializes cells randomly to either blue or red
   * terrain.init((x, y) => {
   *   return utils.uniform() > 0.5 ? Colors.BLUE : Colors.RED;
   * });
   * ```
   *
   * @since 0.4.0
   */
  init(rule: TerrainRule): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        let result = rule(x, y);
        if (!result) result = this.sample(x, y);
        if (typeof result === "number") {
          if (this.opts.grayscale) {
            this.set(x, y, result);
          } else {
            this.set(x, y, result, result, result, result);
          }
        } else {
          const { r, g, b, a } = result;
          this.set(x, y, r, g, b, a);
        }
      }
    }

    this.nextData = new Uint8ClampedArray(this.data);
  }

  /**
   * Similar to adding behavior to {@linkcode Agent}s, this adds an update rule for the `Terrain`.
   * The function passed as the rule should be called with the parameters (`x`, `y`). In synchronous mode,
   * it should return a value that is the color of that cell on the next time step.
   *
   * ```js
   * // turns a cell red if the x-value is greater than 200,
   * // blue if the x-value is less than 100,
   * // and leaves it unchanged in between
   * terrain.addRule((x, y) => {
   *   if (x > 200) {
   *     return Colors.RED;
   *   } else if (x < 100) {
   *     return Colors.BLUE;
   *   }
   * });
   * ```
   *
   * For grayscale mode, functions passed to `addRule` should return a number instead of a {@linkcode Colors | pixel-like object}.
   *
   * In asynchronous mode, functions should use the {@linkcode set} method to update either this cell
   * or a different cell.
   *
   * ```js
   * // swaps the colors of this cell and the one five cells to the right
   * terrain.addRule((x, y) => {
   *   const here = terrain.sample(x, y);
   *   const there = terrain.sample(x + 5, y);
   *   terrain.set(x, y, there);
   *   terrain.set(x + 5, y, here);
   * });
   * ```
   *
   * @since 0.4.0
   */
  addRule(rule: TerrainRule): void {
    this.rule = rule;
  }

  /**
   * Given a local path or remote URL to an image, load that image and set
   * `Terrain` data accordingly. This will scale the image to match the
   * dimensions of the terrain.
   *
   * A 2nd callback parameter fires once the image has been successfully loaded.
   *
   * ```js
   * const terrain = new Terrain(400, 400);
   * terrain.load("/path/to/local/image.jpg", function() {
   *   console.log("Image loaded successfully!");
   * });
   * ```
   *
   * @param {string} path - The path to or URL of the image
   * @param {Function} cb - The function to call once the image loads (takes no parameters)
   * @since 0.4.0
   */
  load(path: string, callback?: Function): void {
    const img = document.createElement("img");
    img.src = path;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = this.width;
      canvas.height = this.height;
      canvas.getContext("2d").drawImage(img, 0, 0, this.width, this.height);
      const { data } = canvas
        .getContext("2d")
        .getImageData(0, 0, this.width, this.height);
      this.data = data;

      if (callback) callback();
    };

    img.onerror = () => {
      console.error(
        `There was an error loading the image for the terrain. Check the path to the URL to make sure that it exists, 
  or consider saving a local copy to pull from the same origin: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS/Errors`
      );
    };
  }

  /**
   * Get the pixel value at the coordinate (x, y). If in grayscale mode, this
   * returns a single number. Otherwise, it returns a pixel-like object { r: number,
   * g: number, b: number, a: number } representing the value of that coordinate.
   * @param {number} x - The x coordinate
   * @param {number} y - The y coordinate
   * @since 0.4.0
   */
  sample(x: number, y: number): Pixel | number {
    const { data, width, height, opts } = this;
    const { grayscale, scale } = opts;

    while (x < 0) x += width;
    while (x >= width) x -= width;
    while (y < 0) y += height;
    while (y >= height) y -= height;

    x = Math.round(x);
    y = Math.round(y);

    const i = 4 * scale * (x + width * y * scale);
    if (grayscale) {
      return data[i];
    } else {
      return {
        r: data[i],
        g: data[i + 1],
        b: data[i + 2],
        a: data[i + 3]
      };
    }
  }

  /**
   * Get the values of the neighbors of a cell within a certain radius.
   * Depending on the fourth parameter, retrieves either the {@link https://en.wikipedia.org/wiki/Von_Neumann_neighborhood | von Neumann neighborhood}
   * or the {@link https://en.wikipedia.org/wiki/Moore_neighborhood | Moore neighborhood}.
   *
   * ```js
   * // in grayscale mode:
   * terrain.neighbors(5, 5, 1); // returns [127, 100, 255, 255] (4 values)
   *
   * // in color mode:
   * terrain.neighbors(5, 5, 1, true);
   * // returns [{ r: 255, g: 0, b: 0, a: 255 }, { r: 127, ... }, ...] (8 values)
   * ```
   *
   * @param moore - Defaults to using the von Neumann neighborhood.
   * @returns Either an array of numbers (grayscale mode) or {@link Colors | pixel-like objects} (color mode).
   * @since 0.4.0
   */
  neighbors(
    x: number,
    y: number,
    radius: number = 1,
    moore: boolean = false
  ): (Pixel | number)[] {
    const neighbors: Array<Pixel | number> = [];

    if (radius < 1) return neighbors;

    for (let ny = -radius; ny <= radius; ny++) {
      for (let nx = -radius; nx <= radius; nx++) {
        // always exclude self
        if (nx === 0 && ny === 0) continue;
        const manhattan = Math.abs(ny) + Math.abs(nx);
        if (moore || manhattan <= radius) {
          neighbors.push(this.sample(x + nx, y + ny));
        }
      }
    }

    return neighbors;
  }

  /** @hidden */
  _setAbstract(
    data: Uint8ClampedArray,
    x: number,
    y: number,
    r: number | Pixel,
    g?: number,
    b?: number,
    a?: number
  ): void {
    const { width, height, opts } = this;
    const { grayscale, scale } = opts;

    while (x < 0) x += width;
    while (x >= width) x -= width;
    while (y < 0) y += height;
    while (y >= height) y -= height;

    let i = 4 * scale * (x + y * width * scale);

    if (typeof r === "number") {
      for (let dy = 0; dy < scale; dy++) {
        if (dy > 0) i += 4 * scale * width;
        for (let dx = 0; dx < scale; dx++) {
          data[i + 4 * dx] = r;
          data[i + 4 * dx + 1] = grayscale ? r : g === undefined ? r : g;
          data[i + 4 * dx + 2] = grayscale ? r : b === undefined ? r : b;
          data[i + 4 * dx + 3] = grayscale ? 255 : a === undefined ? 255 : a;
        }
      }
    } else {
      for (let dy = 0; dy < scale; dy++) {
        if (dy > 0) i += 4 * scale * width;
        for (let dx = 0; dx < scale; dx++) {
          data[i + 4 * dx] = r.r;
          data[i + 4 * dx + 1] = grayscale ? r.r : r.g;
          data[i + 4 * dx + 2] = grayscale ? r.r : r.b;
          data[i + 4 * dx + 3] = grayscale ? 255 : r.a;
        }
      }
    }
  }

  /**
   * Set new pixel data at a coordinate on the terrain. Only call this directly if
   * in async mode — otherwise you should return the new value from the update rule
   * (see Terrain.addRule).
   * @param {number} x - The x coordinate
   * @param {number} y - The y coordinate
   * @param {number | Pixel} r - A number 0-255 (if in grayscale mode or setting a single value for r/g/b), or a pixel-like object
   * @param {number=} g - The green value 0-255
   * @param {number=} b - The blue value 0-255
   * @param {number=} a - The alpha/transparency value 0-255
   * @since 0.4.0
   */
  set(
    x: number,
    y: number,
    r: number | Pixel,
    g?: number,
    b?: number,
    a?: number
  ): void {
    this._setAbstract(this.data, x, y, r, g, b, a);
  }

  /** @hidden */
  _setNext(
    x: number,
    y: number,
    r: number | Pixel,
    g?: number,
    b?: number,
    a?: number
  ): void {
    this._setAbstract(this.nextData, x, y, r, g, b, a);
  }

  /** @hidden */
  _execute(x: number, y: number): void {
    const { rule, opts } = this;
    const { async } = opts;
    let result = rule(x, y);
    if (async) return;
    // in synchronous mode, set result to this pixel if there was no return value
    if (!result && result !== 0) result = this.sample(x, y);
    // update on nextData
    this._setNext(x, y, result);
  }

  /** @hidden */
  _loop({ randomizeOrder = false }: { randomizeOrder?: boolean }): void {
    const { rule, width, height, opts } = this;
    const { async } = opts;
    if (!rule) return;

    if (randomizeOrder) {
      const generator = series(width * height);
      for (let i = 0; i < width * height; i++) {
        const index: number = generator.next().value;
        const x = index % width;
        const y = (index / width) | 0;
        this._execute(x, y);
      }
    } else {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          this._execute(x, y);
        }
      }
    }

    // in synchronous mode, write the buffer to the data
    if (!async) this.data = new Uint8ClampedArray(this.nextData);
  }
}

export { Terrain };
