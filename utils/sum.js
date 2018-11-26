/**
 * Sum the values of an array.
 * @param {Array[Number]} arr 
 */
function sum(arr) {
  return arr.reduce((a, b) => a + b, 0);
}

export default sum;