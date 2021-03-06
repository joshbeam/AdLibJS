/*

petit
An argument-based JavaScript framework

version 0.1.3
New in this version:
- Selector engine updated for correct IE8 'getElementsByClassName' polyfill (previous version was non-functional)
- .has() method updated - now correctly returns a numerical value when a Petit object is passed in as the sole argument

The MIT License - (c) 2014, Joshua Beam

joshua.a.beam@gmail.com
	
*/

//TODO: need .siblings()
//TODO: throw TypeErrors?
//TODO: add animation methods? or as add-ons?
//TODO: add event delegation to event methods
//TODO: look into using GRUNT for automation
//TODO: add parameter documentation throughout source
//TODO: use observer pattern to link methods, setters, and states
//TODO: switch args to arguments; variable creation might cost more
//TODO: add _.each or _.forEach method
//TODO: add support to detach event handlers in event delegation

;(function(win,doc,emptyArray) {
	
//	Array.prototype.indexOf polyfill for IE<9
//	https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf#Polyfill
	if (!('indexOf' in Array.prototype)) {
		Array.prototype.indexOf = function (searchElement, fromIndex) {
			if ( this === undefined || this === null ) {
				throw new TypeError( '"this" is null or not defined' );
			}

			var length = this.length >>> 0; // Hack to convert object.length to a UInt32

			fromIndex = +fromIndex || 0;

			if (Math.abs(fromIndex) === Infinity) {
				fromIndex = 0;
			}

			if (fromIndex < 0) {
				fromIndex += length;
				if (fromIndex < 0) {
					fromIndex = 0;
				}
			}

			for (;fromIndex < length; fromIndex++) {
				if (this[fromIndex] === searchElement) {
					return fromIndex;
				}
			}

			return -1;
		};
	}
	
	// Shim for hasAttribute (untested)
	
	if (!('hasAttribute' in Element.prototype)) {
		// No Element.prototype in IE<8, so theoretically setting this method
		// on Element would work
		Element.hasAttribute = function(attr) {
			return this[attr] !== null;
		}
	}
	
//	Selector engine
//	https://github.com/joshbeam/Zelektor
	var Zelekt = (function(){function e(e,t){t.parentElement.insertBefore(e,t)}function t(e,t){t.parentNode.insertBefore(e,t.nextSibling)}function n(e,t){t.appendChild(e)}function r(e,t){t.insertBefore(e,t.firstChild)}function i(e){var t=document.createElement("div"),n;t.innerHTML=e;n=t.firstChild;return n}function s(e){var t=[],n=0,r=e.length;for(;n<r;n++){t.push(e[n])}return t}if(!("getElementsByClassName"in document)){document.getElementsByClassName=function(e){if("querySelectorAll"in this){return this.querySelectorAll("."+e)}}}if(!("getElementsByClassName"in Element.prototype)){Element.prototype.getElementsByClassName=document.getElementsByClassName}return function(){var o=arguments,u=o.length,a=o[0],f,l,c,h,p,d;if(u<3){if(typeof a==="string"){l=o[1]?o[1][0]:document;f={"#":"getElementById",".":"getElementsByClassName","@":"getElementsByName","*":"querySelectorAll"}[a[0]]||"getElementsByTagName";a=f.indexOf("Tag")>-1?a:a.slice(1);d=l[f](a);d=d.nodeType===1?[d]:s(d)}else if(a.nodeType===1){d=[a]}else if(a instanceof Array){d=a}}else if(u===3){c=o[1];h=o[2][0];p=i(a);switch(c){case"appendTo":n(p,h);break;case"prependTo":r(p,h);break;case"before":e(p,h);break;case"after":t(p,h);break}d=[p]}return d}})(),
	
	styles = doc.documentElement.style,
		
	styleAliases = {
		'float': 'cssFloat' in styles ? 'cssFloat' : 'styleFloat'
//		opacity ?
	};
	

/*

	Various 'helper' functions that are used throughout Petit.prototype
	
*/
	
	
	function camelize(p) {
//		-moz-appearance => MozAppearance
//		background-color => backgroundColor
		return p.replace(/-(\w)/g,function(m,c) { return c.toUpperCase() });

	}
	
//	shortcut for i=0, i<len, etc.
//	look at: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach#Polyfill
	function forEach(array,callback) {
		var i = 0, len = array.length;

		for(;i<len;i++) {
			callback.call(array[i], array[i], i);
		}
	}
	
//	similar to Array.prototype.filter
	function filter(array, callback) {
		var result = [];
		
//		if(!array) return result;
		
		forEach(array,function(item) {
			
			if(callback.call(item, item)) result.push(item);
			
		});
		
		return result;
		
	}
		
//	similar to String.prototype.trim
	function trim(string) {
		return string.replace(/^\s+|\s+$/g, '');
	}
	
//	check if an element has a specific class
	function hasClass(element,klass) {
		var classList = element.className.split(' ');

		return classList.indexOf(klass) > -1;
	}
	
//	add a class to an element
	function addClass(element,klass) {
		var classList = element.className.split(' ');

		classList.push(klass);

		element.className = trim(classList.join(' '));
	}
	
	
//	remove a class from an element
	function removeClass(element,klass) {
		
		element.className = filter(element.className.split(' '), function(item) {
			return item !== klass;
		}).join(' ');
		
	}

//	used in Petit.prototype.set()
	function setClass(el,newClass) {
		var method = /(add|remove|toggle):([\w\d-_]+)/,
			classes,
			classList,
			prefix;

		if(method.test(newClass)) {
//			add, remove, or toggle
			prefix = RegExp.$1;
			classes = (RegExp.$2).split(' ');

			switch(prefix) {
				case 'add':
					forEach(classes, function(klass) {
						addClass(el,klass);
					});
					break;
				case 'remove':
					forEach(classes,function(klass) {
						removeClass(el,klass);
					});
					break;
				case 'toggle':
					classList = el.className.split(' ');

					forEach(classes,function(klass) {
						if( classList.indexOf(klass) > -1 ) {
							removeClass(el,klass);
						} else {
							addClass(el,klass);
						}
					});		
					break;
			}
		} else {

			el.className = newClass;

		}

	}
	
//	return computed style
	function getStyle(object,prop) {
		var prop = camelize(prop);

//		returns the property, or 'undefined'
		if('getComputedStyle' in win) {
			return win.getComputedStyle(object)[styleAliases[prop]||prop];	
		} else if ('currentStyle' in object) {
			return object.currentStyle[styleAliases[prop]||prop];	
		}
		
//		return (win.getComputedStyle(object)||object.currentStyle)[styleAliases[prop]||prop]
	}
	
//	set a style for an element
	function setStyle(object,prop,val) {
		var prop = camelize(prop);

		if((prop in styles) || (prop in styleAliases)) {
			object.style[prop] = val;
			
			return true;
		}
		
		return false;
	}
	
//	get the text of an element
	function getText(object) {
		if('textContent' in object) {
			return object.textContent;
		} else if ('innerText' in object) {
			return object.innerText;	
		}
//		return object['textContent'||'innerText'];
	}

//	set the text of an element
	function setText(object,text) {
//		Use: _('element').set('text','hello world') => Text: 'hello world'
//			_('element').set('text'),'hello\n\nworld') => HTML: 'hello<br><br>world'
		var text = text.split('\n');
		
		/***
			POSSIBLY BUGGY
		***/
		object['textContent'||'innerText']='';

		forEach(text,function(item, i) {				
			var textNode = doc.createTextNode(item),
				lineBreak = doc.createElement('br');

			if(i !== text.length-1) {
				object.appendChild(textNode.cloneNode());
				object.appendChild(lineBreak.cloneNode());
			} else {
				object.appendChild(textNode.cloneNode());
			}
		});
	}

//	get the number of child elements of an element
	function countChildElements(object) {

		return object.getElementsByTagName('*').length;

	}
	
//	get the number of text nodes of an element
	function countTextNodes(object) {
		if(object.hasChildNodes) {
			var children = object.childNodes,
				num = 0;

			forEach(children,function(item) {
				if( item.nodeType===3 ) num+=1;
			});

			return num;
		}

		return 0;
	}
	
//	turn an array-like object into an array
	function makeArray(object) {
//		Using this instead of [].slice because IE<9 does not support
//		using [].slice for nodeList objects.
		var result = [];
		
		forEach(object,function(o) {
			result.push(o);
		});
		
		return result;
	}
	
	function handleEvent(how, object, type, handler) {

		// doc[how+'EventListener']||doc[how = how === 'add' ? 'attach' : 'detach' + 'Event']
		
		if(/*doc[how+'EventListener']*/ how+'EventListener' in doc) {
			
			object[how+'EventListener'](type, handler, false);
			
		} else if ('attachEvent' in object || 'detachEvent' in object) {
			
			var how = how === 'add' ? 'attach' : 'detach';
			
			object[how+'Event']('on'+type, handler);
			
		}
		
	}
	
//	Retrieves all children
	
	function children(object) {
		var childNode,
			children = [];
		
		forEach(object, function(el) {
			childNode = makeArray(el.getElementsByTagName('*'));

			forEach(childNode, function(node) {
				if( node.nodeType == 1 && node.tagName !== 'SCRIPT' ) children.push(node);
			});
		});
		
		return children;
	}

/*

	Various functions to check types

*/
	
	function hasHTMLChars(string) {
		return /[\<\>]+/.test(string);
	}
	
	function isPlainObject(object) {
		return !(object != null && object == object.win) && Object.getPrototypeOf(object) == Object.prototype;
	}
	
/*

	The selector/initialization function, which gets the element and returns an Petit instance
	
*/
	
	function _() {
		var len = arguments.length,
			selector = arguments[0],
			element;

		if(len<3) {
//			Even if args[1] (context) is undefined, we can still pass it in (it just won't be used)
			element = Zelekt(selector,arguments[1]);
		} else if (len===3) {
			
			/*
				We're passing in --
					selector = HTMLString
					args[1] = appendTo|prependTo|before|after
					args[2] = location (DOMElement)
			*/
			
			element = Zelekt(selector,arguments[1],arguments[2]);	
		}
		
		/*	
			We're passing in --
				element = array of 1 or more DOMElements
				selector = original selector text passed into _() (Petit will use it as a property)
		*/
		
		return new Petit(element,selector);
	}

/*
	The following constructor takes the element that the initialization function passed into it,
	and then assigns each DOM element some properties, like 'selector', 'events', and 'states'
	which can all be used later by the different Petit methods.
*/
	
	function Petit(element,selector) {
		var that = this,
			classes;
				
		forEach(element,function(item,index) {
			if(/^<.+>$/.test(selector)) {
				classes = item.className.split(' ');

				selector = '.'+classes[0];
			}
						
			item.selector = item.selector || selector;
			item.states = item.states || {};
			
//			push each DOM element into the Petit instance (which is an array-like object)
			that.push(item);
		});

	};
	

/*

	The prototype

*/
	_.fn = Petit.prototype = {
		
//		Turn the Petit object into an array-like object
		length: 0,
		push: emptyArray.push,
		splice: emptyArray.splice,
		
		children: function() {
			var len = arguments.length, 
				thisChildren,
				result,
				testObject;
			
			if(len === 0) {

				return _( children(this) );
				
			} else if (len === 1) {
				result = [];
				testObject = _(arguments[0]);
				thisChildren = children(this);

				forEach(testObject, function(petit) {

					forEach(thisChildren, function(child) {
						if(petit === child) result.push(petit);
					});

				});

				return _(result);
			}
		},

		/*
			.filter(index)
			.filter(Petit instance)
			.filter(callback)
			
			Filters elements of an Petit instance by returning a new Petit instance.
			
			Only one argument can be passed in.
			
			If the argument is a number:
				
				e.g. _('div').filter(1)
				
				It will return a new Petit object of the element with the index corresponding
				to the argument, in relation the instance's original matched set.
				
			If the argument is an Petit instance:
			
				e.g. _('div').filter( _('.center') )
				
				It will return a new Petit object of elements that match the passed in argument object.
				
			If the argument is a function:
				
				e.g. _('div').filter( function(el) { return el.get('index') > 0 } )
				
				It will return a new Petit object with elements that are equal to the
				return value of the passed in function.
		*/
		
		filter: function() {
			var result = [],
				index,
				object,
				callback;
			
			if( typeof(arguments[0]) === 'number' ) {
				
				index = arguments[0];
				
				return _(this[index]);
				
			}
				
			if( typeof(arguments[0]) === 'function' ) {
				callback = arguments[0];
				
				forEach(this,function(el) {

					if( callback.call(el, _(el)) ) result.push(el);

				});		

			} else if ( arguments[0] instanceof Petit ) {
				object = arguments[0];
				
				forEach(this,function(el) {

					forEach(object,function(o) {
						if( el === o ) result.push(el);
					});
					
				});
				
			}
			
			return _(result);
		},
		
		/*
			.get(property)
			.get(type, property)
			
			Returns a value from the first element in the matched set.
			
			Only one or two arguments can be passed in.
		
			If one argument is passed:
			
				e.g. _('div').get('color')
			
				'text' ==> gets the text
				'tag' ==> gets the tag
				'html' ==> gets innerHTML
				'value' ==> gets value for form elements
				'index' ==> gets index relative to matched set
				'states' ==> gets the 'states' object
				
				If none of the above are passed, it will try to find the argument string
				inside document.documentElement.style or a styleAliases object.
				
				If it doesn't find the argument string in styles, it will try to
				find an attribute matching the argument string.
				
			If two arguments are passed:
			
				e.g. _('div').get('attr','data-foo')
			
				'attr' , attribute ==> gets the value of an attribute
				'style' , style ==> gets the style of an element
				'state' , state ==> gets the custom set state of an element
				
			The Petit instance IS NOT returned for chaining, because a value is returned.
		*/
		
		get: function() {
			var el = this[0],
				args = arguments,
				len = args.length,
				type,
				prop;
			
			if(len === 1) {
				prop = args[0];
				
				var map = {
					text: getText(el),
					tag: el.tagName,
					html: el.innerHTML,
					value: el.value,
					index: emptyArray.indexOf.call(makeArray(_(el.selector)),el),
					states: el.states,
					'class': el.className
					//id
				}[prop.toLowerCase()];
								
				if( typeof(map) !== 'undefined'  ) return map;
				
				/***
					POSSIBLE BUG:

					getStyle(el,prop) ==> could return a falsy value?
					Thus, resorting to el.getAttribute(prop), which might not be intended
				***/
				if( prop in styles || prop in styleAliases ) {
					return getStyle(el,prop);	
				} else if (el.hasAttribute(prop)) {
					return el.getAttribute(prop);	
				}
				
//				return getStyle(el,prop) || el.getAttribute(prop);	
				
			} else if (len === 2) {
				type = args[0];
				prop = args[1];
				
				switch(type) {
					case 'attr':
						if(prop === 'class') {
							return el.className;	
						} else {
							return el.getAttribute(prop);	
						}
						break;
					case 'style':
						return getStyle(el,prop);
						break;
					case 'state':
						return el.states[prop];
						break;
				}
//				
//				return {
//					/***
//						BUG:
//						
//						getAttribute('class') won't work in IE < 8
//						IE interprets it as element['class'], which isn't a property of Element
//					***/
//					attr: el.getAttribute(prop),
//					style: getStyle(el,prop),
//					state: el.states[prop]
//				}[type];				
			}
		},
		
		/*
			.set(object)
			.set(property, value)
			.set(type, property, value)
			
			Sets something for every element in the matched set and returns the
			original Petit instance for method chaining.
			
			Only 1, 2, or 3 arguments can be passed in.
			
			If one argument is passed:
				
				e.g. _('div').set({
					style: {
						color: 'red'
					},
					attr: {
						'data-foo': 'bar'
					}
				});
				
				It must be an object of one or more objects.  The nested objects can
				be called 'style' or 'attr'.
				
				The nested 'style' object can contain key-value pairs of style properties
				and values.
			
				The nested 'attr' object can contian key-value pairs of attribute names
				and values.
				
			If two arguments are passed:
			
				e.g. _('div').set('color','red')
				
				'text' , text ==> sets the text
				'html' , html ==> sets the innerHTML
				'class' , class ==> sets, adds, removes, or toggles a class
					_('div').set('class','foo') ==> overwrite the class
					_('div').set('class','add:foo bar') ==> adds two classes, 'foo' and 'bar'
					_('div').set('class','remove:bar') ==> removes class 'bar'
					_('div').set('class','toggle:foo') ==> toggles class 'foo'
					
				If none of those argument strings were passed in, it will try to set
				a style, if the first argument matches a property in document.documentElement.style
				or a styleAliases object.
				
				If it can't find the first argument in styles, it try to set an attribute with the
				name of the first argument to the value of the second argument.
				
			If three arguments are passed:
			
				e.g. _('div').set('style','background-color','red')
				
				'state' , state , boolean ==> sets a 'state' of an object to true or false
				'style' , property , value ==> sets a given style property to the value
				'attr' , property , value ==> sets a given attribute to the value
		*/
		
		set: function() {
			var args = arguments, // need to declare this for scope in forEach
				len = args.length,
				object,
				type,
				prop,
				val;

			forEach(this, function(el) {				
				if(len===1) {
					object = args[0];

					if( isPlainObject(object) ) {	

						for(t in object) {
							for(v in object[t]) {

								val = object[t][v];

								switch(t) {
									case 'style':
										setStyle( el, v, (typeof(val) === 'number' ? val+'px' : val) );
										break;
									case 'attr': el.setAttribute(v,val);
										break;	
								}
							}
						}

					}
				} else if (len===2) {
					prop = args[0];
					val = args[1];

					switch(prop) {
						case 'text':
							setText(el,val);
							break;
						case 'html':
							el.innerHTML = val;
							break;
						case 'class':
							setClass(el,val);
							break;
						default:
							setStyle(el,prop,val) || el.setAttribute(prop,val);
							break;
					}
				} else if (len===3) {
					type = args[0];
					prop = args[1];
					val = args[2];

					switch(type) {
						case 'state':
							el.states[prop] = typeof(val) === 'boolean' ? val : null;
							break;
						case 'style':
							setStyle(el,prop,val);
							break;
						case 'attr':
							el.setAttribute(prop,val);
							break;
					}
				}
			});
			
			return this;

		},
		
		/*
			.has(string)
			.has(Petit instance)
			.has(type, property)
			
			Returns either a number or a boolean value for the first matched element in the set.
			
			Only one or two arguments can be passed in.
			
			If one arguments in passed in:
			
				e.g. _('div').has('children')
			
				'children' ==> returns the number of child elements
				'text' ==> return true or false, depending on whether the element has textNode elements
				
				If the argument in an Petit instance, it will return true or false, depending on
				whether or not the Petit instance calling the method contains the Petit instance
				that is passed in as the argument.
				
				If the argument contains < or >, it assumes the user wants to see if the caller
				contains a certain HTML string.  It will return true or false, depending on whether
				the innerHTML contains the argument string.
				
				If the argument is a text string, it will return true or false, depending on whether
				the innerText contains the argument string.
			
			The Petit instance IS NOT returned for chaining, because a value is returned.
		
		*/
		
		has: function() {
			var el,
				args = arguments,
				len = args.length,
				type,
				prop,
				object,
				callback,
				limit,
				has;
			
			if(len === 1) {
				el = this[0];
				prop = args[0];
								
				var map = {
					children: countChildElements(el),
					text: countTextNodes(el) > 0
				}[prop];

				if ( typeof(map) !== 'undefined' ) return map;
				
				if( prop instanceof Petit ) {	
					
					if( countChildElements(el) > 0) {
						object = prop;

						forEach(object,function(item) {
							if(el.contains(item) && item !== el) {
								has = true;
							} else {
								has = false;	
							}
						});

					}
					
					return has;
						
				} else {
					
					return hasHTMLChars(prop) ?
						el.innerHTML.indexOf(prop) > -1 :
						getText(el).indexOf(prop) > -1;
					
				}

			} else if (len===2) {
				
				el = this[0];
				type = args[0];
				prop = args[1];

				return {
					// possible breakpoint in IE<8 if no hasAttribute shim
					attr: el.hasAttribute(prop),
					html: el.innerHTML.indexOf(prop) > -1,
					text: getText(el).indexOf(prop) > -1,
					'class': hasClass(el,prop)
				}[type];
					
			}
			// what about div.has('attr','id','someId') ?
		},
		
		/*
			.is(state)
			Returns either a number or a boolean value for the first matched element in the set.
			
			Only one argument can be passed in.
			
			If one arguments in passed in:
			
				e.g. _('div').is('open')
			
				- Returns true if the state was set to true.
				- Returns false if the state was set to false, or if the state was never set.
			
			The Petit instance IS NOT returned for chaining, because a value is returned.			
			
		*/
		
		is: function() {
			var el = this[0],
				state = arguments[0];
				
				if( typeof(state) === 'undefined' ) {
					
					return typeof(el) !== 'undefined';
					
				} else {
					
					return el.states[state];
					
				}
		},
		
		/*
			.each(function)
			
			Iterates through each element in the matched set and calls a function in the context
			of the currently iterated element.  The original Petit instance is returned for method
			chaining.
			
			Only one argument can be passed in.
			
			If one argument is passed:
				
				e.g. var colors = [];
				
				_('div').each(function(element, index) {
				
					colors.push( element.get('color') );
					
					console.log(index)
				
				});
				
				The currently iterated element as an Petit object is passed in as
				the first argument to the callback function that the user provides the method.
				The index of the currently iterated element in relation to the caller's matched set 
				is passed in as the second argument.
		*/
		
		each: function(fn) {

			forEach(this,function(item,i) {
				fn.call(item,_(item),i);
			});
			
			return this;
		},
		
		/*
			.on(eventType, handler)
			.on(eventType, delegatedElement, handler)
			
			Attaches an event handler to every element in the matched set.
			The original Petit instance is returned for method chaining.
			
			Only two or three arguments can be passed in.
			
			If two argument are passed:
				
				e.g. function log(e) { console.log(e.target }
				
				_('div').on('click', log);
				
				This method uses addEventListener if available, or attachEvent for IE<9
				
				It is recommended that the user passes in a named function (as opposed to
				an anonymous function), because only named functions can be later detached
				from the elements using the .off() method.
			
			If three arguments are passed:
			
				e.g. function log(e) { console.log(e.target) }
				
				_('body').on('click','div',log)
				
				This method attaches an event listener to a parent element, and
				the corresponding handler only fires if the event target is
				the second argument (which is a selector string that is internally
				turned into an Petit instance).
				
				At this time, named handlers cannot be detached from elements using
				.off() if they were attached using the argument pattern for event
				delegation.	
		*/
		
		on: function() {
			var len = arguments.length,
				eventType = arguments[0],
				delegatedElement,
				ev, // short for 'event', which is sometimes a keyword
				target,
				handler;
			
			if(len === 2) {
				handler = arguments[1];
				
				forEach(this, function(el) {
					
					handleEvent('add', el, eventType, handler);
					
				});
				
			} else if (len === 3) {
				/***
					BUG: Cannot remove event listeners by name with delegation
				***/
				delegatedElement = _(arguments[1]);
				handler = arguments[2];
				
				forEach(this, function(el) {
					
					handleEvent('add', el, eventType, function(e) {
						ev = e || win.event;
						target = ev.target || ev.srcElement;
						
						forEach(delegatedElement,function(de,i) {
							if(target === de) {
								return handler(ev);
							}
						});						
					});
					
				});
				
			}
			
			return this;
		},
		
		/*
			.off(eventType, handler)
			
			Detaches an event handler from every element in the matched set.
			The original Petit instance is returned for method chaining.
			
			Only two arguments can be passed in.
			
			If two argument are passed:
				
				e.g. _('div').off('click',log)
				
				It detaches an event listener using removeEventListener if available,
				or detachEvent for IE<9.
				
				This method cannot be used to detach all event listeners of a specific
				type (for example, _('div').off('click') does nothing).
				
				Currently, this method cannot detached listeners that were attached
				using the event delegation argument pattern in .on().

		*/
		
		off: function(eventType, handler) {
			
			forEach(this, function(el) {
				
				handleEvent('remove', el, eventType, handler);
				
			});
			
			return this;
		},
	}

	win._ = _;
	
})(this,this.document,[]);