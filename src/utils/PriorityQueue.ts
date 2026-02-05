/**
 * A min-heap based priority queue.
 * Elements with lower priority values are dequeued first.
 * @since 0.6.0
 */
class PriorityQueue<T> {
  private heap: T[] = [];
  private compareFn: (a: T, b: T) => number;

  /**
   * Create a new PriorityQueue.
   * @param compareFn - Comparison function. Should return negative if a < b,
   *                    positive if a > b, zero if equal. Defaults to numeric comparison.
   */
  constructor(compareFn: (a: T, b: T) => number = (a: any, b: any) => a - b) {
    this.compareFn = compareFn;
  }

  /**
   * Number of elements in the queue.
   */
  get size(): number {
    return this.heap.length;
  }

  /**
   * Whether the queue is empty.
   */
  get isEmpty(): boolean {
    return this.heap.length === 0;
  }

  /**
   * Insert an element into the queue.
   */
  insert(item: T): void {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  /**
   * View the highest-priority element without removing it.
   * Returns undefined if the queue is empty.
   */
  peek(): T | undefined {
    return this.heap[0];
  }

  /**
   * Remove and return the highest-priority element.
   * Returns undefined if the queue is empty.
   */
  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    if (this.heap.length === 1) return this.heap.pop();

    const result = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.bubbleDown(0);
    return result;
  }

  /**
   * Remove a specific item from the queue.
   * Returns true if the item was found and removed.
   */
  remove(item: T): boolean {
    const index = this.heap.indexOf(item);
    if (index === -1) return false;

    if (index === this.heap.length - 1) {
      this.heap.pop();
      return true;
    }

    this.heap[index] = this.heap.pop()!;
    // May need to bubble up or down depending on new value
    this.bubbleUp(index);
    this.bubbleDown(index);
    return true;
  }

  /**
   * Remove all elements matching a predicate.
   * Returns the number of elements removed.
   */
  removeWhere(predicate: (item: T) => boolean): number {
    const originalLength = this.heap.length;
    this.heap = this.heap.filter(item => !predicate(item));
    // Rebuild heap if we removed anything
    if (this.heap.length !== originalLength) {
      this.heapify();
    }
    return originalLength - this.heap.length;
  }

  /**
   * Remove all elements from the queue.
   */
  clear(): void {
    this.heap = [];
  }

  /**
   * Convert to array (does not modify queue). Order is not guaranteed.
   */
  toArray(): T[] {
    return [...this.heap];
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.compareFn(this.heap[index], this.heap[parentIndex]) >= 0) break;
      this.swap(index, parentIndex);
      index = parentIndex;
    }
  }

  private bubbleDown(index: number): void {
    const length = this.heap.length;
    while (true) {
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      let smallest = index;

      if (leftChild < length && this.compareFn(this.heap[leftChild], this.heap[smallest]) < 0) {
        smallest = leftChild;
      }
      if (rightChild < length && this.compareFn(this.heap[rightChild], this.heap[smallest]) < 0) {
        smallest = rightChild;
      }

      if (smallest === index) break;
      this.swap(index, smallest);
      index = smallest;
    }
  }

  private swap(i: number, j: number): void {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  private heapify(): void {
    for (let i = Math.floor(this.heap.length / 2) - 1; i >= 0; i--) {
      this.bubbleDown(i);
    }
  }
}

export { PriorityQueue };
