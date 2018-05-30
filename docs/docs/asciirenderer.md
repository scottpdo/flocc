---
title: ASCII Renderer
---

The `flocc.ASCIIRenderer` class (from here on, just `ASCIIRenderer`) renders a `GridEnvironment` on a web page. After mounting, it automatically updates the view every time its environment ticks.

## Instantiating

An `ASCIIRenderer` requires a `GridEnvironment` to render:

```js
const environment = new GridEnvironment(2, 2);
const renderer = new ASCIIRenderer(environment);
```

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

Renders a view of the renderer's `GridEnvironment` into the HTML element that was mounted previously.

The renderer draws the result of `agent.get('value')` for each `Agent` in the `GridEnvironment`, so **make sure that you have called `agent.set('value', 'x')` (or `0`, `1`, etc.) for each agent!**

Each time the renderer's `GridEnvironment` `tick`s, this method is automatically called, but you still might want to call it manually (for example, if making manual changes to agents).

```js
const agent1 = environment.addAgent(0, 0);
const agent2 = environment.addAgent(1, 2);
const agent3 = environment.addAgent(2, 1);

agent1.set('value', 'a');
agent2.set('value', 'b');
agent3.set('value', 'c');

renderer.render();
```

Will render:

```
a
  c 
 b
```

