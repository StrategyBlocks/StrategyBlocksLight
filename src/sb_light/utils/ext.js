/*globals define, Ti, console, moment*/
/*jslint passfail: false */


define(["sb_light/globals", "moment"], function(sb) {
	"use strict";

	//console.log("ext", sb.version);
	var ext = {};

	ext.pi = Math.PI;
	ext.tau = ext.pi * 2;
	ext.rad0 = 0;
	ext.rad45 = ext.pi /4;
	ext.rad90 = ext.pi /2;
	ext.rad180 = ext.pi;
	ext.rad270 = ext.rad180 + ext.rad90;
	

	ext._unique = 0;
	//return a unique number /id
	ext.unique = function ext_unique() {
		return (++ext._unique);
	};

	ext.noop = function(){};
	ext.true = function(){ return true; };
	ext.false = function(){ return false; };
	ext.identity = function(x){ return x; }; // return the first argument (identity function)
	ext.fidentity = function(x){ return (function() { return x;}); }; // return a function that returns x
	ext.global = function(str) {
		if(typeof window !== "undefined") {
			return window[str] !== undefined;
		} else if (typeof Ti !== "undefined") {
			return Ti[str];
		}
		
		return typeof window !== "undefined" &&  window[str] !== undefined;
	};

	ext.deprecated = function(oldF, newF, message) {
		console.log("Warning: ", oldF, " is deprecated. Please use ", newF, " instead.");
		if(message) {
			console.log("Warning(2): ", message);
		}
	};

	//helps convert arguments into array
	//a is an array or arguments.
	//idx is the starting index of the slice (e.g., number of items to skip)
	ext.slice = function ext_slice(a, idx, end) {
		idx = isNaN(idx) ? 0 : idx;
		if(isNaN(end)) {
			return Array.prototype.slice.call(a, idx);
		}
		return Array.prototype.slice.call(a, idx, end);
	};
	
	ext.debug = function ext_debug() {
		if(!sb.debug) { return; }
		var str = ([(new Date()).toTimeString()]).concat(ext.slice(arguments)).join(" ");
		if(ext.global("API")) {
			Ti.API.debug(str);
		} else if(ext.global("console")) {
			console.log(str);
		}
	};

	ext.warn = function ext_warn() {
		var str = ([(new Date()).toTimeString(), "WARNING:"]).concat(ext.slice(arguments)).join(" ");
		if(ext.global("Ti")) {
			Ti.API.warn(str);
		} else if(ext.global("console")) {
			console.log(str);
		}
	};
	ext.warning = ext.warn;
	

	
	ext.map = function ext_map(list, fn, scope) {
		var res = [];
		var i, len,k;
		if (ext.isArray(list)) {
			for(i = 0, len = list.length; i < len; ++i) {
				res.push( fn.call(scope || this, list[i], i, list));
			}
		} else { //Object
			for (k in list) {
				//func(value,key,list)
				res.push(fn.call(scope || this, list[k],k, list));
			}
		}
		return res;
	};
	
	ext.each = function ext_each(list, fn, scope) {
		var el;
		if(ext.isArray(list)) {
			list.forEach(fn,scope);
		} else {
			for(el in list) {
				//func(value,key,list)
				fn.call(scope || list, list[el], el, list);
			}	
		}
	};

	ext.filter = function ext_filter(list, fn, scope) {
		var res = [];
		ext.each(list, function(v, k) {
			if(fn.call(scope || this, v, k)) {
				res.push(v);
			}
		});
		return res; 
	};

	ext.reduce = function ext_reduce(list, fn, init, scope) {
		if(ext.isArray(list)) {
			return list.reduce(fn, init);
		} else {
			for(var el in list) {
				init = fn.call(scope|| list, init, list[el], el, list);
			}
			return init;
		}
	};

	//simplifies set & return for reduce functions
	ext.set = function ext_set(obj, key, value) {
		obj[key] = value;
		return obj;
	};
	
	ext.length = function ext_length(list) {
		var len = 0;
		if(ext.isArray(list)) {
			len = list.length;
		} else if(list) {
			len = Object.keys(list).length;	
		}
		return len;
	};
	//takes a list of objects and a key property and converts the array to a hash map
	ext.toObject = function ext_toObject(list, key) {
		return list.reduce(function ext_toObject_reduce(prev, el) {
			prev[el[key]] = el;
			return prev;
		}, {});
	};

	//takes a hash map / array and returns an array of values. 
	ext.values = function ext_values(map, keyName) {
		return ext.map(map, function ext_values_map(el,k) { 
			return keyName ? el[keyName] : el;
		});
	};
	//create an array of the specified size, and then set the values;
	//if  the val is a function then it is called with the current index and the optional "data" is passed. 
	ext.initArray = function ext_init_array(size, val, data) {
		var a = [];
		for(var i = 0; i < size; ++i) {
			a.push(ext.isFunc(val) ? val(i, data) : val);
		}
		return a;
	};

	//alias for Object.keys
	ext.keys = function ext_keys(map) {
		return map ? Object.keys(map) : [];
	};	
	//return the first key from doing a for-in on the map
	//WARNING: this may not be consisten. The order is arbitrary. 
	//			this is only useful if you just want a valid key, and it doesn't matter which one (e.g., a default setting)
	ext.firstKey = function ext_keys(map) {
		if(!map) { return null; }
		var k;
		for(k in map) { return k; }
	};	

	//simplify array join syntax for when I need to create the array as well
	ext.join = function ext_join(ch /*, arguments:an array or a list of arguments to join */) {
		var arr =  ext.slice(arguments,1);
		arr = (arr.length == 1 && ext.isArr(arr[0])) ? arr[0] : arr;
		return arr.join(ch);
	};

	ext.cloneArray = function(arr) {
		return arr.map(function(v) { return ext.merge(v); });
	}

	//this only works with objects that contain only native JS object (e.g., Object-derived)
	//probably won't work very well for system,proprietary, etc.. objects.
	//converts the entire things to a string, so might have performance issues.
	ext.deepClone = function ext_deepClone(obj) {
		return JSON.parse(JSON.stringify(obj));
	};
	
		/************  TYPES ***************************/
	ext.valid = function ext_valid(obj, type) {
		switch(type || "object") {
			case "object": return obj !== null && obj !== undefined;
			case "arr":
			case "array": return ext.isArr(obj);
			case "func": 
			case "function": return ext.isFunc(obj);
			case "str":
			case "string": return ext.isStr(obj) && obj !== "";
			case "num": 
			case "number": return ext.isNum(obj) && !isNaN(obj);

		}
	};


	ext.isArr = function ext_isArr(obj) {
		return Object.prototype.toString.call(obj) == "[object Array]";
	};
	ext.isArray = ext.isArr;
	
	ext.isFunc = function ext_isFunc(obj) {
		return Object.prototype.toString.call(obj) == "[object Function]";
	};
	ext.isFunction = ext.isFunc;
	
	ext.isStr = function ext_isStr(obj) {
		return Object.prototype.toString.call(obj) == "[object String]";
	};
	ext.isString = ext.isStr;
	
	ext.isBool = function ext_isBool(obj) {
		return Object.prototype.toString.call(obj) == "[object Boolean]";
	};
	ext.isBoolean = ext.isBool;
	
	ext.isNum = function ext_isNum(obj) {
		return Object.prototype.toString.call(obj) == "[object Number]";
	};
	ext.isNumber = ext.isNum;
	
	ext.isDate = function ext_isDate(obj) {
		return Object.prototype.toString.call(obj) == "[object Date]";
	};
	
	
	//helper function that gets executed in the context of the callee.
	ext._getClass= {}.toString;
	
	
		/************  STRINGS  ***************************/
	ext.caps = function ext_caps(s) {
		s = ext.isArray(s) ? s : [s];
		return s.reduce( function ext_caps_reduce(prev,el) {
			if(!el) { return prev; }
			return (prev ? (prev + " ") : "") + el.charAt(0).toUpperCase() + el.slice(1);
		}, null);
	};
	ext.capitalize = ext.caps;
	
	ext.replace = function ext_replace(src, obj) {
		var s = src;
		ext.each(obj, function  ext_replace_each(v,k) {
			var r = new RegExp("%"+k.toUpperCase()+"%");
			s = s.replace(r, v);
		});
		return s;
	
	};
	
		/************  DATES ***************************/
	ext.time = (function() { 
			if(!Date.now) {
				return function ext_time_old() { return new Date().getTime(); };
			} 
			return function ext_time() { return Date.now(); };
	}());	
	
	ext.parseDate = function ext_moment(d) {
		ext.deprecated("ext.parseDate", "ext.moment");
	};
	ext.moment = function ext_moment(d, format) { return moment(d, format);	};
	ext.dateNumber = function ext_dateNumber(d, format) { return ext.moment(d, format).valueOf();	};
	ext.date = function ext_date(d, format) { return ext.moment(d, format).toDate();	};

	//number is positive when db is earlier than da
	ext.daysDiff = function ext_daysDiff(da, db) {return ext.moment(da).diff(ext.moment(db),"days");};
	ext.weeksDiff = function ext_daysDiff(da, db) {return ext.moment(da).diff(ext.moment(db),"weeks");};
	ext.monthsDiff = function ext_daysDiff(da, db) {return ext.moment(da).diff(ext.moment(db),"months");};
	ext.yearsDiff = function ext_daysDiff(da, db) {return ext.moment(da).diff(ext.moment(db),"years");};
	ext.daysFrom = function ext_daysDiff(da, db, noPrefix) {return ext.moment(db).from(da, noPrefix||false); };
	ext.today = function ext_today() { return new Date(); };
	ext.minDate = function ext_minDate() { return ext.moment(ext.slice(arguments).sort(ext.sortDate)[0]); };
	ext.maxDate = function ext_maxDate() { return ext.moment(ext.slice(arguments).sort(ext.sortDate).last()); };
	ext.serverFormat = "YYYY/MM/DD";
	ext.unixFormat = undefined;
	ext.userFormat = function ext_userFormat() { 
		var u = sb.queries.user();
		var udf = u ? u.date_format : ext.serverFormat;
		//ext.debug("User date format: ", udf);
		return udf;
	};
	ext.serverDate = function ext_serverDate(d,format) { return ext.moment(d,format).format(ext.serverFormat); };
	ext.month = function ext_date(d, format) { return ext.moment(d,format).format("MMM (YYYY)");	};
	ext.userDate = function ext_userDate(d, format) { return ext.moment(d,format).format( ext.userFormat()); };
	ext.dateFromNow = function ext_dateFromNow(d, format, reverse) { 
		if(reverse) {
			return "(" + moment(d).fromNow() + ")&nbsp;" + moment(d).format(format || ext.userFormat());
		} 
		return moment(d).format(format || ext.userFormat()) + "&nbsp;(" + moment(d).fromNow() + ")";
	};
	ext.fromNow = function ext_fromNow(d, format) {		return moment(d, format).fromNow();	};

	//return a standard format for searching via dates
	ext.filterDateString = function ext_fromNow(d) {		return moment(d).format("YYYY MMMM DD");	};


		/************  REGEXPS ***************************/
	ext.regEmail = new RegExp("([\\w-\\.]+)@((?:[\\w]+\\.)+)([a-zA-Z]{2,4})");
	ext.regUrl = new RegExp("^https?:\/\/");
	
	
	
		/************  SORTING ***************************/
		//sort an array based on a property, and the function to use
		//so if an array is [{date:...,value:...},...], you can sort using ext.sortProp("date",ext.sortDate); 
	ext.sortFactory = function ext_sortFactory(prop, func, reverse) {
		func = func || ext.sortString;
		reverse = reverse || false;
		return function ext_sortFactory_cb(a,b) {	
			var aprop = a ? a[prop] : null;
			var bprop = b ? b[prop] : null;
			return func(aprop, bprop) * (reverse ? -1 : 1);		
		};
	};
	ext.sortTime = function ext_sortTime(a,b) { return ext.sortNumbers(ext.parseDate(a).getTime(), ext.parseDate(b).getTime()); }; 
	ext.sortNumber = function ext_sortNumber(a,b){ return a-b; };
	ext.sortNumbers = ext.sortNumber;
	ext.sortNumStr = function ext_sortNumber(a,b){ return ext.to_f(a)-ext.to_f(b); };
	ext.sortDay = function ext_sortDate(a,b){ return ext.daysDiff(a,b); }; 
	ext.sortDays = ext.sortDay;
	ext.sortDate = function ext_sortDate(a,b){ return ext.sortNumber(ext.dateNumber(a), ext.dateNumber(b)); }; 
	ext.sortDates = ext.sortDate;
	ext.sortString = function ext_sortString(a,b){ return String(a).localeCompare(String(b)); };
	ext.sortStrings = ext.sortString;
	ext.sortBool = function ext_sortBool(a,b) { return ext.sortNumber(ext.bool(a)?1:0, ext.bool(b)?1:0); };
	ext.sortBoolean = ext.sortBool;
	 
	ext.sortDateValue = function ext_sortDateValue(a,b) { return ext.sortDate(a.date,b.date); };
	ext.sortUsers = function ext_sortUsers(a,b) {  return (ext.sortFactory("last_name", ext.sortString))(a,b); };
	ext.sortFocus = function ext_sortFocus(a,b) {  return (ext.sortFactory("title", ext.sortString))(a,b); };
	ext.sortName = function ext_sortName(a,b) {  return (ext.sortFactory("name", ext.sortString))(a,b); };
	ext.sortBlocksByProgress = function ext_sortBlocksByProgress(a,b) {
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

	ext.bool = function ext_bool(b){ 
		return ext.isStr(b) ? (b === "true") : b;
	};
		
		/************  CSS ***************************/
	ext.px = function ext_px(number) {		return [number,"px"].join("");	};
	ext.pc = function ext_pc(number) {		return [number,"%"].join("");	};
		
		//************  Math ***************************/



	ext.roundTo = function ext_roundTo(number, dec) {
		var val = Math.pow(10,ext.number(dec,0));
		return Math.round(number * val)/val;
	};
	ext.floorTo = function ext_floorTo(number, dec) {
		var val = Math.pow(10,ext.number(dec,0));
		return Math.floor(number * val)/val;
	};
	ext.ceilTo = function ext_ceilTo(number, dec) {
		var val = Math.pow(10,ext.number(dec,0));
		return Math.ceil(number * val)/val;
	};

	ext.to_i = function ext_to_i(str, base, def/*=0*/) {
		var i = parseInt(str, base||10);
		return isNaN(i) ? ext.number(def,0) : i; 
	};
	ext.to_f = function ext_to_f(str, def/*=0*/) {
		var f = parseFloat(str);
		return isNaN(f) ? ext.number(def,0) : f; 
	};
	ext.rand = function ext_rand(min, max, dec/*==0*/) {
		return ext.floorTo( (Math.random() * (max - min + 1)), dec) + min;
	};
	ext.to_color = function ext_to_color(num) {
		return '#' +  ('00000' + (num | 0).toString(16)).substr(-6);
	};

	//str in #ff4455 or 0x004340 format to int
	ext.from_color = function ext_from_color(str) {
		//handle an existing number
		if(ext.isNum(str)) { return str; }

		//str is a string
		str = str.replace("#", "0x");
		return ext.to_i(str, 16);
	};
	
	//quick version of ext.number for just strings. 
	ext.to_num = function ext_to_num(str) {
		return +str;
	};

	// The argument [n] can be:
	//		literal numbers (e.g., 24)
	//		a function that returns a number n==foo, where foo() returns 24
	//		an array with a function as the first argument, so n=[foo, "bar", "stuff"] and foo("bar", "stuff") returns 24
	//		a string that can be converted to number by coercing it
	ext.number = function ext_number(n,def/*==0*/) {
		n = ext.isStr(n) ? +n : (
				ext.isFunc(n) ? n() : (
					ext.isArr(n) && ext.isFunc(n[0]) ? 
						n[0].apply(null, n.slice(1)) : 
						n		
				)
			)
		;
		return isNaN(n) ? (def||0) : n;
	};
	ext.max = function ext_max(/*etc....*/) {
		var args =ext.slice(arguments).map(function ext_max_map(el) {return ext.number(el,Number.NEGATIVE_INFINITY);});
		var max = args.reduce(function  ext_max_reduce(prev,el){
			return prev > el ? prev : el;
		},Number.NEGATIVE_INFINITY);

		return max;
	};
	ext.min = function ext_min(/*etc....*/) {
		var args =ext.slice(arguments).map(function ext_min_map(el) {return ext.number(el,Number.POSITIVE_INFINITY);});
		var min = args.reduce(function ext_min_reduce(prev,el){
			return prev < el ? prev : el;
		},Number.POSITIVE_INFINITY);

		return min;
	};

	//return the first argument that is !NaN
	ext.first = function ext_first(/*etc...*/) {
		var i, args = ext.slice(arguments);
		for(i = 0; i < args.length; ++i) {
			if(!isNaN(args[i])) {
				return args[i];
			}
		}
		return NaN;
	};

	//given a value and a total, returns a rounded percentage out of 100
	// e.g., percent(3, 7, 1) returns 42.9
	ext.percent = function ext_percent(val, total, round/*==0*/) {
		round = ext.first(round,0);
		return ext.roundTo(  (ext.number(val) / ext.number(total))*100, round );
	}

	ext.range = function ext_range(min,max,num) {
		return ext.max(min, ext.min(max,num));
	};

	//given a list of numbers, returns the one closest to "num"
	ext.snapto = function ext_snapto(list, num) {
		var diff = Math.abs(list[0]-num);
		var i, n = list[0];
		for(i =1; i < list.length; ++i) {
			if(Math.abs(list[i] - num) < diff) {
				diff = Math.abs(list[i] - num);
				n = list[i];
			}
		}
		return n;
	};

	//takes an array of literals or functions and sums the result
	ext.sum = function ext_sum() {
		var args =ext.slice(arguments).map(function ext_sum_map(el) {return ext.number(el);});
		var sum = args.reduce(function ext_sum_reduce(prev,el){
			return prev + ext.number(el);
		},0);

		return sum;

	};

	//SUBTRACT: takes an array of literals or functions and subtracts them the first element in the list
	ext.diff = function ext_diff() {
		var base = ext.number(arguments[0]);
		var args  = ext.slice(arguments,1).map(function ext_diff_map(el) {return ext.number(el);});
		var diff = args.reduce(function ext_diff_reduce(prev,el){
			return prev - ext.number(el);
		},base);

		return diff;
	};

	//takes an array of literals or functions and multiplies the result
	ext.prod = function ext_prod() {
		var args =ext.slice(arguments).map(function ext_prod_map(el) {return ext.number(el,1);});
		var prod = args.reduce(function ext_prod_reduce(prev,el){
			return prev * ext.number(el);
		},1);

		return prod;

	};
	//compare two numbers and return true if their difference is less/equals to "within".
	//the purpose of this function is to ameliorate problems with DOM co-ords
	ext.compareInt = function ext_compareInt(a,b,within/*==0*/) {
		within = ext.number(within,0);
		return Math.abs(a-b) <= within;
	};
		
	ext.absDiff = function  ext_absDiff(a,b) {
		return (a === b) ? 0 : Math.abs(a-b);
	};


	ext.fixRect = function(rect) {
		return {
			x: ext.first(rect.x, rect.left),
			y: ext.first(rect.y, rect.top),
			width:rect.width,
			height:rect.height
		};
	};

	ext.rectDiff = function ext_rectDiff(target, reference) {
		target = ext.fixRect(target);
		reference = ext.fixRect(reference);
		return {
			x: 		(target.x - reference.x), 
			y:		(target.y - reference.y), 
			width:	target.width, 
			height:	target.height
		};

	}

		/************  BLOCK COLOR CONSTANTS***************************/
		//status is -1 (red), 0 (yellow), and 1 (green)

	ext.healthColor = function ext_healthColor(data) { return (["#196419","#7d741f","#7d1f1f"])[data.status+1]; };
	ext.healthText = function ext_healthText(data) { return (["Bad","Warning","Good"])[data.status+1]; };
	ext.progressColor = function ext_progressColor(block) {
		//support passing just the color
		block = block || "none";
		block = ext.isStr(block) ? block : ( (block.closed || block.ownership_state=="new") ? "" : block.progress_color);
		block = block || "none";

		switch(block) {
			case "green": 	return ["#196419", 		"url(#progressGood)", 		"url(#progressHatchGood)" 		,["#67b41f", "#508121"] ];
			case "yellow":	return ["#7d741f", 		"url(#progressWarning)",	"url(#progressHatchWarning)"	,["#d3a900", "#95780d"] ];
			case "red": 	return ["#7d1f1f", 		"url(#progressBad)",		"url(#progressHatchBad)" 		,["#b41f27", "#812127"] ];
			default: 		return ["#999", 		"url(#progressNone)",		"url(#progressHatchNone)" 		,["#999", "#aaa"]  ];
		}
	};



		
	/************  MASSAGE SERVER DATA INTO BETTER OBJECTS FOR D3/presentation ***************************/
	ext.getResultMessages = function ext_getResultMessages(r) {
		var res = {
			errors:null,
			warnings: null,
			notices:null
		};
		if (r) {
			//errors that mean something in the form was incorrect, hopefully out of our control (e.g., bad input from user)
			if(ext.isArray(r.result)) {
				r.result.forEach(function ext_getResultMessages_forEach(o) {
					if(o && o.errors) {
						res.errors = {
							form: r.result.errors, 
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
		res.notices = r.flash ? r.flash.notice : "";
		res.warnings = r.flash ? r.flash.warning : "";
		return res;
	};
	
		
		//merge the target and actuals series into one array of objects. 
	ext.massageTA = function ext_massageTA(data) {
		var dates = [ext.today()];

		data.values = data.values && data.values.length ? data.values : [{date:dates[0], value:0, comment:"(today, interpolated)", interpolated:true}]; 
		data.target = data.target && data.target.length ? data.target : [{date:dates[0], value:0, comment:"(today, interpolated)", interpolated:true}]; 

		var dataMap = {};
		
		data.values.forEach(function ext_massageTA_forEachVal(el) {
			el.date = ext.date(el.date);
			dates[dates.length] = (el.date);
		});
		data.values.sort(ext.sortDateValue);
		if(ext.daysDiff(data.values[0].date, dates[0]) > 0) {
			data.values.push({date:dates[0], value:data.values[0].value, comment:"(today, interpolated)", interpolated:true});
		} else if (ext.daysDiff(data.values.last().date, dates[0]) < 0) {
			data.values.push({date:dates[0], value:data.values.last().value, comment:"(today,interpolated)", interpolated:true});
		}
		
		data.target.forEach(function ext_massageTA_forEachTar(el) {
			el.date = ext.date(el.date);
			dates[dates.length] = (el.date);
			var rs = data.tolerance.range_start > data.tolerance.range_end ? data.tolerance.range_start : data.tolerance.range_end;
			var re = data.tolerance.range_start > data.tolerance.range_end ? data.tolerance.range_end : data.tolerance.range_start;
			
			el.upper = el.value  + (data.tolerance.percentage ? (el.value *rs/100) : rs);
			el.lower = el.value  + (data.tolerance.percentage ? (el.value *re/100) : re);
		});
		data.target.sort(ext.sortDateValue);
		if(ext.daysDiff(data.target[0], dates[0]) > 0) {
			data.target.push({date:dates[0], value:data.target[0], comment:"(today, interpolated)", interpolated:true});
		} else if (ext.daysDiff(data.target.last(), dates[0]) > 0) {
			data.target.push({date:dates[0], value:data.target.last(), comment:"(today,interpolated)", interpolated:true});
		}
		
		data.dates = dates.sort(ext.sortDate);

		var vdata = data.values;
		var tdata = data.target;

		var v = 0;
		var ts = 0;
		var tn = Math.min(tdata.length-1, 1);
		while(v < vdata.length) {
			var vd = vdata[v];
			var tsd = tdata[ts];
			var tnd = tdata[tn];

			//v is before ts
			if(ext.daysDiff(vd.date, tsd.date) <= 0) {
				vd.target = tsd.value; v++; continue;
			}
			//v is after next target
			if(ext.daysDiff(vd.date, tnd.date) > 0) {
				if(tn == tdata.length-1) {
					vd.target = tnd.value;
					v++; continue; 
				} else {
					ts++; tn++; continue;
				}
			}

			//v is before tn but after ts
			if(ext.daysDiff(vd.date, tnd.date) <=0 ) {
				var tsn = ext.dateNumber(tsd.date);
				var tnn = ext.dateNumber(tnd.date);
				var vn = ext.dateNumber(vd.date);

				vd.target = tsd.value + (((tnn-vn)/(tnn-tsn)) * (tnd.value - tsd.value));
				v++;
			}

		}

		return data;
	};

	
	ext.massageKpi = function ext_massageKpi(data) {
		data = ext.massageTA(data);

		var vd = data.values;
		var td = data.target;
		
		var minY = Number.POSITIVE_INFINITY;
		var maxY = Number.NEGATIVE_INFINITY;
		
		
		if(vd.length && td.length) {
			//push a target at the front to line up with values
			if(ext.daysDiff(data.dates[0], td[0].date) < 0) {
				td.unshift( { value:td[0].value, upper:td[0].upper, lower:td[0].lower,
								date:data.dates[0], comment:"(First value, interpolated)" } );
			} 
			//push a target at the end to line up with values
			if(ext.daysDiff(data.dates.last(), td.last().date) > 0) {
				td.push({value:td.last().value, upper:td.last().upper, lower:td.last().lower,
							date:data.dates.last(), comment:"(Last value, interpolated)"});
			}
		}

		//fix the tolerance from the lame form
		data.tolerance.percentage = data.tolerance.percentage || false;
		data.tolerance.inverse = data.tolerance.inverse || false;
		var pc = data.tolerance.percentage; 

		
		var minA = vd[0].value;
		var maxA = vd[0].value;
		ext.each(vd, function(el) {
			minA = ext.min( el.value, minA );
			maxA = ext.max( el.value, maxA );
			el.id = el.id || ("actual_" + ext.unique());
		});
		var minT = td[0].value;
		var maxT = td[0].value;
		ext.each(td, function(el) {
			minT = ext.min( el.value, minT );
			maxT = ext.max( el.value, maxT );
			el.id = el.id || ("target_" + ext.unique());
		});
		
		var upper = ext.max(data.tolerance.range_end, data.tolerance.range_start) / (pc ? 100 : 1);
		var lower = ext.min(data.tolerance.range_end, data.tolerance.range_start) / (pc ? 100 : 1);

		var ml;
		var mu;
		if (!pc) {
			ml = minT + lower;
			mu = maxT + upper;
		} else {
			ml = minT + (lower * minT);
			mu  = maxT + (upper * maxT);
		}
		
		ml = ext.min(ml, minT) - ext.absDiff(minT, ml)*0.02;
		mu = ext.max(mu, maxT) + ext.absDiff(maxT, mu)*0.02;
		

		data.minY = ext.min(minA, minT, ml);
		data.maxY = ext.max(maxA, maxT, mu);
		
		
		var offset = (ext.absDiff(data.maxY, data.minY) * 0.05) || 10;
		data.minY -= offset;
		data.maxY += offset;

		
		return data;		
	};
		
		//fix dates and sort history for health charts
	ext.massageHealth = function ext_massageHealth(data) {
		var dates = [];
		var series = ext.map(data.historical_values, function ext_massageHealth_map(v, k) {
			return {date: ext.date(k), value:v};
		});
		
							//sort by the date number
		data.series = series.sort(ext.sortDateValue);
		
		data.dates = ext.values(data.series, "date");
		data.dates.push(Date.parse(data.end_date));
	
		return data;
	
	};
	
	
	//source gets priority over target
	//all source properties are applied to target.
	//  EXCEPT the ones in ignore.
	//	ignore can be an array of names, or an object with keys. All these key names are skipped from being applied,
	//	but they will not be removed from target if they exist there. 
	ext.mixin = function ext_mixin (/*Object*/ target, /*Object*/ source, /*Object or Array*/ ignore ){
		var empty = ignore || {}; //default template for properties to ignore
		target = target || {};
		source = source || {};
		
		var name, s;
		for(name in source){
			s = source[name];
			var skip =  ext.isArray(empty) ? (empty.indexOf(name) >= 0) : (empty.hasOwnProperty(name));
			if(skip) { continue; }
			target[name] = s;
		}
		return target; // Object
	};
	 
	// Create a new object, combining the properties of the passed objects with the last arguments having
	// priority over the first ones
	//WARNING: Multiple objects to be combined should be passed in as an array. The second argument is a list of
	//properties to ignore. 
	ext.combine = function ext_combine( /*Object or array*/ props, /*object or array*/ ignore) {
		props = ext.isArray(props) ? props : [props];
		var res = props.reduce(function ext_combine_reduce(newObj, v) {
			var mixed = ext.mixin(newObj, v, ignore);
			return mixed;
		},{});
		return res;
	};		
	//same as combine but only takes two properties.
	//A takes precedence over A when overlaps occur
	ext.merge = function ext_merge(a, b, ignore) {
		return ext.combine([a||{},b||{}], ignore);	
	};

	//cherry pick the key/values of an object and clone them into a new one
	ext.cherryPick = function ext_clone(o, props) {
		if(!props) { return ext.mixin(null, o); }
		if(ext.isStr(props)) {
			props = props.split(",");
		}
		var res = {};
		props.forEach(function(prop){
			res[prop] = o[prop];
		});
		return res; 

	};

	//return the number of differences from diff to orig
	ext.changes = function ext_changes(diff,orig) {
		var res = {};
		orig = orig || {};
		ext.each(diff, function(v,k) {
			if(orig[k] != v) {
				res[k] = v;
			}
		});
		return res;
	};


	//take a list of "complete" length and merge the sparse "smaller" into it by matching keys
	//returns an object with "key" as the key
	ext.mergeLists = function ext_mergeLists(larger,smaller, key) {
		larger = larger || [];
		smaller = smaller || [];
		return larger.reduce(function(prev,curr, i) {
			var d = smaller.findKey(key, curr[key]).value;
			prev[curr.id] = ext.merge(curr, d);
			return prev;
		}, {});
	};

	//dumb string to object function
	//doesn't parse values from string to, say, number, array, etc like JSON. 
	// String keys, String values
	ext.fromStr = function ext_fromStr(str, elSep, valSep) {
		var o = {};
		elSep = elSep || ";";
		valSep = valSep || ":";
		str = str.split(elSep);
		ext.each(str, function(v) {
			v = v.split(valSep);
			if(v[0]) {
				o[String(v[0]).trim()] = String(v[1]).trim();
			}
		});
		return o;
	};

	ext.template = function ext_template(obj, template, defaults) {
		var m = template.match(/({.+?})/g);
		return m.reduce(function(out, str) {
			var key = str.replace(/[{}]/g, "");
			var val = (obj[key] !== undefined) ? obj[key] : null;
			val = (val === null && defaults[key] !== undefined) ? defaults[key] : val; 
			val = (val === null && key.match(/col\d/) )? key.replace(/col(\d\d?)/, "col-sm-$1") : val;
			val = (val === null && key.match(/offset\d/) )? key.replace(/offset(\d\d?)/, "col-sm-offset-$1") : val;

			val = (val === null) ? "" : val;
			return out.replace(str, val);
		}, template);
	};


//POLYFILLS ------------------------------------------------------------------------------------------------
//POLYFILLS ------------------------------------------------------------------------------------------------
//POLYFILLS ------------------------------------------------------------------------------------------------
//POLYFILLS ------------------------------------------------------------------------------------------------
//POLYFILLS ------------------------------------------------------------------------------------------------
//POLYFILLS ------------------------------------------------------------------------------------------------
//POLYFILLS ------------------------------------------------------------------------------------------------
//POLYFILLS ------------------------------------------------------------------------------------------------
//POLYFILLS ------------------------------------------------------------------------------------------------




	return ext;
	
});
