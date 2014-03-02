# AdLibJS

AdLibJS is a small 6kb JavaScript framework, built around the concept of using as few methods as possible to manipulate the DOM, while basing the implementation of those methods on their arguments.

**The most current stable source is in:** *src --> adlib --> adlib(.min).js*

## How to Use
*A brief intro*

**Select an element:**<br>
By ID: `_('#foo')`<br>
By class: `_('.bar')`<br>
By name: `_('@baz')`<br>
By tag: `_('div')`<br>
With `querySelectorAll`: `_('*.center > div#foo')`<br>
Filter:
```javascript
var div = _('div');

// select the element with index 0 relative to its matched set
div.filter(0);

// select all elements with an index greater than 0 relative to the matched set
div.filter(function(el) {
	return el.get('index') > 0;
});

// filter elements by selector
div.filter( _('.sidebar') );
```

**Some getters/setters/checkers:**<br>
```javascript
var div = _('div');

// get something from the first matched element in the set
div.get('text') // ==> 'Hello World!'
div.get('html') // ==> 'Hello World!<br>'
div.get('value') // ==> works on form elements, not divs
div.get('tag') // ==> DIV
div.get('index') // ==> 0
div.get('states') // ==> returns a 'states' object (see .set())
div.get('background-color') // ==> rgb(0,0,0)
div.get('style','background-color') // ==> rgb(0,0,0)
div.get('id') // ==> #firstDiv
div.get('attr','id') // ==> #firstDiv
// note: you can use camel-case (backgroundColor) or dashed properties (background-color)
div.get('state','open') // ==> true

// set things on all elements in the matched set
div.set('text','foo\nbar') // use \n for linebreaks
div.set('html','foo<br>bar')
div.set('class','foo')
div.set('class','remove:foo') // remove a class
div.set('class','add:bar') // add a class
div.set('class','toggle:woah') // toggle a class
div.set('color','white')
div.set('background-color','orange')
div.set('id','newId')
div.set('style','font-size','20px')
div.set('attr','id','anotherNewId')
div.set('state','open',false)
div.set({
	style: {
		color: 'purple',
		fontSize: 20
	},
	attr: {
		data-foo: 'bar'
	}
})

// see if the first element in the matched set has something
div.has('children') // ==> 2
div.has('text') // ==> true
div.has( _('input') ) // ==> true
div.has('hello world!') // ==> true
div.has('hello world!<br>') // ==> true
div.has('attr','data-foo') // ==> true
div.has('html','hello world!<br>') // ==> true
div.has('text','hello world!') // ==> true
div.has('class','woah') // ==> true

// check the state of the first matched element in the set
div.is('open') // ==> true
div.is('awesome') // ==> also true
```

**Helper method, .each():**<br>
```javascript
var divColors = [];

div.each(function(element,index) {
	colors.push( element.get('color') );
	
	console.log(index) // ==> 0, 1, 2, etc.
});
```

**Attach or remove an event handler:**<br>
```javascript
div.on('click', function(e) { console.log(e.target) });
// e is passed in as window.event (for IE6-8) or as an event object in all other browsers

// delegate events for dynamic content
div.on('click', 'input', function() { console.log(true) });

// note: you can add multiple event handlers to DOM elements

div.off('click');
```

**Extend the library:**
```javascript
(function() {

	_.fn.attr = function(attribute,value) {
		if(attribute!==undefined) {
			if(value===undefined) {
				return this[0].getAttribute(attribute);
			} else if(value!==undefined) {
				this.each(function(el) {
					el.setAttribute(attribute,value);
				});

				return this;
			}
		}	
	}

})();

div.attr('class') // ==> 'foo'
```

**States explained:**<br>
The idea behind the `states` object is to be able to assign human-readable states to an object.  Say we have a panel, and we want to toggle the panel's visibility.  Instead of checking `if( panel.get('display') === none )`, we can first instead set the state of the panel based on whether it's open or closed:
```javascript
panel.set('open',true);

// then later...
if( panel.is('open') ) {
	// close the panel
}
```

## Issues
- Need support for named event handlers (i.e. `div.on('click.firstEvent', ...)`) in order to be able to detach specific handlers
- Would like to be able to link `states` and events together, potentially using the publish/subscribe pattern
- Might want to add a .siblings() method to retrieve a DOM element's sibling
- Does not support any sort of animation methods
<hr>

License under <a href="http://opensource.org/licenses/MIT">The MIT License</a> - &copy; 2014, Joshua Beam