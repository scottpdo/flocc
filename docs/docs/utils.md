---
title: Utility Functions
---

The `flocc.utils` object contains a number of helpful utility functions.

### utils.clamp(_x_, _min_, _max_)

Given a number `x`, clamps it to the range `min` &rarr; `max`.

```js
utils.clamp(10, 5, 15);     // returns 10
utils.clamp(10, 50, 100);   // returns 50
utils.clamp(10, 1, 3);      // returns 3
```

### utils.distance(_pt1_, _pt2_)

Returns the distance between `pt1` and `pt2`. If the points are agent-like, then the function looks for `.get('x')`, `.get('y')`, and `.get('z')` on each. These values default to 0, so the correct distance is returned even if the agents only have a value at `.get('x')`.

If the points are not agent-like, then the function looks for x, y, and z values on the point objects themselves.

```js
const agent = new Agent();
agent.set('x', 100);
agent.set('y', 100);

const point = {
    x: 50,
    y: 50
};

utils.distance(agent, point); // returns 70.71
```

### utils.gaussian(_mean_, _std_)

Return a sampled value from a [Gaussian/normal distribution](https://en.wikipedia.org/wiki/Normal_distribution) with `mean` and standard deviation `std`. Theoretically, this function might return _any_ value, but most likely it will return a value within _std_ of _mean_. This is useful for instantiating agents with diverse but statistically probable values.

```js
utils.gaussian(100, 50);
// most likely to return a value between 50 and 150,
// but might return any value (though less and less likely
// farther from 100)
```

### utils.remap(_x_, _sourceMin_, _sourceMax_, _targetMin_, _targetMax_)

Maps the number `x` from the source range _sourceMin_ &rarr; _sourceMax_ onto the target range _targetMin_ &rarr; _targetMax_.

```js
utils.remap(70, 0, 100, 30, 50); // returns 44
utils.remap(0.62, 0, 1, 0, 100); // returns 62
```

### utils.sample(arr)

Get a random value from the array `arr`.

### utils.shuffle(arr)

Get a shuffled/randomized version of the array `arr`. This does not change the ordering of `arr` itself, but creates and returns a copy.

```js
const arr = [1, 2, 3, 4, 5];
const shuffled = utils.shuffle(arr);
// might be [5, 1, 3, 2, 4]
```