


define(['../globals'], function(sb) {
	//console.log("ext", sb.version);
	var ext = {};


	//helps convert arguments into array
	//a is an array or arguments.
	//idx is the starting index of the slice
	ext.slice = function(a, idx, end) {
		idx = isNaN(idx) ? 0 : idx;
		if(isNaN(end)) {
			return Array.prototype.slice.call(a, idx);
		} 
		return Array.prototype.slice.call(a, idx, end);
	};
	
	ext.debug = function() {
		if(!sb.debug) { return; }
		var str = ([(new Date()).toTimeString()]).concat(ext.slice(arguments)).join(" ");
		if(ext.ti()) {
			Ti.API.debug(str);
		} else if(typeof console !== "undefined") {
			console.log(str);	
		}
	};
	
	//check is Titanium framework exists. probably shouldn't be needed any longer
	//TODO: investigate removal
	ext.ti = function() {
		return typeof Ti !== "undefined";	
	};
	
	ext.map = function(list, fn, scope) {
		var res = [];
		if (ext.isArray(list)) {
		    for(var i = 0, len = list.length; i < len; ++i) {  
	    	  res.push( fn.call(scope || this, list[i], i, list));  
	    	}  
		} else { //Object
			for (var k in list) {
				//func(value,key,list)
				res.push(fn.call(scope || this, list[k],k, list));
			}
		}
		return res;
	};
	
	ext.each = function(list, fn, scope) {
		if(ext.isArray(list)) {
			list.forEach(fn,scope);
		} else {
			for(var el in list) {
				//func(value,key,list)
				fn.call(scope || list, list[el], el, list);
			}	
		}
	};
	
	ext.length = function(list) {
		if(ext.isArray(list)) {
			return list.length;
		} else if(list) {
			return Object.keys(list).length;	
		}
		return 0;
	};
	//takes a list of objects and a key property and converts the array to a hash map
	ext.toObject= function(list, key) {
		return list.reduce(function(prev, el) {
			prev[el[key]] = el;
			return prev;
		}, {});
	}	
	//takes a hash map and returns an array of values. 
	ext.values= function(map, keyName) {
		return ext.map(map, function(el,k) { 
			if(keyName) { el[keyName] = el[keyName] || k; }
			return el; 
		});
	}	
	
	//this only works with objects that contain only native JS object (e.g., Object-derived)
	//probably won't work very well for system,proprietary, etc.. objects.
	//converts the entire things to a string, so might have performance issues.
	ext.deepClone = function(obj) {
		return JSON.parse(JSON.stringify(obj));
	}
	
		/************  TYPES ***************************/
	ext.isArr = function(obj) {
		return Object.prototype.toString.call(obj) == "[object Array]";
	};
	ext.isArray = ext.isArr;
	
	ext.isFunc = function(obj) {
		return Object.prototype.toString.call(obj) == "[object Function]";
	};
	ext.isFunction = ext.isFunc;
	
	ext.isStr = function(obj) {
		return Object.prototype.toString.call(obj) == "[object String]";
	};
	ext.isString = ext.isStr;
	
	ext.isBool = function(obj) {
		return Object.prototype.toString.call(obj) == "[object Boolean]";
	}
	ext.isBoolean = ext.isBool;
	
	ext.isNum = function(obj) {
		return Object.prototype.toString.call(obj) == "[object Number]";
	}
	ext.isNumber = ext.isNum;
	
	ext.isDate = function(obj) {
		return Object.prototype.toString.call(obj) == "[object Date]";
	}
	
	
	//helper function that gets executed in the context of the callee.
	ext._getClass= {}.toString;
	
	
		/************  STRINGS  ***************************/
	ext.caps = function(s) {
		s = ext.isArray(s) ? s : [s];
		return s.reduce( function(prev,el) {
			return prev + " " + el.charAt(0).toUpperCase() + el.slice(1);
		}, "");
	};
	ext.capitalize = ext.caps;
	
	ext.replace = function(src, obj) {
		var s = src;
		ext.each(obj, function(v,k) {
			var r = new RegExp("%"+k.toUpperCase()+"%")
			s = s.replace(r, v);
		});
		return s;
	
	};
	
		/************  DATES ***************************/
	ext.parseDate = function(d) { return sb.moment(d).toDate();	};
	ext.daysDiff = function(da, db) {return sb.moment(db).diff(sb.moment(da),"days")};
	ext.today = function() { return new Date(); };
	ext.minDate = function() { return ext.parseDate(ext.slice(arguments).sort(ext.sortDate)[0]); };
	ext.maxDate = function() { return ext.parseDate(ext.slice(arguments).sort(ext.sortDate).last()); };
	ext._serverFormat = "YYYY/MM/DD";
	ext._userFormat = "dddd, DD MMMM YYYY";
	ext.serverDate = function(d) { return sb.moment(d).format(ext._serverFormat); };
	ext.userDate = function(d) { return sb.moment(d).format("dddd, DD MMMM YYYY"); 	};
	ext.dateFromNow = function(d, format, reverse) { 
		if(reverse) {
			return "(" + sb.moment(d).fromNow() + ") " + sb.moment(d).format(format || ext._userFormat);
		} else {
			return sb.moment(d).format(format || ext._userFormat) + " (" + sb.moment(d).fromNow() + ")";
		}
	};
		/************  REGEXPS ***************************/
	ext.regEmail = new RegExp("([\\w-\\.]+)@((?:[\\w]+\\.)+)([a-zA-Z]{2,4})");
	
	
	
		/************  SORTING ***************************/
		//sort an array based on a property, and the function to use
		//so if an array is [{date:...,value:...},...], you can sort using ext.sortProp("date",ext.sortDate); 
	ext.sortFactory = function(prop, func, reverse) {
		return function(a,b) {	return func(a[prop],b[prop]) * (reverse ? -1 : 1);		};
	},
	ext.sortTime = function(a,b) { return ext.sortNumbers(ext.parseDate(a).getTime(), ext.parseDate(b).getTime()); }; 
	ext.sortNumber = function(a,b){ return a-b; };
	ext.sortNumbers = ext.sortNumber;
	ext.sortDate = function(a,b){ return ext.daysDiff(b,a); }; //reverse a,b because of daysDiff bias 
	ext.sortDates = ext.sortDate;
	ext.sortString = function(a,b){ return a.localeCompare(b); };
	ext.sortStrings = ext.sortString;
	ext.sortBool = function(a,b) { return ext.sortNumber(a?1:0, b?1:0); }
	 
	ext.sortDateValue = function(a,b) { return ext.sortDate(a.date,b.date); };
	ext.sortUsers = function(a,b) {  return a.last_name.localeCompare(b.last_name); }
	ext.sortFocus = function(a,b) {  return a.title.localeCompare(b.title); }
	ext.sortName = function(a,b) {  return a.name.localeCompare(b.name); }
	ext.sortBlocksByProgress = function(a,b) {
		//closed blocks 
		var ac = a.closed, bc = b.closed;
		if(ac && !bc) { return 1; }
		if(!ac && bc) { return -1; }
		
		var an=a.ownership_state == "new", bn = b.ownership_state=="new"; 
		if(an && !bn) { return 1; }
		if(!an && bn) { return -1; }
		
		if( (an && bn) || (ac && bc)) { 
			return ext.sortString(a.title,b.title); 
		}

		var aep = a.expected_progress, bep = b.expected_progress;
		//return the one which has started over the one which hasn't.
		if(!aep && bep ) { return 1; }  
		if(aep  && !bep ) { return -1; }
		if(!aep && !bep) { return 0; }
		
		//Now, both have started. Return the variance diff
		return ext.sortNumbers( (a.percent_progress/aep), (b.percent_progress/bep) );
	};
	
		
		/************  CSS ***************************/
	ext.px = function(number) {		return [number,"px"].join("");	};
	ext.pc = function(number) {		return [number,"%"].join("");	};
		
		//************  Math ***************************/
	ext.roundTo = function(number, dec) {
		var val = Math.pow(10,dec);
		return Math.round(number * val)/val;
	};
	
	ext.to_i =  function(str, base, def/*=0*/) {
		var i = parseInt(str, base||10);
		return isNaN(i) ? (def===undefined?0:def) : i; 
	};
	ext.to_color = function(num) {
	    return '#' +  ('00000' + (num | 0).toString(16)).substr(-6);
	};
	
	ext.number = function(n,def/*==0*/) {
		return isNaN(n) ? (def||0) : n;
	};
	ext.max =  function(/*etc....*/) {
		var m = Number.NEGATIVE_INFINITY;
		var c;
		for(var i = 0; i < arguments.length; ++i) {
			c = this.number(arguments[i],Number.NEGATIVE_INFINITY);
			m = c > m ? c : m;
		}
		return m;
	};
	ext.min = function(/*etc....*/) {
		var m = Number.POSITIVE_INFINITY;
		var c;
		for(var i = 0; i < arguments.length; ++i) {
			c = this.number(arguments[i],Number.POSITIVE_INFINITY);
			m = c < m ? c : m;
		}
		return m;
	};
		
		/************  BLOCK COLOR CONSTANTS***************************/
		//status is -1 (red), 0 (yellow), and 1 (green)
	ext.healthColor = function(data) { return (["#D80000","#EACF00","#0FAD00"])[data.status+1] };
	ext.healthText = function(data) { return (["Bad","Warning","Good"])[data.status+1] };
	ext.blockProgressFill = function(block) {
		switch(block.progress_color) {
			case "green": 	return ["#176717", 		"url(#progressGood)" ];
			case "yellow":	return ["#77771B", 	"url(#progressWarning)"];
			case "red": 	return ["#641717", 		"url(#progressBad)" ];
			default: 		return ["#999", 		"url(#progressNone)" ];
		}
	};
	
			
		
	/************  MASSAGE SERVER DATA INTO BETTER OBJECTS FOR D3/presentation ***************************/
	ext.getResultMessages = function(r) {
		var res = {
			errors:null,
			warnings: null,
			notices:null
		};
		if (r) {
			//errors that mean something in the form was incorrect, hopefully out of our control (e.g., bad input from user)
			if(ext.isArray(r.result)) {
				r.result.forEach(function(o) {
					if(o && o.errors) {
						res.errors = {
							form: r.result, 
							message:JSON.stringify(r.result)
						};
					}
				});
			} else if(r.result && r.result.errors) {
				res.errors = {form: r.result.errors, message:JSON.stringify(r.result)};
			}
			//errors on the server that the client / user cannot control 
			if(!res.errors && r.flash && r.flash.error) { 
				res.errors = {message: r.flash.error};
			}
			//errors on the server that likely mean a bug somewhere.
			if (!res.errors && r.errors && r.errors.error) {
				res.errors = {message: r.errors.error };
			}
		}
		res.notices = r.flash.notice;
		res.warnings = r.flash.warning;
		return res;
	};
	
		
		//merge the target and actuals series into one array of objects. 
		//parse the date into d3 format as well. "parseDate"
	ext.massageTA = function(data) {
		var dates = [];
		var td = [];
		var vd = [];
		var dataMap = {};
		
		data.values.forEach(function(el) {
			el.date = ext.parseDate(el.date);
			dates.punique(el.date);
		});
		data.values.sort(ext.sortDateValue);
		
		data.target.forEach(function(el) {
			el.date = ext.parseDate(el.date);
			dates.punique(el.date);
			var rs = data.tolerance.range_start > data.tolerance.range_end ? data.tolerance.range_start : data.tolerance.range_end;
			var re = data.tolerance.range_start > data.tolerance.range_end ? data.tolerance.range_end : data.tolerance.range_start;
			
			el.upper = el.value  + (data.tolerance.percentage ? (el.value *rs/100) : rs);
			el.lower = el.value  + (data.tolerance.percentage ? (el.value *re/100) : re);
		});
		data.target.sort(ext.sortDateValue);
		
		data.dates = dates.sort(ext.sortDate);
		var today = new Date();
		if(data.dates[0].getTime() > today.getTime()) {
			data.dates.unshift(today);
		}
		if(data.dates.last().getTime() < today.getTime()) {
			data.dates.put(today);
		}
		
		return data;
	};
		
		//fix dates and sort history for health charts
	ext.massageHealth = function(data) {
		var dates = [];
		var series = $.map(data.historical_values, function(v, k) {
			return {date: ext.parseDate(k), value:v};
		});
		
		
		data.series = series.sort(ext.sortDateValue);
		
		data.dates = data.series.map(function(el) { return el.date; });
		data.dates.push(ext.parseDate(data.end_date));
	
		return data;
	
	};
	
	
	//source gets priority over target
	//all source properties are applied to target.
	//  EXCEPT the ones in ignore.
	//	ignore can be an array of names, or an object with keys. All these key names are skipped from being applied,
	//	but they will not be removed from target if they exist there. 
	ext.mixin = function (/*Object*/ target, /*Object*/ source, /*Object or Array*/ ignore ){
		var empty = ignore || {}; //default template for properties to ignore
		var target = target || {};
		var source = source || {};
		
		var name, s, i;
		for(name in source){
		    s = source[name];
			var skip =  ext.isArray(empty) ? (empty.indexOf(name) >= 0) : (name in empty);
			if(skip) { continue; }
	        target[name] = s;
		}
		return target; // Object
	};
	 
	// Create a new object, combining the properties of the passed objects with the last arguments having
	// priority over the first ones
	ext.combine = function( /*Object or array*/ props, /*object or array*/ ignore) {
		props = ext.isArray(props) ? props : [props];
		return props.reduce(function(newObj, v) {
			return ext.mixin(newObj, v, ignore);
		},{});
	};		
	

	
	//From Mozilla
	//https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/forEach
	if ( !Array.prototype.forEach ) {  
	  Array.prototype.forEach = function(fn, scope) {  
	    for(var i = 0, len = this.length; i < len; ++i) {  
	      fn.call(scope || this, this[i], i, this);  
	    }  
	  }  
	}  
	
	
	if (!Function.prototype.bind) {
	  Function.prototype.bind = function (oThis) {
	    if (typeof this !== "function") {
	      // closest thing possible to the ECMAScript 5 internal IsCallable function
	      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
	    }
	
	    var aArgs = ext.slice(arguments, 1), 
	        fToBind = this, 
	        fNOP = function () {},
	        fBound = function () {
	          return fToBind.apply(this instanceof fNOP
	                                 ? this
	                                 : oThis,
	                               aArgs.concat(ext.slice(arguments)));
	        };
	
	    fNOP.prototype = this.prototype;
	    fBound.prototype = new fNOP();
	
	    return fBound;
	  };
	}
	
	//similar to Func.bind, but executes the function automatically after a delay.
	if(!Function.prototype.bindDelay) {
		Function.prototype.bindDelay = function(context, timeout /*, ...prefixArgs*/) {
			var _method = this;
			var _context = context;
			var _args = Array.prototype.slice.call(arguments, 2);
			return setTimeout( 
				function(/*...suffixArgs*/) {
					_method.apply(_context, _args);
				},
				timeout
			);
		};
	}
	
	
	
	//From Mozilla
	//https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/forEach
	if ( !Array.prototype.forEach ) {  
	  Array.prototype.forEach = function(fn, scope) {  
	    for(var i = 0, len = this.length; i < len; ++i) {  
	      fn.call(scope || this, this[i], i, this);  
	    }  
	  }  
	}  
	
	//shallow clone. 
	if ( !Array.prototype.clone ) {  
	  Array.prototype.clone = function() {  
		return ([]).concat(this);
	  }  
	}  
	

	
	
	
	
	//returns the last element in the array
	// or the index from the end as specified
	// e.g., foo.last(0) is the same as foo.last()
	// and foo.last(1) returns the 2nd last item.
	if ( !Array.prototype.last ) {  
	  Array.prototype.last = function(idx) {
	  	idx = (this.length-1) - (idx || 0);
		return (this.length > idx && idx >= 0) ? this[idx] : null;
	  }  
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
		Array.prototype.filter = function(fun /*, thisp */) {
			"use strict";
			if (this == null) {
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
	  Object.keys = (function () {
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
	        dontEnumsLength = dontEnums.length
	
	    return function (obj) {
	      if (typeof obj !== 'object' && typeof obj !== 'function' || obj === null) throw new TypeError('Object.keys called on non-object')
	
	      var result = []
	
	      for (var prop in obj) {
	        if (hasOwnProperty.call(obj, prop)) result.push(prop)
	      }
	
	      if (hasDontEnumBug) {
	        for (var i=0; i < dontEnumsLength; i++) {
	          if (hasOwnProperty.call(obj, dontEnums[i])) result.push(dontEnums[i])
	        }
	      }
	      return result
	    }
	  })()
	};
	
	
	if (!Array.prototype.find) {  
	    Array.prototype.find = function (key, value) {  
			for(var i = 0; i < this.length; ++i) {
				if(this[i][key] == value) { return {index:i, value:this[i]} ; }
			}
			return {index:NaN, value:null};
		}
	}
	
	
	
	//From Mozilla
	//https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf
	if (!Array.prototype.indexOf) {  
	    Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {  
	        "use strict";  
	        if (this == null) {  
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
	            } else if (n != 0 && n != Infinity && n != -Infinity) {  
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
	    }  
	}  
	
	
	//https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/map
	// Production steps of ECMA-262, Edition 5, 15.4.4.19  
	// Reference: http://es5.github.com/#x15.4.4.19  
	if (!Array.prototype.map) {  
	  Array.prototype.map = function(callback, thisArg) {  
	  
	    var T, A, k;  
	  
	    if (this == null) {  
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
	
	//made this up. does a push but always returns "this" array
	if (!Array.prototype.put) {  
		Array.prototype.put = function() {
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
		Array.prototype.punique = function() {
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
		Array.prototype.cloneExcept = function(/*items*/) {
			var items = ext.slice(arguments);
			return this.reduce(function(a,el) {
				return items.indexOf(el) < 0 ? a.put(el) : a;
			}, []);
		}
	}
	
	
	
	//DATE stuff from 
	//http://stackoverflow.com/questions/1643320/get-month-name-from-date-using-javascript
	Date.prototype.getMonthName = function(lang) {
	    lang = lang && (lang in Date.locale) ? lang : 'en';
	    return Date.locale[lang].month_names[this.getMonth()];
	};
	
	Date.prototype.getMonthNameShort = function(lang) {
	    lang = lang && (lang in Date.locale) ? lang : 'en';
	    return Date.locale[lang].month_names_short[this.getMonth()];
	};
	
	Date.locale = {
	    en: {
	       month_names: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
	       month_names_short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
	    }
	};


	return ext;
	
});
