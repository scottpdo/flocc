---
title: Canvas Renderer
---

The `flocc.CanvasRenderer` class (from here on, just `CanvasRenderer`) renders a `Environment` with spatial agents into an HTML `<canvas>` element on a web page. After mounting, it automatically updates the view every time its environment ticks.

## Instantiating

A `CanvasRenderer` requires a `Environment` to render:

```js
const environment = new Environment();
const renderer = new CanvasRenderer(environment);
```

## Options

A `CanvasRenderer` can also be instantiated with configuration options, which affect the output.

```js
const opts = {
    height: 200,
    width: 200,
    trace: true
};
new CanvasRenderer(environment, opts);
```

### width / height

The width and height (in pixels) of the canvas.

### trace

If `trace` is set to `true`, the `CanvasRenderer` won't clear the canvas with every tick of the simulation. Instead, you will see agent paths "tracing" over time, which can be useful for visualizing movement over time.

## Methods

### .mount(_selector_ or _element_)

Calling `.mount` specifies where on the page the renderer should render the environment. If passed a CSS selector (like `#id` or `.class`), the renderer will look for the first matching element on the page, and use that as a container. If passed an element directly, the renderer will use that element as a container.

```html
<div id="some-element"></div>
```

```js
renderer.mount('#some-element');
// or...
const element = document.getElementById('some-element');
renderer.mount(element);
```

### .render()

Renders a view of the renderer's `Environment` into the HTML element that was mounted previously.

The renderer draws a black circle for each `Agent` in the `Environment` at the ordered pair (`agent.get('x')`, `agent.get('y')`). The radius of the circle defaults to 1, but can be set with `agent.set('radius', 5)` (for example).

Each time the renderer's `Environment` `tick`s, this method is automatically called, but you still might want to call it manually (for example, if making manual changes to agents).