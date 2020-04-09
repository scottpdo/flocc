interface TerrainOptions {
  async: boolean;
  grayscale: boolean;
}

const defaultTerrainOptions: TerrainOptions = {
  async: false,
  grayscale: false
};

interface Pixel {
  r: number;
  g: number;
  b: number;
  a: number;
}

type TerrainRule = (x: number, y: number) => Pixel | number;

export const Colors: { [name: string]: Pixel } = {
  BLACK: { r: 0, g: 0, b: 0, a: 255 },
  WHITE: { r: 255, g: 255, b: 255, a: 255 },
  RED: { r: 255, g: 0, b: 0, a: 255 },
  MAROON: { r: 127, g: 0, b: 0, a: 255 },
  YELLOW: { r: 255, g: 255, b: 0, a: 255 },
  BLUE: { r: 0, g: 0, b: 255, a: 255 },
  GREEN: { r: 0, g: 127, b: 0, a: 255 },
  LIME: { r: 0, g: 255, b: 0, a: 255 },
  AQUA: { r: 0, g: 255, b: 255, a: 255 },
  ORANGE: { r: 255, g: 165, b: 0, a: 255 },
  FUCHSIA: { r: 255, g: 0, b: 255, a: 255 },
  PURPLE: { r: 127, g: 0, b: 127, a: 255 }
};

class Terrain implements EnvironmentHelper {
  data: Uint8ClampedArray;
  nextData: Uint8ClampedArray;
  opts: TerrainOptions;
  width: number;
  height: number;
  rule: TerrainRule;

  /**
   *
   * @param {number} width - The width of the terrain
   * @param {number} height - The height of the terrain
   * @param options
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

    const size = width * height * 4;
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
   * Initialize (or overwrite) the terrain data by passing a function with parameters (x, y)
   * and returning a pixel value.
   * @param {Function} rule - The rule to follow to instantiate pixel values
   */
  init(rule: TerrainRule): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        let result = rule(x, y);
        if (result === undefined) result = this.sample(x, y);
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
  }

  /**
   * Like with agents, this adds an update rule for the terrain. The function
   * passed as the rule should be called with the parameters (x, y), and should return
   * a pixel-like object { r: number, g: number, b: number, a: number } or number.
   * @param {Function} rule - The update rule to be called on environment.tick()
   */
  addRule(rule: TerrainRule): void {
    this.rule = rule;
  }

  /**
   * Given a local path or remote URL to an image, load that image and set
   * terrain pixel data accordingly. This will scale the image to match the
   * dimensionss of the terrain.
   * A 2nd callback parameter fires once the image has been successfully loaded.
   * @param {string} path - The path or URL to the image
   * @param {Function} cb - The function to call once the image loads
   */
  load(path: string, cb?: Function): void {
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

      if (cb) cb();
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
   */
  sample(x: number, y: number): Pixel | number {
    const { data, width, height, opts } = this;
    const { grayscale } = opts;

    while (x < 0) x += width;
    while (x >= width) x -= width;
    while (y < 0) y += height;
    while (y >= height) y -= height;

    x = Math.round(x);
    y = Math.round(y);

    const i = 4 * (x + width * y);
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
   * Get the neighbors of a coordinate within a certain radius.
   * Depending on the fourth parameter, retrieves either the von Neumann neighborhood
   * (https://en.wikipedia.org/wiki/Von_Neumann_neighborhood) or the Moore neighborhood
   * (https://en.wikipedia.org/wiki/Moore_neighborhood).
   *
   * @param {Agent} agent - the agent whose neighbors to retrieve
   * @param {number} radius - how far to look for neighbors
   * @param {boolean} moore - whether to use the Moore neighborhood or von Neumann (defaults to von Neumann)
   * @returns {Pixel[] | number[]} - An array of numbers (grayscale only) or pixel-like objects
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
   */
  set(
    x: number,
    y: number,
    r: number | Pixel,
    g?: number,
    b?: number,
    a?: number
  ): void {
    const { data, width, height, opts } = this;
    const { grayscale } = opts;

    while (x < 0) x += width;
    while (x >= width) x -= width;
    while (y < 0) y += height;
    while (y >= height) y -= height;

    const i = 4 * (x + width * y);

    if (typeof r === "number") {
      data[i] = r;
      data[i + 1] = grayscale ? r : g === undefined ? r : g;
      data[i + 2] = grayscale ? r : b === undefined ? r : b;
      data[i + 3] = grayscale ? 255 : a === undefined ? 255 : a;
    } else {
      data[i] = r.r;
      data[i + 1] = grayscale ? r.r : r.g;
      data[i + 2] = grayscale ? r.r : r.b;
      data[i + 3] = grayscale ? 255 : r.a;
    }
  }

  _setNext(
    x: number,
    y: number,
    r: number | Pixel,
    g?: number,
    b?: number,
    a?: number
  ): void {
    const { nextData, width, height, opts } = this;
    const { grayscale } = opts;

    while (x < 0) x += width;
    while (x >= width) x -= width;
    while (y < 0) y += height;
    while (y >= height) y -= height;

    const i = 4 * (x + width * y);

    if (typeof r === "number") {
      nextData[i] = r;
      nextData[i + 1] = grayscale ? r : g === undefined ? r : g;
      nextData[i + 2] = grayscale ? r : b === undefined ? r : b;
      nextData[i + 3] = grayscale ? 255 : a === undefined ? 255 : a;
    } else {
      nextData[i] = r.r;
      nextData[i + 1] = grayscale ? r.r : r.g;
      nextData[i + 2] = grayscale ? r.r : r.b;
      nextData[i + 3] = grayscale ? 255 : r.a;
    }
  }

  _loop(): void {
    const { rule, width, height, opts } = this;
    const { async } = opts;
    if (!rule) return;
    const update = (async ? this.set : this._setNext).bind(this);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Get result of rule.
        let result = rule(x, y);
        // If in async mode, then the rule should have made any necessary
        // changes already
        if (async) continue;

        // in synchronous mode, set result to this pixel if there was no return value
        if (result === undefined) result = this.sample(x, y);
        // update on nextData
        update(x, y, result);
      }
    }

    // in synchronous mode, write the buffer to the data
    if (!async) this.data = new Uint8ClampedArray(this.nextData);
  }
}

export { Terrain };
