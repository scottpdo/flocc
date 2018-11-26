import mean from './mean';

function stdDev(arr) {
  const ave = mean(arr);
  return Math.sqrt(mean(arr.map(x => (x - ave) * (x - ave))));
};

export default stdDev;