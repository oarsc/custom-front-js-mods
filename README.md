# Custom node front end modifications

These are some low-level JavaScript snippets that I use in some of my personal projects in order to:
* Help minifier to obfuscate code
* Reduce code duplication
* Transforms "NodeList" and "HTMLCollection" to Array, so you can use map easily
* Enhance default javascript behavior adding some features like:
  * Add listeners to DOMTokenList modifications
  * New functions to arrays: peek, unique and clear
  * Functions that helps navigating through DOM, or modifying elements: nextSiblings/previousSiblings, closest, clear, remove
  * Default Ajax function using fetch


## Using DOMTokenList listeners

* onChange example:
```js
import { createElement, addClass } from './dom-utils';

const div = createElement('div', 'default-class', document.body);
div.classList.onChange('watching', added => {
	if (added) {
		console.log('"watching" class has been added');
	} else {
		console.log('"watching" class has been removed');
	}
});

addClass(div, 'watching');        // -> prints: "watching" class has been added
addClass(div, 'test');            // -> won't print anything because "test" class is not being observed
div.classList.remove('watching'); // -> prints: "watching" class has been removed

```


* onAnyChange example:
```js
import { createElement, addClass } from './dom-utils';

const div = createElement('div', 'default-class', document.body);
div.classList.onAnyChange((cls, added) => {
	if (added) {
		console.log(`"${cls}" class has been added`);
	} else {
		console.log(`"${cls}" class has been removed`);
	}
});

addClass(div, 'watching');         // -> prints: "watching" class has been added
div.classList.add('test');         // -> prints: "test" class has been added
div.classList.remove('watching');  // -> prints: "watching" class has been removed
div.classList.remove('watching');  // -> won't print anything because "watching" didn't exist in the first place

```