/**
 * @since 0.3.11
 */
class NumArray {
  data: Float32Array = new Float32Array(1);
  _index: number = 0;

  get length() {
    return this._index;
  }

  set(i: number, n: number): void {
    if (i < 0) throw new Error("Can't set negative index of array!");
    while (i >= this.data.length) this.resize();
    this.data[i] = n;
    if (i > this._index) this._index = i + 1;
  }

  get(i: number): number | null {
    if (i >= this._index || i < 0) return null;
    return this.data[i];
  }

  push(n: number) {
    if (this._index >= this.data.length) this.resize();
    this.data[++this._index] = n;
  }

  resize() {
    const { data } = this;
    const newArr = new Float32Array(2 * data.length);
    for (let i = 0; i < data.length; i++) {
      newArr[i] = data[i];
    }
    this.data = newArr;
  }
}

export { NumArray };
