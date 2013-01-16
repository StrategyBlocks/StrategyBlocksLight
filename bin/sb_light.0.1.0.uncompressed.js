/**
 * @version 0.1.0
 * 
 */


define('globals',['require'],function (require) {
	var globals = {
		version: (new Date()).getTime()	
	};
	
    var singleton = function () {
        return globals;
    };
    return singleton();
});



define('utils/ext',['../globals'], function(sb) {
	console.log("ext", sb.version);
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
		var str = ([(new Date()).toTimeString()]).concat(ext.slice(arguments)).join(" ");
		if(ext.ti()) {
			Ti.API.debug(str);
		} else if(typeof console !== "undefined") {
			console.log(str);	
		}
	};
	
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
	
		/************  TYPES ***************************/
	ext.isArray = function(obj) {
		return obj && (typeof obj.forEach === "function");		
	};
	ext.isString = function(obj) {
		return obj && (typeof obj === "string");		
	};
	
		/************  STRINGS  ***************************/
	ext.capitalize = function(s) {
		return s.charAt(0).toUpperCase() + s.slice(1);
	};
	
		/************  DATES ***************************/
	ext.parseDate = function(d) { return moment(d).toDate();	};
	ext.daysDiff = function(da, db) {return moment(db).diff(moment(da),"days")};
	ext.today = function() { return new Date(); };
	ext.minDate = function() { return ext.parseDate(ext.slice(arguments).sort(ext.sortDate)[0]); };
	ext.maxDate = function() { return ext.parseDate(ext.slice(arguments).sort(ext.sortDate).last()); };
	ext.serverDate = function(d) { return moment(d).format("YYYY/MM/DD"); };
	ext.userDate = function(d) { return moment(d).format("dddd, DD MMMM YYYY"); };
	
		/************  REGEXPS ***************************/
	ext.regEmail = new RegExp("([\\w-\\.]+)@((?:[\\w]+\\.)+)([a-zA-Z]{2,4})");
	
	
	
		/************  SORTING ***************************/
		//sort an array based on a property, and the function to use
		//so if an array is [{date:...,value:...},...], you can sort using ext.sortProp("date",ext.sortDate); 
	ext.sortFactory = function(prop, func, reverse) {
		return function(a,b) {	return func(a[prop],b[prop]) * (reverse ? -1 : 1);		};
	},
	ext.sortTime = function(a,b) { return ext.sortNumbers(ext.parseDate(a).getTime(), ext.parseDate(b).getTime()); }; 
	ext.sortNumbers = function(a,b){ return a-b; };
	ext.sortDate = function(a,b){ return ext.daysDiff(b,a); }; //reverse a,b because of daysDiff bias 
	ext.sortString = function(a,b){ return a.localeCompare(b); };
	 
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
	
	ext.mixin = function (/*Object*/ target, /*Object*/ source, ignore){
		var empty = ignore || {}; //default template for properties to ignore
		var name, s, i;
		for(name in source){
		    s = source[name];
		    if(!(name in target) || (target[name] !== s && (!(name in empty) || empty[name] !== s))){
		        target[name] = s;
		    }
		}
		return target; // Object
	};
	 
	// Create a new object, combining the properties of the passed objects with the last arguments having
	// priority over the first ones
	ext.combine = function(/*Object*/ obj, /*Object...*/ props) {
	    var newObj = {};
	    for(var i=0, l=arguments.length; i<l; i++){
	    	ext.mixin(newObj, arguments[i]);
	    }
	    return newObj;
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



define('utils/consts',['../globals'], function(sb) {

	var consts  =  {};
	
	consts.COLOR = {
		BLOCK: {
			"green":"#176717", 	
			"yellow":"#77771B", 	
			"red": 	"#641717"
		}
	};
	
	consts.STATE = {
			BLOCK: 					"block",
			BLOCK_TREE_ZOOM: 		"blockTreeZoom",
			BLOCK_MAP_ZOOM: 		"blockMapZoom",
			CHILD_BLOCK: 			"childBlock",
			BLOCK_SETTINGS_VIEW: 	"blockSettingsView",
			BLOCK_SETTINGS_COLLAPSE:"blockSettingsCollapse",
			BLOCKS_TREE_VIEW: 		"blocksTreeView",
			BLOCKS_MAP_VIEW: 		"blocksMapView",
			BLOCKS_TIMELINE_VIEW: 	"blocksTimelineView",
			MANAGE_BLOCK_VIEW: 		"manageBlockView",
			PAGE: 					"page",
			USER_ID: 				"userId",
			COMPANY_ID:				"companyId",
			COMPANY: 				"company",
			USER: 					"user",
			SESSION: 				"session",
			PREV_PAGE: 				"previousPage",
			PREV_BLOCK: 			"previousBlock"
			
	};
		
	
	consts.BLOCK_SETTINGS = {
			VIEW: {
				DEFAULT: 	{name: "Default", 	key: "bd"},
				STATUS: 	{name: "Status", 	key: "bs"},
				PROGRESS: 	{name: "Progress", 	key: "bp"},
				HEALTH: 	{name: "Health", 	key: "bh"},
				KPI: 		{name: "Outputs", 	key: "bk"},
				RISK: 		{name: "Risk", 		key: "br"},
				NPV: 		{name: "Value", 	key: "bn"}
			},
			COLLAPSE: "c"
	};
		
	consts.BLOCKS_MAP = {
			VIEW: {
				RADIAL: "radial",
				HIERARCHY: "hierarchy"
			}
	};
	
	consts.BLOCKS_TREE = {
			VIEW: {
				STATUS: 	"status",
				PROGRESS: 	"progress",
				HEALTH: 	"health",
				KPI: 		"outputs",
				RISK: 		"risk",
				NPV: 		"value"
			}
	};
	
	consts.BLOCKS_TIMELINE = {
		VIEW: {
			CHART:		"chart",
			TABLE:		"table"
		}
	};
	
	consts.MANAGE_BLOCK = {
		VIEW: {
			BLOCK:			"block",
			NEW_CHILD:		"newChild",
			EDIT_CHILD:		"editChild",
			CHILDREN_LIST:	"childrenList",
			NEW_LINK:		"newLink",
			EDIT_LINK:		"editLink"
		}
	};
		
		
	consts.SIZES = {
		BLOCK_WIDTH: 350,
		BLOCK_HEIGHT: 185,
		BLOCK_HEIGHT_SMALL: 150,
		BLOCK_PADDING_X: 80,
		BLOCK_PADDING_Y: 90
	};

	return consts;
	
});

/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype
define('utils/Class',[],function(){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
  // The base Class implementation (does nothing)
  this.Class = function(){};
  
  // Create a new Class that inherits from this class
  Class.extend = function(prop) {
    var _super = this.prototype;
    
    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;
    
    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] == "function" && 
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;
            
            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];
            
            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);        
            this._super = tmp;
            
            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }
    
    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }
    
    // Populate our constructed prototype object
    Class.prototype = prototype;
    
    // Enforce the constructor to be what we expect
    Class.prototype.constructor = Class;

    // And make this class extendable
    Class.extend = arguments.callee;
    return Class;
  };
	return (Class);
});




define('models/_abstractModel',['../utils/Class'], function( Class ) {

	var Abstract = Class.extend({
		name: null,
		_sb:null,
		_model: null,
		_modelArray: null,
		_urlDef: null,
		_selectQueue: null,
		_subscriptions:null,
	
		init: function(sb, name, urlDef) {
			if(!name) { throw new Error("AbstractModel: Model name must be declared"); }
			if(!urlDef) { throw new Error("AbstractModel: Model urlDef must be declared"); }
			
			this._sb = sb;
			this.name = name;
			this._urlDef = urlDef;
			this._selectQueue = [];
			this._subscriptions = [];
			
			this._sb.state.register(this, this._urlDef, this._handleUpdate.bind(this));
		},
	
		reset: function(publish) {
			this._model = null;
			this._modelArray = null;
			this._sb.state.resetTimestamp(this.name);
			if(publish) {
				this._publish();
			}
		},
		
		isValid: function() {
			return this.get() != null;
		},
	
		get: function() {
			if(!this._model) {
				this._sb.ext.debug("Getting the " + this.name + " model.");
				if(this._sb.state.authorized() ) {
					this._sb.ext.debug("Forcing the update");
					this._sb.state.forceModelUpdate(this);
				}
				return null;
			} 
			return this._modelArray;
		},
		
		raw: function() {
			return this._model;
		},
		rawArray: function() {
			return this._modelArray;
		},
	
		subscribe: function(cb) {
			this._subscriptions.put(cb);
			var m = this.get();
			if(m) {
				cb(m);	
			}
		},
	
		//this only works when the function is the same instance as the subscription
		//so if you use "func.bind" for you callback, you need to store the bound function 
		//to use for the unsubscribe
		unsubscribe:function(cb) {
			var idx = this._subscriptions.indexOf(cb);
			if(idx >= 0) {
				this._subscriptions.splice(idx,1);
			}		
		},
		
		_publish: function() {
			var m = this.get();
			this._subscriptions.forEach(function(cb) {
				cb.bindDelay(null, 50, m);
			});	
		},
		
		//one-off selection that will wait until the model is available.
		select: function(type, cb, func) {
			this._selectQueue.push({type:type, cb:cb, func:func});
			this._processQueue();
		},	
		
		/*************************************************************
			This is expecting the response to be a map with the following keys: {
				"deleted": Array of ids that have been deleted since the last request. They do not have to exist the our
							view of the model.
				"added":  Map of objects that have been added to the company since our last update
				"updated": Map of objects that have been changed since our last update. 
				"timestamp": ms since epoch that the model was changed.
				NOTE: most of the time added/updated are effectively the same result, but the intention was
						to be able to treat the objects differently if we wanted to.
		
		**************************************************************/
		_handleUpdate: function(response) {
			this._processResponse(response);
			if(!this._model) { 
				return;
			} 
			this._publish();
			this._processQueue();
		},
		
		_processQueue: function() {
			var data = this.get();
			if(!data) { return; }
			
			while(this._selectQueue.length) {
				var sel = this._selectQueue.pop();
				switch(sel.type) {
					case "map": 	sel.cb(this._model); break;					//raw map
					case "all": 	sel.cb(data); break;						//array -- unsorted
					case "filter": 	sel.cb( data.filter(sel.func) ); break; 	//run array through a filter
				} 
			}
			
		},	
		
		_processResponse: function(data) {
			this._model = this._model || {};
			
			this._sb.ext.debug("Processin Model", this.name);
			
			//The following order assumes a faulty server and ensures we don't update  or delete missing
			//items.
			this._addItems(data.added);
			
			this._updateItems(data.updated);
			
			this._deleteItems(data.deleted);
			
			this._massageUpdatedModel();
			
			this._resetArrayCache();
		},
	
		
		_addItems: function(added) {
			added = added || {};
			for (var k in added) {
				this._model[k] = added[k];
			}
		},
		
		_updateItems: function(updated) {
			updated  = updated || {};
			for (var k in updated) {
				this._model[k] = updated[k];
			}
		},	
		
		_deleteItems:function(deleted) {
			var model = this._model;
			deleted = deleted || [];
			var self =this;
			deleted.forEach(function(v) {
				if(model[v]) {
					self._sb.ext.debug("Deleting Model", self.name, v);
				}
				delete model[v];
			});
		},
		
		//usually override by the model subclasses to provide some post-processing on the model elements before consumption 
		//by a view
		_massageUpdatedModel: function() {
			
		},
		
		//build an array cache of the model to make list-fetches / iterations / sorting quicker. 
		//but preserve the model as a map for key-value queries
		_resetArrayCache:function() {
			this._modelArray = this._sb.ext.map(this._model, function(v, k) { return v; });
			//this._sb.ext.debug(this.name, this._modelArray.length);
		}
	});
	return Abstract;
});



define('models/tagsModel',['./_abstractModel'], function( _Model ) {

	var Model = _Model.extend({
		init: function(sb) {
			this._super(sb, "tags", sb.urls.MODEL_TAGS);
		}
	});
	return Model;	
});


define('models/newsModel',['./_abstractModel'], function( _Model ) {

	var Model = _Model.extend({
		init: function(sb) {
			this._super(sb, "news", sb.urls.MODEL_NEWS);
		},
		
		
		
		//usually override by the model subclasses to provide some post-processing on the model elements before consumption 
		//by a view
		_massageUpdatedModel: function() {
			this._super();
			// for(var k in this._model) {
			// }
		}
	});	
	return Model;
});




define('models/usersModel',['./_abstractModel'], function( _Model ) {

	var Model = _Model.extend({
		init: function(sb) {
			this._super(sb, "users", sb.urls.MODEL_USERS);
		},
		_massageUpdatedModel: function() {
			this._super();
			
			for(var i in this._model) {
				var u = this._model[i];
				u.name = u.first_name + " " + u.last_name;
			}
		}
	});	
	return Model;
});



define('models/blocksModel',['./_abstractModel'], function( _Model ) {

	var Model = _Model.extend({
		_progress: null,
		_health: null,
		_npv: null,
		_npv_queue:null,
		_progress_queue:null,
		_health_queue:null,
		
		_properties: null,
		_propertiesList: ["comments","news","tags","documents", "context", "watching_users"],
	
		init: function(sb) {
			this._npv_queue = [];
			this._progress_queue = [];
			this._health_queue = [];
			this._properties = {};
			
			this._super(sb, "blocks", sb.urls.MODEL_BLOCKS);
		},
		
		_handleUpdate: function(update) {
			this._progress = null;
			this._health = null;
			this._npv = null;
			
			this._super(update);
		},
		
		//usually override by the model subclasses to provide some post-processing on the model elements before consumption 
		//by a view
		_massageUpdatedModel: function() {
			this._super();
			var root = this._model[this._sb.state.value("company").root_block.id];
			this._massage(root, null, 0, (new Date()).getTime());
			this._sb.ext.debug("Finished massaging blocks");
		},
		
		
		progress: function(cb) {
			this._data(cb, "_progress", this._sb.urls.BLOCKS_PROGRESS);
		},
		health: function(cb) {
			this._data(cb, "_health", this._sb.urls.BLOCKS_HEALTH);
		},
		npv: function(cb) {
			this._data(cb, "_npv", this._sb.urls.BLOCKS_NPV);
		},
			
		comments: function(id, cb, force) {	this._property(cb, "comments", id, force);		},
		news: function(id, cb, force) {		this._property(cb, "news", id, force);		},
		tags: function(id, cb, force) {		this._property(cb, "tags", id, force);		},
		documents: function(id, cb, force) {	this._property(cb, "documents", id, force);		},
		context: function(id, cb, force) {		this._property(cb, "context", id, force);		},
		watching: function(id, cb, force) {		this._property(cb, "watching_users", id, force);		},
		
		_property: function(cb, type, id, force) {
			if(this._propertiesList.indexOf(type) >= 0) {
				this._properties[type]  =  this._properties[type] || {};
				if(!this._properties[type][id] || force) {
					this._properties[type][id] = "waiting";
					
					//add callback to queue
					this._properties[type+"_queue"] = this._properties[type+"_queue"] || {};
					this._properties[type+"_queue"][id] =  this._properties[type+"_queue"][id] || [];
					this._properties[type+"_queue"][id].push(cb);
					
					this._sb.controller.invoke(this._sb.urls.BLOCKS_PROPERTIES, {id:id, type:type}, this._handleProperty.bind(this, type,id));
				} else if ( this._properties[type][id] == "waiting") {
					this._properties[type+"_queue"][id].push(cb);
				} else {
					cb(this._properties[type][id]);
				}
			} else {
				throw new Error("BlockModel property is not valid:" + type);
			}
		},
		
		//push all requests onto the queue and only invoke the controller if it's the first one and we don't have data
		_data: function(cb, name, url) {
			var func = this._handleData.bind(this,name );
			this[name+"_queue"].push(cb);
			
			if (!this[name]) {
				if(this[name+"_queue"].length == 1) {
					sb.controller.invoke(url, null, func);
				}
			} else {
				func();
			}
		},
		
		//process the queue for the data.
		_handleData: function(name, data) {
			this[name] = data ? data.result : this[name];
			while(this[name+"_queue"].length) {
				var cb = this[name+"_queue"].pop();
				cb(this[name]);
			}
		},
		
		//process the properties
		_handleProperty: function(type, id, data) {
			this._properties[type] = this._properties[type] || {};
			this._properties[type][id] = data ? data.result : this._properties[type][id];
			
			while(this._properties[type+"_queue"][id].length) {
				var cb = this._properties[type+"_queue"][id].pop();
				cb(this._properties[type][id]);
			}
		},
		
		
		_massage: function(b, ppath, depth, schema) {
			var cleanup = b._schema != schema;
			b._schema = cleanup ? schema : b._schema;
			
			b.paths = (!cleanup && b.paths) || [];
			b.children = b.children || [];
			
			var p = ppath ? this._model[ppath.last()] : null;
			if(p) {
				var pel =  b.parents.find("parent_id", p.id).value;
				var dpel = b.parents.find("linked_parent_id", null).value;
				pel.position = p.children.indexOf(b.id);
				pel.level = depth;
				
				b.paths.put(ppath.concat([b.id]));
				if(p.id == dpel.parent_id) {
					b.default_path = b.paths.last();
					b.default_parent = p.id;
					b.default_level = depth;
					b.default_position = pel.position;
				} 
				if(p.is_owner) {
					pel.can_move_left = pel.position > 0;
					pel.can_move_right = pel.position < (p.children.length-1) && p.children.length > 1;
					pel.can_delete = true;
				}
			} else {
				b.default_path = [b.id];
				b.default_parent = null;
				b.paths.put([b.id]);
				b.default_position = 0;
				b.default_level = 0;
			}
			
			var bpath = b.paths.last();
	
			for (var i = 0; i < b.children.length; ++i) {
				this._massage(this._model[b.children[i]], bpath, depth+1, schema);
			}
		},
		_resetArrayCache:function() {
			this._super();
			this._modelArray.sort(this._sb.ext.sortBlocksByProgress);
			//this._sb.ext.debug(this.name, this._modelArray.length);
		}
	});
	
	return Model;		
});




define('models/levelsModel',['./_abstractModel'], function( _Model ) {

	var Model = _Model.extend({
		init: function(sb) {
			this._super(sb, "levels", sb.urls.MODEL_LEVELS);
		}
	});	
	return Model;
});


define('models/focusModel',['./_abstractModel'], function( _Model ) {

	var Model = _Model.extend({
		init: function(sb) {
			this._super(sb, "focus", sb.urls.MODEL_FOCUS);
		}
	});	
	return Model;	
});


define('models/risksModel',['./_abstractModel'], function( _Model ) {

	var Model = _Model.extend({
		init: function(sb) {
			this._super(sb, "risks", sb.urls.MODEL_RISKS);
		}
	});
	return Model;	
});


define('models/kpisModel',['./_abstractModel'], function( _Model ) {

	var Model = _Model.extend({
		init: function(sb) {
			this._super(sb, "kpis", sb.urls.MODEL_KPIS);
		}
	});
	return Model;	
});




define('models/groupsModel',['./_abstractModel'], function( _Model ) {

	var Model = _Model.extend({

		init: function(sb) {
			this._super(sb, "levels", sb.urls.MODEL_GROUPS);
		}
	});
	
	return Model;	
});




define('models/companiesModel',['./_abstractModel'], function( _Model ) {

	var Model = _Model.extend({
		
		init: function(sb) {
			this._super(sb, "companies", sb.urls.MODEL_COMPANIES);
		}
	});	
	return Model;
});


define('models/timezonesModel',['./_abstractModel'], function( _Model ) {

	var Model = _Model.extend({
		init: function(sb) {
			this._super(sb, "timezones", sb.urls.MODEL_TIMEZONES);
		},
		
		_processResponse: function(data) {
			this._sb.ext.debug("Handle Timezone response");
			this._super(data);
			this._sb.ext.debug("Done Handle Timezone response", this._model);
		},
		
		get:function() {
			this._sb.ext.debug("Getting Timezones.");
			var m = this._super();
			this._sb.ext.debug("Done Getting Timezones.", m);
			return m;	
		}
	});
	
	return Model;	
});






define('models',[
	'./globals',
	'./models/tagsModel',
	'./models/newsModel',
	'./models/usersModel',
	'./models/blocksModel',
	'./models/levelsModel',
	'./models/focusModel',
	'./models/risksModel',
	'./models/kpisModel',
	'./models/groupsModel',
	'./models/companiesModel',
	'./models/timezonesModel'
], function(sb, tags,news,users,blocks,levels,focus,risks,kpis,groups,companies,timezones) {
	
	var _models = {
		tags:		{klass:tags},
		news:		{klass:news},
		users:		{klass:users},
		blocks:		{klass:blocks},
		levels:		{klass:levels},
		focus:		{klass:focus},
		risks:		{klass:risks},
		kpis:		{klass:kpis},
		groups:		{klass:groups},
		companies:	{klass:companies},
		timezones:	{klass:timezones}
	};
	
	var models = {};
	
	models.reset = function(publish) {
		for(var mn in _models) {
			var m = _models[mn] ? _models[mn].model : null;
			if(m) { m.reset(publish); }
		}
	},
	models.get = function(modelName) {
		var m = _verifyModel(modelName);
		return m.model;
	},
	
	//adds a callback watcher. 
	//returns whether the model is valid or not. 
	models.subscribe = function(modelName,  cb) {
		var m = _verifyModel(modelName);
		m.model.subscribe(cb);
	},
	
	models.unsubscribe = function(modelName, cb) {
		var m = _verifyModel(modelName);
		m.model.unsubscribe(cb);
	},
	
	
	models.rawArray = function(modelName) {
		var m = _verifyModel(modelName);
		if(m.model) {
			return m.model.rawArray();
		}
	},
	
	models.raw = function(modelName) {
		var m = _verifyModel(modelName);
		if(m.model) {
			return m.model.raw();
		}
	},
	
	//one-off selection that will wait until the model is ready
	models.select = function(modelName, type, cb, func) {
		var m = _verifyModel(modelName);
		if(m.model) {
			sb.ext.debug("Doing a select on the model.", modelName);
			m.model.select(type, cb, func);
		}
	},
	
	models.isValid = function(modelName) {
		var m = _verifyModel(modelName);
		var valid = false; 
		if(m.model) {
			valid =  m.model.isValid();
		}
		return valid;
	}
	
	function _verifyModel (modelName) {
		var m = _models[modelName];
		if(!m) {
			throw new Error("sb.appModel.js: Model name not found: " + modelName);
		}
		if(!m.model) {
			m.model = new (m.klass)(sb);
		}

		return m;
	}
	
	
	return models;
	
});




define('controller',['./globals'], function(sb) {

	var controller = {};

	controller.invoke = function(urlObj, args, successCb, errorCb, stateCheck) {
		var url = sb.urls.url(urlObj, args);
		var params = {};
		
		if (urlObj.deleteId) {
			delete args.id;
		}
		
		var requestArgs = urlObj.massageParamsFunc ? sb.urls[urlObj.massageParamsFunc](args) : args;
		
		if (requestArgs != null) {
			if (requestArgs instanceof Array) {
				params.json = JSON.stringify(requestArgs);
			}
			else if (Object.keys(requestArgs).length > 0) {
				if (urlObj.normalParams) {
					params = requestArgs;
				}
				else {
					params.json = JSON.stringify(requestArgs);
				}
			}
		}
		
		sb.api.request(url, params, urlObj.post || true, successCb, errorCb, stateCheck||null);
	};
	
	
	controller.forgotPassword =  function(email,cb,errCb) {
		controller.invoke(sb.urls.LOGIN_FORGOT_PASSWORD, {username:email}, cb,errCb, sb.state.invalid);
	};
	
	controller.blockComment = function(id, message, cb) {
		controller.invoke(sb.urls.COMMENT_PROPERTIES_ADD, {id:id, body:message}, cb,cb);
	};
	controller.blockClose = function(id, closeObj, cb) {
		//{"rating":[0-5], "comment":String}
		controller.invoke(sb.urls.BLOCKS_CLOSE, sb.ext.mixin({id:id}, closeObj), cb,cb);
	};
	controller.blockPublish = function(id, children, cb) {
		//children:bool
		controller.invoke(sb.urls.BLOCKS_MAKE_PUBLIC, {id:id, children:children}, cb,cb);
	};
	controller.changeDefaultCompany = function(id,cb, errCb) {
		controller.invoke(sb.urls.USERS_CHANGE_DEFAULT_COMPANY, {id:sb.state.value("userId"),default_company_id:id}, cb,errCb);
	};
	
	
	return controller;
});



define('api/state',['../globals'], function(sb) {
	console.log("State:",sb.version);
	var state = {
		session_unknown: 0,
		session_normal: 1,
		session_payment:  2,
		session_invalid: 3,
		session_disconnected: 4	
	};
		

	var _state = {
		page:"",
		block:null,		//normally block path
		news:null,		//news item id		
		kpi:null,		//kpi  id		
		risk:null,		//risk id		
		tag:null,		//tag id		

		userId:null,
		companyId:null,
		company: null,
		user: null,
		
		session: 0,
		url:"",

		
		childBlock:null,		
		
		blockTreeZoom:1,
		blockMapZoom:1,
		blockSettingsView: "",
		blockSettingsCollapse: "",
		blocksTreeView: "progress",
		blocksMapView: "radial",
		blocksTimelineView: "chart",
		manageBlockView: "block",
				
				
		previousBlock:null,
		previousPage:null
	};
	
	
	var _forceUpdateBuffer = {};
	var _forceUpdateBusy = {};
	var _stateFunctions = {};
	
	//the url definition. The order of the url parts will be consistent with this list.
	var _urlParts = ["page", "block", "childBlock", "blocksTreeView","blocksMapView","blocksTimelineView","manageBlockView"]; 
	
	
	state.host = "";
	state.models = {};
	state.subscriptions = {};
	
	state.session = state.session_unknown;
	
		
	//accepts several value types specified by: sb.urls.url_to_o
	//RETURNS: The string form of the url.
	state.url = function(value) {
		//update the url
		if(value !== undefined) { 
			value = typeof value == "string" ? sb.url.url_to_o(value) : value;
			sb.ext.each(value, function(k, v) {
				state.value(k,v, false);
			});
			state.publish("url");
		}
	
		return "#"+_urlParts.reduce(function(prev, el) {
			val = state.value(el);
			if(val !== null && val !== undefined) {
				return prev.put([el, state.value(el)].join("="));
			} 
			return prev;
		}, []).join(";");
	};
	
	state.register = function(model, urlDef, cb) {
		if(!state.models[model.name]) {
			state.models[model.name] = {timestamp:0, cb:cb, urlDef:urlDef};
			if(state.authorized() && !_forceUpdateBuffer && !_forceUpdateBuffer[model.name]) {
				//if we do a bunch of these at the same time, only run the first. The others will get picked up.
				_forceUpdateBuffer[model.name] = _forceModelUpdate.bindDelay(state, 200, model);
			}
		} 
	};
	
	state.resetTimestamp = function(name) {
		if(state.models[name]) {
			state.models[name].timestamp = 0;	
		}
	};
	
	state.login = function(uname, pword, cb, errCb) {
		var params = null;
		if(uname && pword) {
			params = { username:uname, password: pword };
		}
		sb.api.post(sb.urls.url(sb.urls.LOGIN), params, cb, errCb, state.unauthorized);
	};
	
	state.logout = function() {
		sb.api.post(sb.urls.url(sb.urls.LOGOUT));
		state.session = state.session_unknown;
	};
	
	state.changeCompany = function(cid) {
		state.session = state.session_unknown;
		sb.models.reset(false);

		sb.api.post(sb.urls.url(sb.urls.LOGIN), {company_id:cid});
	};
	
	state.forceModelUpdate = function(model) {
		if(_forceUpdateBuffer[model.name]) {
			clearTimeout(_forceUpdateBuffer[model.name]);
			_forceUpdateBuffer[model.name] = null;
		}
		
		if(!_forceUpdateBusy[model.name] && state.authorized()) {
			_forceUpdateBusy[model.name] = true;
			var m = state.models[model.name];
			m.timestamp = 0;
			//request the model directly, but we will only process the high level model elements
			// IF THOSE HLM elements exist
			var url = sb.urls.url(m.urlDef);
			var cb = _handleModelResponse.bind(state,model);
			sb.api.get(url, null, cb);
		}
	};
	
	
	state.any = function() { 		return true; };
	
	//not tried auth yet. 
	state.unknown = function() {	return _state.session == state.session_unknown;	};
	//no auth
	state.unauthorized = function() {	return  _state.session == state.session_unknown || _state.session == state.session_invalid;	};
	//invalid
	state.invalid = function() {	return  _state.session == state.session_invalid;	};
	//has user/company
	state.authorized = function() {	return _state.session == state.session_normal || _state.session == state.session_payment; };	
	
	//returns true / false depending on whether the response session is valid
	state.update = function(data) {
		_updateSession(data);
		_updateModels(data);
		state.publish.bindDelay(state, 50, "session");
		return state.authorized();
	};
	
	state.setDisconnected = function() {
		_state.session = state.session_disconnected;
		state.publish.bindDelay(state, 50, "session");
	};
	
	//setter/getter
	//supports "State.value()" to determine the current session state
	// or normally: "sb.state.value("block") for fetching current block path. 
	state.value = function(type, val, publishUrl) {
		if(val !== undefined && _state[type] != val) {
			var from = _state[type];
			var func = _stateFunctions[type];
			var newVal = func ? func(from||null,val) : val;
			//$sblog("Setting Type: ", type, " To ", newVal, "Original:", from);
			if(type == "url") { throw "Please use State.url to change the url object directly."; }
			_state[type] = newVal;
			
			//publish is timeout delayed, so the state functions should execute before any notifications
			state.publish(type);
			
			if(_urlParts.indexOf(type) > -1) {
				_state.url = state.url();
				if(publishUrl !== false) {
					state.publish("url");
				}
			}
		}
		return _state[type];
	};
	
	state.clone = function() {
		return sb.ext.mixin({}, _state);
	};
	
	//only used for settings where we want to check the single value in a group of many
	//e.g., State.value(type) = <key 1>!<value 1>-<key 2>!<value 2>-...
	// 1223_232_222!bp-2232-223-233!bk-...
	state.getValueKey = function(type, key) {
		//$sblog("Get Value Key: ", type, key);
		var val = sb.urls.s_to_o(state.value(type));
		return val[key] || null;
	};
	
	state.setValueKey = function(type, key, value) {
		var val = sb.urls.s_to_o(state.value(type));
		if(value == null) {
			delete val[key];
		} else {
			val[key] = value;
		}
		state.value(type, sb.urls.o_to_s(val));
	};
	
	state.subscribe = function(type, cb) {
		console.log(sb.version);
		sb.ext.debug("subscribing to: ", type);
		state.subscriptions[type] = state.subscriptions[type] || [];
		
		state.subscriptions[type].push(cb);
	};

	/**
	*	This will not work unless the function definition
	*	has not changed. E.g., if you create a temporary
	*	function using func.bind, then you need to store
	*	that instance and use it for unsubscribing
	*/
	state.unsubscribe = function(type, cb) {
		var idx = state.subscriptions[type].indexOf(cb);
		if (idx > -1) {
			state.subscriptions[type].splice(idx, 1);
		}  
	};

	state.publish = function(type) {
		var list = state.subscriptions[type] || [];
		var value = state.value(type);
		var ext= sb.ext;
		list.forEach(function(v) {
			if(type.indexOf("Zoom") > -1) {
				ext.debug("Publish Zoom: ", type, value);
				v.bindDelay(null, 0, value);
			} else {
				ext.debug("Publish: ", type, value);
				v.bindDelay(null, 50, value);
			}
			
		});
	};
	
	state.addTimestamps = function(params) {
		sb.ext.debug("Adding timestamp for ", Object.keys(state.models).join(","));
		
		for (var m in state.models) {
			params[m+"_timestamp"] = state.models[m].timestamp;
		}
	};

	function _updateSession (data) {
		if(data) {
			var uid = data.user ? data.user.id : null;
			var cid = data.company ? data.company.id : null;
			if(uid != _state.userId || cid != _state.companyId) {
				_state.userId = data.user ? data.user.id : null;
				_state.companyId = data.company ? data.company.id : null;
			}
			if(_state.block == null && data.block != null) {
				//delay so notification happens after the session is valid
				_state.block = String(data.block);
			}
		} else {
			_state.userId = _state.companyId = null;
			_state.user = _state.company = null;
		}
		if(state.value("userId") == null) {
			sb.ext.debug("setting session to unauthorized");
			_state.session =  state.session_invalid;
		} else {
			_state.company = data.company;
			_state.user = data.user; 
			if (data.company && data.company.license && data.company.license.status =="expired") {
				sb.ext.debug("setting session to payment");
				_state.session =  state.session_payment;
			} else {
				sb.ext.debug("setting session to normal");
				_state.session =  state.session_normal;
			}
		}
		
		if(!state.authorized()) {
			sb.models.reset();
		}
	}
	
	function _updateModels (data) {
		for (var m in state.models) {
			if(data && data[m]) {
				_forceUpdateBusy[m] = _forceUpdateBuffer[m] = null;
				state.models[m].timestamp = data[m].timestamp;
				state.models[m].cb(data[m]);
			}
		}	
	}


	//Handle the response from a model which doesn't use timestamps. 
	function _handleModelResponse (model, result) {
		var res = result && result.result;
		var m = res[model.name] || res;
		
		if(model.raw() == null && m) {
			if(sb.ext.isArray(m)) {
				m = m.reduce( (function(prev,el) { 
					prev[el.id] = el;
					return prev;
				}), {});	
			}
			model._handleUpdate({added:m});
		}
		_forceUpdateBusy[model.name] = false;
	}
		
	function _handleBlockChange (oldVal, newVal) {
		state.value.bindDelay(state, 0, "previousBlock", oldVal);
		return sb.queries.blockPath(newVal).join("_");
	}
	function _handlePageChange (oldVal, newVal) {
		oldVal = oldVal || "home";
		state.value.bindDelay(state, 0, "previousPage", oldVal);
		sb.ext.debug("HandlePageChange: ", oldVal, " to ", newVal);
		return newVal;
	}
	

	return state; 	
	
});







/*************************
	These functions assume that the models you need have been 
	fetched and are up to date in "sb.models"
	They're intended to be convenience functions that exploit the global
	nature of the models. 
************************/

define('api/queries',['../globals'], function(sb) {
	
	
	var q = {};
	
	/********************************
		COMPANIES
	*********************************/
	q.company = function(cid) {
		var cs = sb.models.raw("companies");
		cid = cid || sb.state.value("companyId");
		return (cs && cid && cs[cid] ) || null; 
	};
	
	
	/********************************
		USERS
	*********************************/
	q.fullname = function(uid) {
		var us = sb.models.raw("users");
		return us && uid && us[uid] ? us[uid].name : null;
	};
	q.currentUser = function() {
		var us = sb.models.raw("users");
		return (us && us[sb.state.value("userId")] ) || null;
	};
	q.user = function(uid) {
		var us = sb.models.raw("users");
		return us[uid];	
	};
	q.companyMembership = function(cid) {
		var u = q.currentUser();
		return (cid && u && u.companies[cid]) || null;
	}; 
	q.userDate = function(date, opts) {
		var u = q.currentUser();
		return sb.moment(date, opts).format(u.date_format);	
	
	};
	var _serverDateFormat =  "YYYY/MM/DD";
	q.userToServerDate = function(date, opts) {
		var u = q.currentUser();
		var m = sb.moment(date, u.date_format);
		return m.format(_serverDateFormat);
	};
	
	q.authors  = function() {
		var cid = sb.state.value("companyId");
		return sb.models.rawArray("users").filter(function(el) {
			var cm = (el.companies && Object.keys(el.companies).length && el.companies[cid] ) || null;
			return cm && cm.active && (cm.role == "Author" || cm.role =="Administrator");
		}).sort(sb.ext.sortUsers);
	};
	
	/********************************
		FOCUS AREAS
	*********************************/
	q.focusArea = function(fid) {
		var fs = sb.models.raw("focus");
		return fs && fs[fid] ? fs[fid].title : null;
	};
	q.focusAreaDesc = function(fid) {
		var fs = sb.models.raw("focus");
		return fs && fs[fid] ? fs[fid].description : null;
	};
	
	/********************************
		Levels
	*********************************/
	q.levelColor = function(id) {
		var ls = sb.models.raw("levels");
		var c = ls && ls[id] ? ls[id].color : null; 
		return c ? sb.ext.to_color(c) : null;
	};
	q.levelName = function(fid) {
		var ls = sb.models.raw("levels");
		return ls && ls[id] ? ls[id].title : null;
	};
	q.levelPos = function(fid) {
		var ls = sb.models.raw("levels");
		return ls && ls[id] ? ls[id].title : null;
	};
	


	/********************************
		NEWS
	*********************************/
	
	q.currentNewsItem = function() {
		var id = sb.state.value("news");
		var model = sb.models.raw("news");
		
		return model && id ? model[id] : null;	
	};
	
	var _newsMsgRE = /%(users|blocks)_(\d+)%/g;
	q.newsMessage = function(n) {
		var re= _newsMsgRE;
		var blocks = sb.models.raw("blocks");
		var users = sb.models.raw("users");
		
		return n.msg.replace(re, function(match,type, id) {
			if(type == "blocks") {
				return blocks[id] ? blocks[id].title : "(unknown block)"; 
			}
			if(type == "users") {
				return users[id] ? users[id].name : "(unknown user)";
			}
		});	
	};
	
	var _newsUsersRE = /%users_(\d+)%/g;
	q.newsUsers = function(n) {
		var re = _newsUsersRE;
		var users = [];
		var match = null;
		do {
			if(match) { users.push(match[1]); }
			match = re.exec(n.msg);
		} while(match);
		return users;
	};
	
	var _newsBlocksRE = /%blocks_(\d+)%/g;
	q.newsBlocks = function(n) {
		var re = _newsBlocksRE;
		var blocks = [];
		var match = null;
		do {
			if(match) { blocks.push(match[1]); }
			match = re.exec(n.msg);
		} while(match);
		return blocks;
	};
	
	

	/********************************
		BLOCKS
	*********************************/
	q.currentBlock = function() {
		return q.block(q.currentBlockId()); 
	};
	q.previousBlock = function() {
		return q.block(q.previousBlockId()); 
	};
	q.rootBlock = function() {
		var c= sb.state.value("company");
		return c ? q.block(c.root_block.id) : null; 
	};
	q.currentBlockId = function() {
		var p = q.currentBlockPath(); 
		return (p && p.length) ? p.last() : null;
	};
	q.previousBlockId = function() {
		var p = q.previousBlockPath(); 
		return (p && p.length) ? p.last() : null;
	};
	q.currentBlockPath = function(str/*==false*/) {
		return q.blockPath(sb.state.value("block"), str);
	};
	q.currentBlockLevel = function() {
		return q.blockLevel(q.currentBlockPath());		
	};
	q.previousBlockPath = function(str/*==false*/) {
		var pp = sb.state.value("previousBlock") || sb.state.value("company").root_block.id;
		return q.blockPath(pp, str);
	};
	q.previousBlockLevel = function() {
		return q.blockLevel(q.previousBlockPath());		
	};
	q.managedBlocks = function() {
		return sb.models.rawArray("blocks").reduce(function(pre, el) {
			if(el.is_manager) {
				return pre.put(el);
			} 
			return pre;
		}, []);
	};
	q.parentPath = function(bpath, str/*==false*/) {
		bpath = q.blockPath(bpath);
		return q.blockPath(bpath.slice(0,-1), str);
	};
	q.blockParentInfo = function(bpath) {
		bpath = q.blockPath(bpath);
		var b = q.block(bpath);
		if(b && b.parents && b.parents.length) {
			return b.parents.find("parent_id", bpath.last(1)).value;
		}
		return null;	
	};
	
	q.blockPath = function(bpath, str/*==false*/) {
		bpath = _pathToArray(bpath);
		var b = q.block(bpath);
		if(b && bpath.length < 2 && b.parents.length > 0) {
			bpath = b.default_path;
		}
		return str ? bpath.join("_") : bpath;
	};

	var _pathToArray = function(bpath) {
		if(typeof bpath == "array") { return bpath; }
		if(typeof bpath == "number") { return [String(bpath)]; }
		if(typeof bpath == "string") { return bpath.split("_"); }
		return bpath;
	};
	
	q.blockId = function(bpath) {
		bpath = _pathToArray(bpath);
		return (bpath && bpath.length) ? bpath.last() : null;
	};
	
	q.block = function(bpath) {
		var bid = q.blockId(bpath);
		var blocks = sb.models.raw("blocks");
		return bid && blocks && blocks[bid] ? blocks[bid] : null;
	};
	
	q.blockLevel = function(bpath) {
		var pinfo = q.blockParentInfo(bpath||q.currentBlockPath());
		return pinfo ? pinfo.level : 0;
	};
	
	q.childrenPaths = function(bpath, str/*==false*/) {
		//array, so we can concat
		bpath = q.blockPath(bpath);
		var b= q.block(bpath);
		//concat each child id to the bpath array and return using internal blockPath function, passing the "str" option. 
		return b ? 
				b.children.map(function(el) { return q.blockPath(bpath.concat([el]), str); }) :
				null; 
		
	};
	q.parentPaths = function(bpath, str/*==false*/) {
		var b= q.block(bpath);
		return b.paths.reduce(function(prev,el) {
					var pp =  sb.queries.parentPath(el, str);
					return pp && pp.length  ? prev.put(pp) : prev;
		}, []);
	};
	
	//includes siblings from *ALL* parents
	q.siblingPaths = function(bpath, str/*==false*/) {
		var b= q.block(bpath);
		return b.paths.reduce(function(prev,el) {
			var cp = sb.queries.childrenPaths(sb.queries.parentPath(el), str);
			if(cp) {
				cp = cp.filter(function(el) { 
					return sb.queries.blockPath(el,true) != sb.queries.blockPath(bpath,true); 
				});  
				return prev.concat(cp);
			} 
			return prev;
		}, []);
	};
	
	
	q.arePathsEqual = function(apath, bpath) {
		return q.blockPath(apath, true) == q.blockPath(bpath, true);
	};
	
	q.managers = function() {
		var companyId = sb.state.value("companyId");
		var users = sb.models.rawArray("users");
		
		var ret = users.reduce(function(pre, el) {
			var cm = el.companies[companyId];
			
			if(cm.role == "Author" || cm.role == "Administrator") {
				return pre.put(el);
			} 
			return pre;
		}, []);
		
		return ret;
	};
	
	q.maxDate = function() {
		return sb.ext.parseDate(q.rootBlock().end_date);
	};
	q.minDate = function() {
		return sb.ext.parseDate(q.rootBlock().start_date);
	};

	//returns the available range of dates for the date picker on this block
	// 1. Block cannot START earlier than its parent blocks
	// 2. Block cannot START later than its earliest child start date, or the parent's end date
	// 3. Block cannot  END before its parent's start date or it's latest child's end date.
	// 4. Block cannot END after its parent unless that parent it floating
	q.dateRange = function(b) {
		var dates = {
			minStart: moment(new Date(1980,1,1)),	
			maxStart: moment(new Date(2038,12,31)),	
			minEnd: moment(new Date(1980,1,1)),	
			maxEnd: moment(new Date(2038,12,31))	
		};
		
		var p = q.block(b.default_parent);
		var maxsd = b.children.map(function(cid) { return q.block(cid).start_date; }).put(p ? p.end_date : dates.maxStart);
		var mined = b.children.map(function(cid) { return q.block(cid).end_date; }).put(p ? p.start_date : dates.minEnd);
		
		
		dates.maxStart = sb.ext.minDate.apply(null, maxsd);
		dates.minStart =  p ? p.start_date : dates.minStart;
		dates.maxEnd = p && !p.floating_end_date ? p.end_date : dates.maxEnd;
		dates.minEnd = sb.ext.maxDate.apply(null, mined);
		return dates;
	};
	
	
	q.is_link = function(parent_id, child_id) {
		return _parent_child_link(parent_id, child_id).linked_parent_id != null;
	};
	
	q.custom_progress_weight = function(parent_id, child_id) {
		return sb.ext.to_i(_parent_child_link(parent_id, child_id).custom_progress_weight);
	};
	
	var _parent_child_link = function(parent_id, child_id) {
		var blocks = sb.models.raw("blocks");
		var parent = blocks[parent_id]; 
		var child = blocks[child_id];
		
		if (parent.children.indexOf(child_id) == -1) {
			throw new Error("Block(" + child_id + ") is not a parent of block(" + parent_id + ")");
		}
		
		return child.parents.reduce(function(pre, mel) {return mel.parent_id == parent_id ? pre.put(mel) : pre;}, [])[0];
	};
	
	q.progressVariance = function(bpath) {
		var b = q.block(bpath);
		if(b) {
			var a = b.percent_progress || 100;
			var t = b.expected_progress || 0;
			return t > 0 ? Math.round((a-t)/t*100) : 100;
		}
		return 0;
	};
	
	//recursive function -- no arguments are required on initial call
	//1. If you supply arguments, you can build a subtree
	//2. This function is designed to build trees for the map layout using D3.js
	//3. Linked nodes are duplicated in the structure. 
	//4. If cpath is not passed, cpath is set to the actual root. 
	//5. If ppath is not passed, "cpath" is considered the current root: this is useful
	//			for re-orienting the tree around the currently selected block
	//6. If cpath and ppath is passsed on the initial call, the tree returned will be a branch
	//		
	//6. Blocks is only passed to simplify the recursion -- should never be necessary to pass it
	//			unless you want a tree using a subset of data (
			
	q.blockFullTree = function(cpath,ppath, blocks) {
		blocks = blocks || sb.models.raw("blocks");
		if(!blocks) { return; }
		
		cpath = q.blockPath(cpath || q.rootBlock().default_path);
		ppath = ppath ||[];
		//var ppath = ppath ||cpath.slice(0,-1);                                        
		var b = blocks[cpath.last()];
		
		var d = {
			name: b.title,
			data: b,
			path: cpath,
			children: []
		};

		var children = b.children.cloneExcept(ppath.last());
		children.map(function(el) { return cpath.concat([el]); });
		var rp = cpath.last(1);
		if( rp && ppath.last() != rp) {
			children.unshift(cpath.slice(0,-1));
		}
				
		var size = 1;
		var child;
		
		children.forEach(function(el) {
			var child = q.blockFullTree(el, cpath, blocks);
			size += child.size;
			d.children.put(child);
		});
		d.size  = size;
		return d;
	};


	//linear function that builds the center list from the current block to the root. 
	//1. takes the previous block id so that the position of the children can reflect
	//		where we've come from. 
	
	q.buildStrategyTree = function(prevBlockId) {
		var bpath = q.currentBlockPath();
		var b = q.currentBlock();
		var blocks = sb.models.raw("blocks"); 
		if(!bpath || !b || !blocks) { return null; }
		
		var centerList = bpath.reduce(function(prev, el) {
			var last  = prev.last() || [];
			prev.put(last.concat([el]));
			return prev;
		},[]);
		
		var dy = -(centerList.length-1);
		
		if(b.children.length) {
			var cidx = b.children.indexOf(prevBlockId);
			var cid = b.children[cidx < 0 ? 0 : cidx];
			centerList.push(centerList.last().concat([cid]));
		}
		
		//temp super parent to our root object to simplify the special cases
		var superRoot = {};
		var pnode = superRoot;
		

		//walk down the center
		centerList.forEach(function(cpath) {
			var ppath = sb.ext.slice(cpath,0,-1);
			var pid = ppath.last();
			var cid  = cpath.last();
			
			var siblings = pid ? blocks[pid].children : [cid];
			var cidx = siblings.indexOf(cid);
			
			pnode.children = siblings.map(function(el, idx) {
				var path = ppath.concat([el]).join("_");
				var defaultType = sb.state.value(sb.consts.STATE.BLOCKS_TREE_VIEW);
				var localType = sb.state.getValueKey(sb.consts.STATE.BLOCK_SETTINGS_VIEW, path);
				
				return {
					path:path,
					dy:dy,
					dx:(idx - cidx),
					data: blocks[el],
					viewType: (localType || defaultType)
				};
			});
			
			dy += 1;
			pnode = pnode.children[cidx];
		});
		return superRoot.children[0];
	};
	
	return q;
});




define('api/urls',['../globals'], function(sb) {
	console.log("urls", sb.version);
	var _regExprs = {};

	var urls = {
		//******************************API URLS **********************************************/
		MODEL_BLOCKS:		{url: "/blocks.js", 					post:false},
		MODEL_COMPANIES:	{url: "/companies.js", 					post:false},
		MODEL_CAPABILITIES: {url: "/company_settings.js", 			post:false},
		MODEL_EXPORTS: 		{url: "/exports.js", 					post:false},
		MODEL_FOCUS: 		{url: "/focus.js", 						post:false},
		MODEL_GROUPS: 		{url: "/groups.js", 					post:false},
		MODEL_KPIS: 		{url: "/kpis.js", 						post:false},
		MODEL_RISKS: 		{url: "/risks.js", 						post:false},
		MODEL_LEVELS: 		{url: "/levels.js", 					post:false},
		MODEL_NEWS: 		{url: "/news.js", 						post:false},
		MODEL_LICENSES:		{url: "/licenses.js", 					post:false},
		MODEL_PROGRESS:		{url: "/blocks/progress.js", 			post:false},
		MODEL_HEALTH: 		{url: "/health_calculations.js", 		post:false},
		MODEL_NPV: 			{url: "/blocks/npv.js", 				post:false},		
		MODEL_RISK: 		{url: "/blocks/risk.js", 				post:false},		
		MODEL_USERS: 		{url: "/users.js", 						post:false},
		MODEL_TAGS:			{url: "/tags.js", 						post:false},
		MODEL_TIMEZONES: 	{url: "/companies/timezones.js", 		post:false},
		MODEL_DASHBOARD: 	{url: "/reports/dashboard_layout.js", 	post:false},
			
		BLOCKS_CONTEXT:					{url: "/blocks/context/%id%.js"},
		BLOCKS_CLOSE: 					{url: "/blocks/close/%id%.js", deleteId: true},
		BLOCKS_MANAGE_CHILDREN: 		{url: "/blocks/manage_children/%id%.js", deleteId: true},
		BLOCKS_DELETE :					{url: "/blocks/%type%/%id%.js", normalParams:true},
		BLOCKS_DOCUMENTS: 				{url: "/blocks/documents/%id%.js"},
		BLOCKS_IMPORT 	:				{url: "/blocks/import/%id%.js"},
		BLOCKS_INVITE 	:				{url: "/blocks/invite/%id%.js"},
		BLOCKS_MAKE_PUBLIC :			{url: "/blocks/make_public/%id%.js", normalParams:true},
		//BLOCKS_MOVE_POSITION 			{url: "/blocks/move_position_%dir%/%id%.js"},
		BLOCKS_MOVE :					{url: "/blocks/move/%id%.js", normalParams:true},
		BLOCKS_PROPERTIES: 				{url: "/blocks/%type%/%id%.js"},
		BLOCKS_RELOCATE: 				{url: "/blocks/reassign_parent/%id%.js", normalParams:true},
		BLOCKS_UPDATE: 					{url: "/blocks/update/%id%.js", massageParamsFunc: "massageParamsForBlockUpdate"},
		BLOCKS_UNWATCH: 				{url: "/blocks/unwatch/%id%.js"},
		BLOCKS_WATCHING_USERS: 			{url: "/blocks/watching_users/%id%.js"},
		BLOCKS_TAGGED: 					{url: "/blocks_for_tag/%name%.js"},
		BLOCKS_UPDATE_GROUPS :			{url: "/blocks/update_group_expression/%id%.js", normalParams:true},
		BLOCKS_CHANGE_CHARTED_KPI: 		{url: "/blocks/set_default_kpi/%id%.js"},
		BLOCKS_UPDATE_CASHFLOWS: 		{url: "/blocks/update_net_cashflows/%id%.js"},
		BLOCKS_HEALTH :					{url: "/blocks/health.js", normalParams:true},
		BLOCKS_PROGRESS :				{url: "/blocks/progress.js", normalParams:true},
	
		BLOCK_FILES_UPLOAD_URL: 		{url: "/blocks/%id%/documents/create.js"},
		BLOCK_FILES_DOWNLOAD_URL: 		{url: "/blocks/%id%/documents/show/%doc_id%.js"},
		BLOCK_FILES_DELETE: 			{url: "/blocks/%id%/documents/destroy/%doc_id%.js"},
		
		BOOKMARKS:						{url: "/saved_client_states/index.js"},
		BOOKMARK_CREATE_DYNAMIC:		{url: "/saved_client_states/create_dynamic.js"},
		BOOKMARK_SAVE_DYNAMIC:			{url: "/saved_client_states/%id%/save_dynamic.js", normalParams:true},
		BOOKMARK_CREATE:				{url: "/saved_client_states/create.js", normalParams:true},
		BOOKMARK_UPDATE:				{url: "/saved_client_states/%id%/update.js", normalParams:true},
		BOOKMARK_DELETE:				{url: "/saved_client_states/%id%/delete.js"},
				 
		COMMENT_PROPERTIES_ADD: 		{url: "/blocks/%id%/comment.js", normalParams:true, deleteId:true},
		
		
		COMPANIES_CREATE: 				{url: "/companies/create.js"},
		COMPANIES_UPDATE: 				{url: "/companies/update.js"},
		COMPANIES_HEALTH: 				{url: "/health_calculations.js"},
		COMPANIES_HEALTH_CREATE: 		{url: "/health_calculations/create.js"},
		COMPANIES_HEALTH_UPDATE :		{url: "/health_calculations/%id%/update.js"},
		COMPANIES_HEALTH_DELETE: 		{url: "/health_calculations/%id%/destroy.js"},
		COMPANIES_HEALTH_DEFAULT: 		{url: "/health_calculations/%id%/set_default.js"},
		COMPANIES_LOGO_PREVIEW_URL: 		{url: "/upload/company_logo_preview.js"},
		COMPANIES_REMOVE_PREVIEW_LOGO: 	{url: "/upload/remove_company_logo_preview.js"},
		
		
		CAPABILITIES_UPDATE: 			{url: "/company_settings/update.js"},
		
		
		
		EXPORTS_CREATE :			{url: "/exports/%id%/create.js"},
		EXPORTS_REPORT :			{url: "/exports/%id%/create.js"},
		EXPORTS_DELETE :			{url: "/exports/%id%/destroy.js"},
		
		FOCUS_CREATE :				{url: "/focus/create.js"},
		FOCUS_UPDATE: 				{url: "/focus/update/%id%.js", deleteId: true},
		FOCUS_DELETE :				{url: "/focus/destroy/%id%.js", deleteId: true},
		FOCUS_REPARENT :			{url: "/focus/reparent/%id%.js"},
		
		GROUPS_CREATE: 				{url: "/groups/create.js"},
		GROUPS_DELETE :				{url: "/groups/%id%/destroy.js", deleteId: true},
		GROUPS_UPDATE: 				{url: "/groups/%id%/update.js", deleteId: true},
		GROUPS_ADD 	:				{url: "/groups/%id%/add.js"},
		GROUPS_REMOVE :				{url: "/groups/%id%/remove.js"},
	
	
		RISKS_CREATE :				{url: "/risks/create.js"},
		RISKS_DESTROY :				{url: "/risks/%id%/destroy.js"},
		RISKS_UPDATE :				{url: "/risks/%id%/update.js"},
		RISKS_UPDATE_STATUS: 		{url: "/risks/%id%/update_status.js"},
		RISKS_ADD_IMPACT :			{url: "/risks/%id%/add_impact.js"},
		RISKS_REMOVE_IMPACT: 		{url: "/risks/%id%/remove_impact.js"},
		RISKS_ATTACH_DOC: 			{url: "/risks/%id%/attach_document.js"},
		RISKS_SHOW_DOC :			{url: "/risks/%id%/show_document/%doc_id%.js"},
		RISKS_DESTROY_DOC: 			{url: "/risks/%id%/destroy_document.js"},
		RISKS_DUMMY_REFRESH :		{url: "/risks/%id%/refresh_risk.js"},
		RISKS_SETTINGS: 			{url: "/risk_profiles/update_risk_settings.js"},
		RISKS_MATRIX_SIZE :			{url: "/risk_profiles/set_matrix_size.js"},
		RISKS_PROFILES_UPDATE: 		{url: "/risk_profiles/update_batch.js"},
		
		
	
		KPIS_CREATE :				{url: "/kpis/create.js"},
		KPIS_DESTROY: 				{url: "/kpis/%id%/destroy.js"},
		KPIS_UPDATE :				{url: "/kpis/%id%/update.js"},
		KPIS_ATTACH_BLOCK: 			{url: "/kpis/%id%/attach.js"},
		KPIS_DETACH_BLOCK :			{url: "/kpis/%id%/detach.js"},
		
		LEVELS_UPDATE: 				{url: "/levels/update.js"},
		
		MEASURES_BLOCKS: 			{url: "/blocks/measure_values/%id%.js"},
		
		USERS_CREATE :				{url: "/users/create.js"},
		USERS_CREATE_BATCH: 			{url: "/users/create_batch.js"},
		USERS_ADD_GROUP: 			{url: "/users/%id%/add_group.js", normalParams:true},
		USERS_REMOVE_GROUP: 			{url: "/users/%id%/remove_group.js", normalParams:true},
		USERS_ACTIVATE :				{url: "/users/%id%/activate.js"},
		USERS_DEACTIVATE: 			{url: "/users/%id%/deactivate.js"},
		USERS_UPDATE: 				{url: "/users/%id%/update.js", deleteId: true},
		USERS_REMOVE_MEMBERSHIP: 	{url: "/users/%id%/delete_membership.js"},
		USERS_CHANGE_MEMBERSHIP: 	{url: "/users/%id%/update_membership.js", deleteId: true},
		
		USERS_CHANGE_DEFAULT_COMPANY:	{url: "/users/%id%/change_default_company.js", normalParams:true},
		
		REGISTER_COMPANY: 		{url: "/registration/register_company.js"},
		
		LOGIN :						{url: "/login/auth.js"},
		LOGOUT: 					{url: "/login/logout.js"},
		
		//Args:
		//	username: users email address
		LOGIN_FORGOT_PASSWORD: 		{url: "/login/forgot_password.js", normalParams:true},
		
		LOGIN_REMEMBER_ME :			{url: "/login/remember_me.js"},
	
		URL_SAVE_BOOKMARK :			{url: "/users/save_bookmark.js"},
		PAYMENTS :					{url: "/purchases/index.js"},
		PAYMENTS_QUOTE :				{url: "/purchases/quote.js"},
		PAYMENTS_CREATE: 			{url: "/purchases/create.js"},
		
		ADMIN_RAISE: 				{url:"/admin/log_client_error.js"}
	};
	
	
	
	urls.url = function(urlObj, params) {
		if(!urlObj || !urlObj.url) {
			throw new Error("Url does not exist: " + urlObj);
		}
		params = params || {};
		var s = urlObj.url;
		for (var p in params) {
			s = s.replace(_regExpr(p), params[p]);
		}
		if(s.indexOf("%") > -1) {
			throw new Error( "Bad url." + s);
		}
		return sb.state.host + s ; 
	};
	
	var _regExpr = function(s) {
		//build and cache the regexp. There's a small finite number of them, so just cache them when they're created. 
		_regExprs[s] = _regExprs[s] || new RegExp("\%"+s+"\%");
		return _regExprs[s];
	};
	
	urls.massageParamsForBlockUpdate = function(params) {
		delete params.id;
		return params;
	};
	
	//convers a sub-url pattern into an object
	// e.g., blockSettings=blockA!bs_blockB!bp
	// into:
	//	{ blockA: bs, blockB:bp }
	urls.s_to_o = function(s) {
		var res = {};
		s.split("-").reduce(
			function(prev, el) { 
				if(el != "") {
					var parts = el.split("!");
					prev[parts[0]] = parts[1];
					return prev;
				}
			}, 	res
		);
		return res; 
	};

	//The reverse of s_to_o
	urls.o_to_s = function(o) {
		var a = [];
		sb.ext.each(o, function(k,v) {
			a.put([k,v].join("!"));
		})
		return a.join("-");
	};
	
	//converts several types into a url object
	//STRING: key=value;foo=bar
	//ARRAY: [[key,value],[foo,bar]]
	//		[{key:value}, {foo:bar}]
	// OBJECT: returns self.
	urls.url_to_o = function(url) {
		var o = typeof(url) == "string" ? url.split(";") : url;
		o = sb.ext.isArray(o)  ? o : o.reduce(function(prev,el) {
			el = typeof(el) == "string" ? el.split("=") : el;
			if(sb.ext.isArray(el)) {
				prev[el[0]] = el[1];
			} else if (el.key) {
				prev[el.key] = el.value;
			} else {
				throw "URL Cannot be parsed: " + JSON.stringify(url);
			}
			return prev;
		}, {});
		return o;
	};
	
	
	return urls;
});




define('api/api',['../globals'], function(sb) {
	var api = {};

	var _errorData = null;
	var _errorTimeout = 50;
	var _errorTimeoutDefault = 50;
	var _requestQueue =  [];

		
	api.get = function(url, params, success, failure, stateCheck) {
		api.request(url,params, false, success,failure,stateCheck);
	};
	
	api.post = function(url, params, success, failure, stateCheck) {
		api.request(url,params, true, success,failure,stateCheck);
	};

	api.request =  function(url, params, post, success,failure, stateCheck) {
		var stateFunc = (stateCheck || sb.state.authorized);
		if(stateFunc.call(sb.state)) {
			_request(url, params, post, success, failure); 
		} 
	};
	
	function _request (url, params, post, success, failure) {
		sb.ext.debug("Sending request to ", url, JSON.stringify(params));
		sb.state.addTimestamps(params || {});
		sb.AJAX({
			url: url,
			type: (post ? "POST" : "GET"),
			data:params,
			dataType: 'json',
			context: api,
			success: _success.bind(null, sb.ext.slice(arguments)),
			error: _failure.bind(null, sb.ext.slice(arguments))
		});
	}

	function _success(reqArray, data) {
		sb.ext.debug("SUCCESS: SB_Api", reqArray, data);
		_errorTimeout = _errorTimeoutDefault;
		
		var wasValid = sb.state.authorized();
		
		if (sb.state.update(data) ) {
			//success function in the original call
			var errors = sb.ext.getResultMessages(data).errors;
			
			if(!errors && reqArray[3]) {
				reqArray[3](data);
				_popQueue();
			}
			if(errors && reqArray[4]) {
				reqArray[4](data);
				_popQueue();
			}
		} else {
			if(wasValid) {
				//clear the queue
				_requestQueue.length = 0;
			}
			if(reqArray[4]) {
				reqArray[4](data);	
			}	
		}
	}
	
	function _failure (reqArray, data) {
		sb.ext.debug("FAILURE SB_Api", JSON.stringify(data));
		
		var args = ([1000]).concat(reqArray);
		
		api.request.bindDelay.apply(null, args);
	}
	
	function _pushQueue (data) {
		var key = data.url + (JSON.stringify(data.params) || "");
		sb.ext.debug("Pushing request on the queue: ", key);
		if(_requestQueue.filter(function(el) { return el.key == key; } ).length == 0) {
			_requestQueue.push({key:key, data:data});
		}
	}
	
	function _popQueue () {
		if(_errorData) {
			sb.ext.debug("Running Error Request");
			_request.apply(this, this._errorData);
		} else if (_requestQueue.length > 0) {
			var r = _requestQueue.shift().data;
			if(r.state()) {
				_request.call(null, r.url, r.params, r.post, r.success, r.failure);
			} else {
				r.count += 1;
				if(r.count < this._maxRetries) {
					_pushQueue.bindDelay(null, _retryDelay, r);
				}
				_popQueue();
			}
		}
	}
	
	return api;
});





define('api/ajax',['../globals'], function(sb) {
	
	var ajax = {};



	ajax.jquery = function() { return function(opts) {
		//strip the host part of the url. Make this request server relative.  
		opts.url = opts.url.replace(/^(https?:\/\/)?.+?\//, "/");
		sb.ext.debug("jquery", opts.type, opts.url);
		

		sb.jquery.ajax({
			type: 		opts.type,
			url: 		opts.url,
			data:		opts.data,
			dataType: 	opts.dataType
		})
		.done(opts.success)
		.fail(opts.error);
	};};


	ajax.node = function() {  return function(opts) {
		var _req = opts.type == "POST" ? sb.requestAgent.post(opts.url).send(opts.data) :
										sb.requestAgent.get(opts.url).query(opts.data);
		
		_req.set("Accept", "application/json")
			.end(function(res) {
				if(res.ok) {
					sb.ext.debug("Sweet!", res.text);
					if(opts.success) {
						opts.success(JSON.parse(res.text));
					}
				} else {
					sb.ext.debug("Dam", res.text);
					if(opts.error) { 
						opts.error(res.text);
					}
				}	
			})
		;
	};};
	

	ajax.titanium = function() {	return function(opts) {
		if(!sb.ext.ti()) { return; }
		
	    // Merge with default props
	    var o = sb.ext.combine({
	        type: 'GET',
	        url: null,
	        data: false,
	        contentType: 'application/json',
	            // Ti API Options
	            async: true,
	            autoEncodeUrl: true,
	 
	            // Callbacks
	            success: null,
	            error: null,
	            beforeSend: null,
	            complete: null
        }, opts);
	 
       // Ti.API.info("XHR " + o.type + ": \n'" + o.url + "'...");
        var xhr = Ti.Network.createHTTPClient({ autoEncodeUrl: o.autoEncodeUrl,   async: o.async   });
 		if(o.type == "GET" && o.data) {
 			var str = [];
 			for(var p in o.data) {
 				str.put( p + "=" + encodeURIComponent(o.data[p]) );
 			}
 			o.url += "?" + str.join("&");
 			delete o.data;	
 		}
        // URL
        xhr.open(o.type, o.url);
	 
        // Request header
	    xhr.setRequestHeader('Content-Type', o.contentType);
	
        if(o.beforeSend) {
            o.beforeSend(xhr);
        }
	 
        // Errors
	    xhr.setTimeout(10000);
	    xhr.onerror = function() {
	       // Ti.API.info('XHR "onerror" ['+this.status+']: '+this.responseText+'');
	            if(null !== o.error) {
	                return o.error(this);
	            }
	        };
	    xhr.onload = function() {
	        // Success
	        // Log
	        //Ti.API.info('XHR "onload" ['+this.status+']: '+this.responseText.substr(200)  +'');
	 
            // Success = 1xx or 2xx (3xx = redirect)
	        if(this.status < 400) {
	            try {
	                if(null !== o.success) {
	                	var json = JSON.parse(this.responseText);
	                    return o.success(json);
	                }
	            } catch(e) {
	                Ti.API.error('XHR success function threw Exception: ' + e + '');
	                return;
	            }
	        // Error = 4xx or 5xx
	        } else {
	           //Ti.API.info('XHR error ['+this.status+']: '+this.responseText+'');
                if(null !== o.error) {
                    return o.error(this);
                }
            }
		};
	 
	    // Send
	    if(o.data) {
	        //Ti.API.info(o.data);
	        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			xhr.send(o.data);
		} else {
		    xhr.send();
		}
	 
        // Completed
	    if(null !== o.complete) {
	        return o.complete(this);
	    }
		
	};};
	
	

	
	return ajax;

});



define('sb_light',[
	'./globals',
	'./utils/ext',	
	'./utils/consts',
	'./utils/Class',
	'./models',		
	'./controller',
	'./api/state',	
	'./api/queries',	
	'./api/urls',	
	'./api/api',
	'./api/ajax'
], function(
	globals,
	ext,	
	consts,	 
	Class,	 
	models,	
	controller,
	state,	
	queries,	
	urls,	
	api,
	ajax
) {
	//globals.version = "0.0.1";
	
	globals.ext = ext;
	globals.consts = consts;
	globals.models = models;
	globals.controller = controller;
	globals.state = state;	 
	globals.queries = queries;	 
	globals.urls = urls;	 
	globals.api = api;	 
	globals.ajax = ajax; 
	globals.Class = Class;

	state.host = "http://demo.strategyblocks.com";

	console.log("Loaded SB: ", globals.state.host);


	return globals;
});
