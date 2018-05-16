---
title: Documentation
---

`flocc` follows a JavaScript (ES2015+) object-oriented approach to agent-based modeling. The main `flocc` object itself isn't used, but instead provides classes which can be initialized and used in your code. A simple model might consist of a single `flocc.Environment` containing a small number of `flocc.Agent`s.

Using ES6 syntax, you can import just the classes you need:

```js
import { Agent, Environment } from 'flocc';

const agent = new Agent();
const environment = new Environment();
```

## Classes

- [flocc.Agent]({{ site.baseurl }}/docs/agent)
- [flocc.Environment]({{ site.baseurl }}/docs/environment)
- [flocc.GridEnvironment]({{ site.baseurl }}/docs/gridenvironment)

## Utility Functions

- [flocc.utils]({{ site.baseurl }}/docs/utils)