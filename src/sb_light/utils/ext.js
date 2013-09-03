/*globals define, Ti, console*/
/*jslint passfail: false */


define(["sb_light/globals"], function(sb) {
	"use strict";

	//console.log("ext", sb.version);
	var ext = {};

	ext._unique = 0;
	//return a unique number /id
	ext.unique = function ext_unique() {
		return (++ext._unique);
	};

	ext.noop = function(){};
	ext.global = function(str) {
		return window[str] !== undefined;
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
		if(ext.global("Ti")) {
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
	ext.moment = function ext_moment(d) { return sb.moment(d);	};
	ext.dateNumber = function ext_dateNumber(d) { return ext.moment(d).valueOf();	};
	ext.date = function ext_date(d) { return ext.moment(d).toDate();	};
	ext.daysDiff = function ext_daysDiff(da, db) {return ext.moment(da).diff(ext.moment(db),"days");};
	ext.today = function ext_today() { return new Date(); };
	ext.minDate = function ext_minDate() { return ext.moment(ext.slice(arguments).sort(ext.sortDate)[0]); };
	ext.maxDate = function ext_maxDate() { return ext.moment(ext.slice(arguments).sort(ext.sortDate).last()); };
	ext.serverFormat = "YYYY/MM/DD";
	ext.userFormat = function ext_userFormat() { 
		var u = sb.queries.user();
		return u ? u.date_format : ext.serverFormat;
	};
	ext.serverDate = function ext_serverDate(d) { return sb.moment(d||new Date()).format(ext.serverFormat); };
	ext.userDate = function ext_userDate(d) { return sb.moment(d||new Date()).format( ext.userFormat()); };
	ext.dateFromNow = function ext_dateFromNow(d, format, reverse) { 
		if(reverse) {
			return "(" + sb.moment(d).fromNow() + ")&nbsp;" + sb.moment(d).format(format || ext.userFormat());
		} 
		return sb.moment(d).format(format || ext.userFormat()) + "&nbsp;(" + sb.moment(d).fromNow() + ")";
	};
	ext.fromNow = function ext_fromNow(d) {		return sb.moment(d).fromNow();	};


		/************  REGEXPS ***************************/
	ext.regEmail = new RegExp("([\\w-\\.]+)@((?:[\\w]+\\.)+)([a-zA-Z]{2,4})");
	ext.regUrl = new RegExp("^https?:\/\/");
	
	
	
		/************  SORTING ***************************/
		//sort an array based on a property, and the function to use
		//so if an array is [{date:...,value:...},...], you can sort using ext.sortProp("date",ext.sortDate); 
	ext.sortFactory = function ext_sortFactory(prop, func, reverse) {
		return function ext_sortFactory_cb(a,b) {	
			var aprop = a ? a[prop] : null;
			var bprop = b ? b[prop] : null;
			return func(aprop, bprop) * (reverse ? -1 : 1);		
		};
	};
	ext.sortTime = function ext_sortTime(a,b) { return ext.sortNumbers(ext.parseDate(a).getTime(), ext.parseDate(b).getTime()); }; 
	ext.sortNumber = function ext_sortNumber(a,b){ return a-b; };
	ext.sortNumbers = ext.sortNumber;
	ext.sortDate = function ext_sortDate(a,b){ return ext.daysDiff(a,b); }; 
	ext.sortDates = ext.sortDate;
	ext.sortString = function ext_sortString(a,b){ return String(a).localeCompare(String(b)); };
	ext.sortStrings = ext.sortString;
	ext.sortBool = function ext_sortBool(a,b) { return ext.sortNumber(a?1:0, b?1:0); };
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
	
	// The argument [n] can be:
	//		literal numbers (e.g., 24)
	//		a function that returns a number n==foo, where foo() returns 24
	//		an array with a function as the first argument, so n=[foo, "bar", "stuff"] and foo("bar", "stuff") returns 24
	ext.number = function ext_number(n,def/*==0*/) {
		n = ext.isFunc(n) ? n() : n;
		n = ext.isArr(n) && ext.isFunc(n[0]) ? n[0].apply(null, n.slice(1)) : n;
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
		
	ext.absDiff = function(a,b) {
		return Math.abs(a-b);
	};

		/************  BLOCK COLOR CONSTANTS***************************/
		//status is -1 (red), 0 (yellow), and 1 (green)
	ext.healthColor = function ext_healthColor(data) { return (["#D80000","#EACF00","#0FAD00"])[data.status+1]; };
	ext.healthText = function ext_healthText(data) { return (["Bad","Warning","Good"])[data.status+1]; };
	ext.blockProgressFill = function ext_blockProgressFill(block) {
		switch(block.progress_color) {
			case "green": 	return ["#176717", 		"url(#progressGood)", 		"url(#progressHatchGood)" 		,["#67b41f", "#508121"] ];
			case "yellow":	return ["#77771B", 		"url(#progressWarning)",	"url(#progressHatchWarning)"	,["#d3a900", "#95780d"] ];
			case "red": 	return ["#641717", 		"url(#progressBad)",		"url(#progressHatchBad)" 		,["#b41f27", "#812127"] ];
			default: 		return ["#999", 		"url(#progressNone)",		"url(#progressHatchNone)" 		, ];
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

		var td = [];
		var vd = [];
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
		});
		var minT = td[0].value;
		var maxT = td[0].value;
		ext.each(td, function(el) {
			minT = ext.min( el.value, minT );
			maxT = ext.max( el.value, maxT );
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
		props = ext.isArray(props) ? props.concat(ext.slice(arguments,1)) : ext.slice(arguments);
		var res = props.reduce(function ext_combine_reduce(newObj, v) {
			var mixed = ext.mixin(newObj, v, ignore);
			return mixed;
		},{});
		return res;
	};		
	//same as combine but only takes two properties.
	ext.merge = function ext_merge(a, b, ignore) {
		return ext.combine([a,b], ignore);	
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
	
	
	if (!Array.prototype.find) {  
		Array.prototype.find = function ext_array_find(key, value) {  
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


	return ext;
	
});
