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

class Terrain implements EnvironmentHelper {
  data: Uint8ClampedArray;
  nextData: Uint8ClampedArray;
  opts: TerrainOptions;
  width: number;
  height: number;
  rule: TerrainRule;

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

  load(path: string, cb?: Function): void {
    const img = document.createElement("img");
    img.src = path;
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
    img.onerror = function() {
      console.log("there was an error");
    };
  }

  sample(x: number, y: number): Pixel | number {
    const { data, width, height, opts } = this;
    const { grayscale } = opts;

    while (x < 0) x += width;
    while (x >= width) x -= width;
    while (y < 0) y += height;
    while (y >= height) y -= height;

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
      data[i + 1] = grayscale ? r : g;
      data[i + 2] = grayscale ? r : b;
      data[i + 3] = grayscale ? 255 : a;
    } else {
      data[i] = r.r;
      data[i + 1] = grayscale ? r.r : r.g;
      data[i + 2] = grayscale ? r.r : r.b;
      data[i + 3] = grayscale ? 255 : r.a;
    }
  }

  setNext(
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
      nextData[i + 1] = grayscale ? r : g;
      nextData[i + 2] = grayscale ? r : b;
      nextData[i + 3] = grayscale ? 255 : a;
    } else {
      nextData[i] = r.r;
      nextData[i + 1] = grayscale ? r.r : r.g;
      nextData[i + 2] = grayscale ? r.r : r.b;
      nextData[i + 3] = grayscale ? 255 : r.a;
    }
  }

  loop(): void {
    const { rule, width, height, opts } = this;
    const { async, grayscale } = opts;
    if (!rule) return;
    const update = (async ? this.set : this.setNext).bind(this);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Get result of rule. If doesn't in synchronous mode
        // and the rule doesn't return anything, set result to the value of this pixel
        let result = rule(x, y);
        if (async) continue;

        if (result === undefined) result = this.sample(x, y);
        update(x, y, result);
      }
    }
    if (!async) this.data = new Uint8ClampedArray(this.nextData);
  }
}

export { Terrain };
