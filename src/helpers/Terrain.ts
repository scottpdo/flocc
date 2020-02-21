interface TerrainOptions {
  grayscale: boolean;
}

const defaultTerrainOptions: TerrainOptions = {
  grayscale: false
};

interface Pixel {
  r: number;
  g: number;
  b: number;
  a: number;
}

class Terrain implements EnvironmentHelper {
  data: Uint8ClampedArray;
  nextData: Uint8ClampedArray;
  opts: TerrainOptions;
  width: number;
  height: number;
  rule: (x: number, y: number) => Pixel;

  constructor(
    width: number,
    height: number,
    options: TerrainOptions = defaultTerrainOptions
  ) {
    this.width = width;
    this.height = height;
    this.opts = Object.assign({}, defaultTerrainOptions);
    this.opts = Object.assign(this.opts, options);

    const { grayscale } = this.opts;
    const size = width * height * (grayscale ? 1 : 4);
    this.data = new Uint8ClampedArray(size);
    for (let i = 0; i < size; i += grayscale ? 1 : 4) {
      if (grayscale) {
        this.data[i] = 0;
      } else {
        this.data[i] = 0;
        this.data[i + 1] = 0;
        this.data[i + 2] = 0;
        this.data[i + 3] = 255;
      }
    }
    this.nextData = new Uint8ClampedArray(this.data);
  }

  sample(x: number, y: number): Pixel | number {
    const { data, width, height } = this;
    const grayscale = this.opts.grayscale;

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

  set(x: number, y: number, r: number, g: number, b: number, a: number): void {
    const { data, width, height, opts } = this;
    const grayscale = { opts };

    while (x < 0) x += width;
    while (x >= width) x -= width;
    while (y < 0) y += height;
    while (y >= height) y -= height;

    const i = 4 * (x + width * y);

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = a;
  }

  setNext(
    x: number,
    y: number,
    r: number,
    g: number,
    b: number,
    a: number
  ): void {
    const { nextData, width, height, opts } = this;
    const grayscale = { opts };

    while (x < 0) x += width;
    while (x >= width) x -= width;
    while (y < 0) y += height;
    while (y >= height) y -= height;

    const i = 4 * (x + width * y);

    nextData[i] = r;
    nextData[i + 1] = g;
    nextData[i + 2] = b;
    nextData[i + 3] = a;
  }

  loop(): void {
    if (!this.rule) return;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const { r, g, b, a } = this.rule(x, y);
        this.setNext(x, y, r, g, b, a);
      }
    }
    this.data = new Uint8ClampedArray(this.nextData);
  }
}

export { Terrain };
