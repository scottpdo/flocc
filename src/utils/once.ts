/**
 * Lodash's implementation:
 * Creates a function that invokes `func`, with the `this` binding and arguments
 * of the created function, while it's called less than `n` times. Subsequent
 * calls to the created function return the result of the last `func` invocation.
 *
 * @param {number} n The number of calls at which `func` is no longer invoked.
 * @param {Function} func The function to restrict.
 * @returns {Function} Returns the new restricted function.
 */
function before(n: number, func: Function): Function {
  let result: any;

  if (typeof func !== "function") {
    throw new TypeError("Expected a function");
  }

  return function (...args: any[]) {
    if (--n > 0) {
      result = func.apply(this, args);
    }
    if (n <= 1) {
      func = undefined;
    }
    return result;
  };
}

/**
 * Lodash's implementation:
 * Creates a function that is restricted to invoking `func` once. Repeat calls
 * to the function return the value of the first invocation. The `func` is
 * invoked with the `this` binding and arguments of the created function.
 *
 * @since 0.5.18
 * @category Function
 * @param {Function} func The function to restrict.
 * @returns {Function} Returns the new restricted function.
 */
export default function once(func: Function): Function {
  return before(2, func);
}
