# Flocc

[![NPM version](https://badge.fury.io/js/flocc.svg)](http://badge.fury.io/js/flocc)

[Agent-based modeling](https://en.wikipedia.org/wiki/Agent-based_model) in JavaScript. Run it in the browser to build interactive simulations that can live on public websites, or on the server or your machine for more computationally intensive modeling.

## Usage

The recommended method is to install and import `flocc` as a module.

```js
// Using ES6 `import` syntax:
import flocc from 'flocc';

// Or ES5 `require`
const flocc = require('flocc');
```

You can also import just the classes you need:

```js
import { Agent, Environment } from 'flocc';
```

If you're running `flocc` in browser, and don't want to bother with imports and build process, you can download the top-level `flocc.js` file and include it on your page:

```html
<script src="/flocc.js"></script>

<script>
    const agent = new flocc.Agent();
</script>
```

### Documentation

[Visit the documentation site for complete documentation](https://www.flocc.network/docs/)
