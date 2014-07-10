define(["sb_light/globals", "sb_light/utils/ext"], function(sb, ext) {
	"use strict";
	var pf = {};
	

	if(!String.prototype.trim) {
		String.prototype.trim = function trim() { 
			return this.replace(/^\s\s*/, '').replace(/\s\s*$/, ''); 
		};
	}


	//From Mozilla
	//https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/forEach
	if ( !Array.prototype.forEach ) {  
		Array.prototype.forEach = function ext_array_forEach(fn, scope) {  
			for(var i = 0, len = this.length; i < len; ++i) {  
				fn.call(scope || this, this[i], i, this);  
			}
		};
	}  
	
	
	if (!Function.prototype.bind) {
		Function.prototype.bind = function ext_array_bind(oThis) {
		if (typeof this !== "function") {
			// closest thing possible to the ECMAScript 5 internal IsCallable function
			throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
		}
	
		var aArgs = ext.slice(arguments, 1), 
			fToBind = this, 
			NOP = function () {},
			Bound = function () {
				return fToBind.apply(	(this instanceof NOP ? this : oThis), 
										aArgs.concat(ext.slice(arguments))
										);
			};
	
		NOP.prototype = this.prototype;
		Bound.prototype = new NOP();
	
		return Bound;
		};
	}
	
	//similar to Func.bind, but executes the function automatically after a delay.
	if(!Function.prototype.bindDelay) {
		Function.prototype.bindDelay = function ext_array_bindDelay(context, timeout /*, ...prefixArgs*/) {
			var args = ext.slice(arguments);
			args.splice(1,1); // remove timeout
			var f = this.bind.apply(this,args);
			return setTimeout(f, timeout);
		};
	}
	
	
	
	//From Mozilla
	//https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/forEach
	if ( !Array.prototype.forEach ) {  
		Array.prototype.forEach = function ext_array_forEach(fn, scope) {  
			for(var i = 0, len = this.length; i < len; ++i) {  
				fn.call(scope || this, this[i], i, this);  
			}
		};
	}  
	
	//shallow clone. 
	if ( !Array.prototype.clone ) {  
		Array.prototype.clone = function ext_array_clone() {  
			return ([]).concat(this);
		};
	}  
	
	
	//returns the last element in the array
	// or the index from the end as specified
	// e.g., foo.last(0) is the same as foo.last()
	// and foo.last(1) returns the 2nd last item.
	if ( !Array.prototype.last ) {  
		Array.prototype.last = function ext_array_last(idx) {
			idx = (this.length-1) - (idx || 0);
			return (this.length > idx && idx >= 0) ? this[idx] : null;
		};  
	}  
	
	
	
	
	//From MOzilla:
	//https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/Reduce
	// Syntax
	// 	array.reduce(callback[, initialValue])
	// Parameters
	// 	callback
	// 		Function to execute on each value in the array, taking four arguments:
	// 		previousValue
	// 			The value previously returned in the last invocation of the callback, or initialValue, if supplied. (See below.)
	// 		currentValue
	// 			The current element being processed in the array.
	// 		index
	// 			The index of the current element being processed in the array.
	// 		array
	// 			The array reduce was called upon.
	// 	initialValue
	// 		Object to use as the first argument to the first call of the callback.
	if (!Array.prototype.reduce) {
		Array.prototype.reduce = function reduce(accumulator){
			if (this===null || this===undefined) {
				throw new TypeError("Object is null or undefined");
			}
			var i = 0, l = this.length >> 0, curr;
	
			if(typeof accumulator !== "function") {// ES5 : "If IsCallable(callbackfn) is false, throw a TypeError exception."
				throw new TypeError("First argument is not callable");
			}
	
			if(arguments.length < 2) {
				if (l === 0) {
					throw new TypeError("Array length is 0 and no second argument");
				}
				curr = this[0];
				i = 1; // start accumulating at the second element
			} else {
				curr = arguments[1];
			}
			while (i < l) {
				if(i in this) {
					curr = accumulator.call(undefined, curr, this[i], i, this);
				}
				++i;
			}
			return curr;
		};
	}
	
	//from mozilla
	//https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/filter
	if (!Array.prototype.filter) {
		Array.prototype.filter = function ext_array_filter(fun /*, thisp */) {
			if (this === null) {
				throw new TypeError();
			}
			var t = Object(this);
			var len = t.length >>> 0;
			if (typeof fun != "function") {
				throw new TypeError();
			}
	
			var res = [];
			var thisp = arguments[1];
			for (var i = 0; i < len; i++) {
				if (i in t) {
					var val = t[i]; // in case fun mutates this
					if (fun.call(thisp, val, i, t)) {
						res.push(val);
					}
				}
			}
			return res;
		};
	}
	
	//From MOzilla
	//https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/keys
	// Syntax
	// 	Object.keys(obj)
	// Parameters
	// 	obj
	// 	The object whose enumerable own properties are to be returned.
	
	if (!Object.keys) {
		Object.keys = (function ext_object_keys() {
		var hasOwnProperty = Object.prototype.hasOwnProperty,
			hasDontEnumBug = !({toString: null}).propertyIsEnumerable('toString'),
			dontEnums = [
				'toString',
				'toLocaleString',
				'valueOf',
				'hasOwnProperty',
				'isPrototypeOf',
				'propertyIsEnumerable',
				'constructor'
			],
			dontEnumsLength = dontEnums.length;
	
		return (function (obj) {
			if (typeof obj !== 'object' && typeof obj !== 'function' || obj === null) {
				throw new TypeError('Object.keys called on non-object');	
			}
			var result = [];
	
			for (var prop in obj) {
				if (hasOwnProperty.call(obj, prop)) {
					result.push(prop);
				}
			}
	
			if (hasDontEnumBug) {
				for (var i=0; i < dontEnumsLength; i++) {
					if (hasOwnProperty.call(obj, dontEnums[i])) {
						result.push(dontEnums[i]);
					}
				}
			}
			return result;
		});
		})();
	}
	
	
	if (!Array.prototype.findKey) {  
		Array.prototype.findKey = function ext_array_find(key, value) {  
			for(var i = 0; i < this.length; ++i) {
				if(this[i][key] == value) { return {index:i, value:this[i]} ; }
			}
			return {index:NaN, value:null};
		};
	} 

	//From Mozilla
	//https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf
	if (!Array.prototype.indexOf) {  
		Array.prototype.indexOf = function ext_array_indexOf(searchElement /*, fromIndex */ ) {  
			if (this === null) {  
				throw new TypeError();  
			}  
			var t = Object(this);  
			var len = t.length >>> 0;  
			if (len === 0) {  
				return -1;  
			}  
			var n = 0;  
			if (arguments.length > 0) {  
				n = Number(arguments[1]);  
				if (n != n) { // shortcut for verifying if it's NaN  
					n = 0;  
				} else if (n !== 0 && n !== Infinity && n !== -Infinity) {  
					n = (n > 0 || -1) * Math.floor(Math.abs(n));  
				}  
			}  
			if (n >= len) {  
				return -1;  
			}  
			var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);  
			for (; k < len; k++) {  
				if (k in t && t[k] === searchElement) {  
					return k;  
				}  
			}  
			return -1;  
		};  
	}  
	
	
	//https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/map
	// Production steps of ECMA-262, Edition 5, 15.4.4.19  
	// Reference: http://es5.github.com/#x15.4.4.19  
	if (!Array.prototype.map) {  
		Array.prototype.map = function ext_array_map(callback, thisArg) {  
		
		var T, A, k;  
		
		if (this === null) {  
			throw new TypeError(" this is null or not defined");  
		}  
		
		// 1. Let O be the result of calling ToObject passing the |this| value as the argument.  
		var O = Object(this);  
		
		// 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".  
		// 3. Let len be ToUint32(lenValue).  
		var len = O.length >>> 0;  
		
		// 4. If IsCallable(callback) is false, throw a TypeError exception.  
		// See: http://es5.github.com/#x9.11  
		if ({}.toString.call(callback) != "[object Function]") {  
			throw new TypeError(callback + " is not a function");  
		}  
		
		// 5. If thisArg was supplied, let T be thisArg; else let T be undefined.  
		if (thisArg) {  
			T = thisArg;  
		}  
		
		// 6. Let A be a new array created as if by the expression new Array(len) where Array is  
		// the standard built-in constructor with that name and len is the value of len.  
		A = new Array(len);  
		
		// 7. Let k be 0  
		k = 0;  
		
		// 8. Repeat, while k < len  
		while(k < len) {  
		
			var kValue, mappedValue;  

			// a. Let Pk be ToString(k).  
			//   This is implicit for LHS operands of the in operator  
			// b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.  
			//   This step can be combined with c  
			// c. If kPresent is true, then  
			if (k in O) {  
				// i. Let kValue be the result of calling the Get internal method of O with argument Pk.  
				kValue = O[ k ];  

				// ii. Let mappedValue be the result of calling the Call internal method of callback  
				// with T as the this value and argument list containing kValue, k, and O.  
				mappedValue = callback.call(T, kValue, k, O);  

				// iii. Call the DefineOwnProperty internal method of A with arguments  
				// Pk, Property Descriptor {Value: mappedValue, Writable: true, Enumerable: true, Configurable: true},  
				// and false.  

				// In browsers that support Object.defineProperty, use the following:  
				// Object.defineProperty(A, Pk, { value: mappedValue, writable: true, enumerable: true, configurable: true });  

				// For best browser support, use the following:  
				A[ k ] = mappedValue;  
			}  
			// d. Increase k by 1.  
			k++;
		}

		// 9. return A  
		return A;  
		};        
	}  
	

	if (!Array.prototype.every)	{
		Array.prototype.every = function(fun /*, thisp */)	{

			if (this === null) {
				throw new TypeError();
			}

			var t = Object(this);
			var len = t.length >>> 0;
			if (typeof fun != "function") {
				throw new TypeError();
			}

			var thisp = arguments[1];
			for (var i = 0; i < len; i++)	{
				if (i in t && !fun.call(thisp, t[i], i, t)) {
					return false;
				}
			}
			return true;
		};
	}
	
	if (!Array.prototype.some)	{
		Array.prototype.some = function(fun /*, thisp */)  {
			if (this === null){
				throw new TypeError();
			}
				
			var t = Object(this);
			var len = t.length >>> 0;
			if (typeof fun != "function"){
				throw new TypeError();
			}

			var thisp = arguments[1];
			for (var i = 0; i < len; i++) {
				if (i in t && fun.call(thisp, t[i], i, t)) {
					return true;
				}
			}

			return false;
		};
	}


	//made this up. does a push but always returns "this" array
	if (!Array.prototype.put) {  
		Array.prototype.put = function ext_array_put() {
			var args = ext.slice(arguments);
			while(args.length) {
				this[this.length] = args.shift();
			}
			return this; 
		};
	}
	
	//made this up. does a push but always returns "this" array
	//ensures the push is unique
	if (!Array.prototype.punique) {  
		Array.prototype.punique = function ext_array_punique() {
			var args = ext.slice(arguments);
			while(args.length) {
				var a = args.shift();
				if(this.indexOf(a) < 0) {
					this[this.length] = a;
				}
			}
			return this; 
		};
	}
	
	if (!Array.prototype.cloneExcept) { 
		Array.prototype.cloneExcept = function ext_array_cloneExcept(/*items*/) {
			var items = ext.slice(arguments);
			return this.reduce(function ext_array_cloneExcept_reduce(a,el) {
				return items.indexOf(el) < 0 ? a.put(el) : a;
			}, []);
		};
	}

	if (!Array.prototype.remove) { 
		Array.prototype.remove = function ext_array_remove(/*items*/) {
			var args = ext.slice(arguments);
			while(args.length) {
				var idx = this.indexOf(args.pop());
				if(idx >= 0) {
					this.splice(idx,1);
				}
			}
			return this; 
		};
	}


	if (!Array.prototype.find) {
		Object.defineProperty(Array.prototype, 'find', {
			enumerable: false,
			configurable: true,
			writable: true,
			value: function(predicate) {
				if (this == null) {
					throw new TypeError('Array.prototype.find called on null or undefined');
				}
				if (typeof predicate !== 'function') {
					throw new TypeError('predicate must be a function');
				}
				var list = Object(this);
				var length = list.length >>> 0;
				var thisArg = arguments[1];
				var value;

				for (var i = 0; i < length; i++) {
					if (i in list) {
						value = list[i];
						if (predicate.call(thisArg, value, i, list)) {
							return value;
						}
					}
				}
				return undefined;
			}
		});
	}
	
	
	//DATE stuff from 
	//http://stackoverflow.com/questions/1643320/get-month-name-from-date-using-javascript
	Date.prototype.getMonthName = function  ext_date_getMonthName(lang) {
		lang = lang && (lang in Date.locale) ? lang : 'en';
		return Date.locale[lang].month_names[this.getMonth()];
	};
	
	Date.prototype.getMonthNameShort = function ext_date_getMonthNameShort(lang) {
		lang = lang && (lang in Date.locale) ? lang : 'en';
		return Date.locale[lang].month_names_short[this.getMonth()];
	};
	
	Date.locale = {
		en: {
			 month_names: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
			 month_names_short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
		}
	};



//from:https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Storage
//if local storage doesn't exist
if (typeof window !=="undefined" && !window.localStorage) {
	 Object.defineProperty(window, "localStorage", new (function () {
		var aKeys = [], oStorage = {};
		Object.defineProperty(oStorage, "getItem", {
			value: function (sKey) { return sKey ? this[sKey] : null; },
			writable: false,
			configurable: false,
			enumerable: false
		});
		Object.defineProperty(oStorage, "key", {
			value: function (nKeyId) { return aKeys[nKeyId]; },
			writable: false,
			configurable: false,
			enumerable: false
		});
		Object.defineProperty(oStorage, "setItem", {
			value: function (sKey, sValue) {
				if(!sKey) { return; }
				document.cookie = escape(sKey) + "=" + escape(sValue) + "; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/";
			},
			writable: false,
			configurable: false,
			enumerable: false
		});
		Object.defineProperty(oStorage, "length", {
			get: function () { return aKeys.length; },
			configurable: false,
			enumerable: false
		});
		Object.defineProperty(oStorage, "removeItem", {
			value: function (sKey) {
				if(!sKey) { return; }
				document.cookie = escape(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
			},
			writable: false,
			configurable: false,
			enumerable: false
		});
		this.get = function () {
			var iThisIndx;
			for (var sKey in oStorage) {
				iThisIndx = aKeys.indexOf(sKey);
				if (iThisIndx === -1) { oStorage.setItem(sKey, oStorage[sKey]); }
				else { aKeys.splice(iThisIndx, 1); }
				delete oStorage[sKey];
			}
			for (aKeys; aKeys.length > 0; aKeys.splice(0, 1)) { oStorage.removeItem(aKeys[0]); }
			for (var aCouple, iKey, nIdx = 0, aCouples = document.cookie.split(/\s*;\s*/); nIdx < aCouples.length; nIdx++) {
				aCouple = aCouples[nIdx].split(/\s*=\s*/);
				if (aCouple.length > 1) {
					oStorage[iKey = unescape(aCouple[0])] = unescape(aCouple[1]);
					aKeys.push(iKey);
				}
			}
			return oStorage;
		};
		this.configurable = false;
		this.enumerable = true;
	})());
}




	return pf
}); 
