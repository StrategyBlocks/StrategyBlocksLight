/*globals define, Ti, console, moment*/
/*jslint passfail: false */


define(["sb_light/globals", "lodash", "moment"], function(sb, _) {
	"use strict";

	//console.log("ext", sb.version);
	var ext = {};
	var E = ext;

	E._ = E.ld = _;

	E.pi = Math.PI;
	E.tau = E.pi * 2;
	E.rad0 = 0;
	E.rad45 = E.pi /4;
	E.rad90 = E.pi /2;
	E.rad180 = E.pi;
	E.rad270 = E.rad180 + E.rad90;

	E.nbsp = '\u00A0';
	

	E._unique = 0;
	//return a unique number /id
	E.unique = function ext_unique() {
		return (++E._unique);
	};

	E.noop = function(){};
	E.true = function(){ return true; };
	E.false = function(){ return false; };
	E.identity = function(x){ return x; }; // return the first argument (identity function)
	E.fidentity = function(x){ return (function() { return x;}); }; // return a function that returns x
	E.global = function(str) {
		if(typeof window !== "undefined") {
			return window[str] !== undefined;
		} else if (typeof Ti !== "undefined") {
			return Ti[str];
		}
		
		return typeof window !== "undefined" &&  window[str] !== undefined;
	};

	E.deprecated = function(oldF, newF, message) {
		if(message) {
			console.log("Warning(2): ", message);
		}
	};

	//helps convert arguments into array
	//a is an array or arguments.
	//idx is the starting index of the slice (e.g., number of items to skip)
	E.slice = function ext_slice(a, idx, end) {
		idx = isNaN(idx) ? 0 : idx;
		if(isNaN(end)) {
			return Array.prototype.slice.call(a, idx);
		}
		return Array.prototype.slice.call(a, idx, end);
	};
	
	E.debug = function ext_debug() {
		if(!sb.debug) { return; }
		var str = ([(new Date()).toTimeString()]).concat(E.slice(arguments)).join(" ");
		if(E.global("API")) {
			Ti.API.debug(str);
		} else if(E.global("console")) {
			console.log(str);
		}
	};

	E.warn = function ext_warn() {
		var str = ([(new Date()).toTimeString(), "WARNING:"]).concat(E.slice(arguments)).join(" ");
		if(E.global("Ti")) {
			Ti.API.warn(str);
		} else if(E.global("console")) {
			console.log(str);
		}
	};
	E.warning = E.warn;
	

	
	E.map = function ext_map(list, fn, scope) {
		var res = [];
		var i, len,k;
		if (E.isArray(list)) {
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
	
	E.each = function ext_each(list, fn, scope) {
		var el;
		if(E.isArray(list)) {
			list.forEach(fn,scope);
		} else {
			for(el in list) {
				//func(value,key,list)
				fn.call(scope || list, list[el], el, list);
			}	
		}
	};

	E.filter = function ext_filter(list, fn, scope) {
		var res = [];
		E.each(list, function(v, k) {
			if(fn.call(scope || this, v, k)) {
				res.push(v);
			}
		});
		return res; 
	};

	E.reduce = function ext_reduce(list, fn, init, scope) {
		if(E.isArray(list)) {
			return list.reduce(fn, init);
		} else {
			for(var el in list) {
				init = fn.call(scope|| list, init, list[el], el, list);
			}
			return init;
		}
	};

	//simplifies set & return for reduce functions
	E.set = function ext_set(obj, key, value) {
		obj[key] = value;
		return obj;
	};
	
	E.length = function ext_length(list) {
		var len = 0;
		if(E.isArray(list)) {
			len = list.length;
		} else if(list) {
			len = Object.keys(list).length;	
		}
		return len;
	};
	//takes a list of objects and a key property and converts the array to a hash map
	E.toObject = function ext_toObject(list, key) {
		return list.reduce(function ext_toObject_reduce(prev, el) {
			prev[el[key]] = el;
			return prev;
		}, {});
	};

	//takes a hash map / array and returns an array of values. 
	E.values = function ext_values(map, keyName) {
		return E.map(map, function ext_values_map(el,k) { 
			return keyName ? el[keyName] : el;
		});
	};
	//create an array of the specified size, and then set the values;
	//if  the val is a function then it is called with the current index and the optional "data" is passed. 
	E.initArray = function ext_init_array(size, val, data) {
		var a = [];
		for(var i = 0; i < size; ++i) {
			a.push(E.isFunc(val) ? val(i, data) : val);
		}
		return a;
	};

	//sets a property if default is specified and its value coerces to false
	//returns the value; 
	E.prop = function(o, prop, def) {
		if(!o[prop]) {
			o[prop] = def;
		}
		return o[prop];
	};


	//alias for Object.keys
	E.keys = function ext_keys(map) {
		return map ? Object.keys(map) : [];
	};	
	//return the first key from doing a for-in on the map
	//WARNING: this may not be consisten. The order is arbitrary. 
	//			this is only useful if you just want a valid key, and it doesn't matter which one (e.g., a default setting)
	E.firstKey = function ext_keys(map) {
		if(!map) { return null; }
		var k;
		for(k in map) { return k; }
	};	

	//simplify array join syntax for when I need to create the array as well
	E.join = function ext_join(ch /*, arguments:an array or a list of arguments to join */) {
		var arr =  E.slice(arguments,1);
		arr = (arr.length == 1 && E.isArr(arr[0])) ? arr[0] : arr;
		return arr.join(ch);
	};

	E.cloneArray = function(arr) {
		return arr.map(function(v) { return E.merge(v); });
	}

	//this only works with objects that contain only native JS object (e.g., Object-derived)
	//probably won't work very well for system,proprietary, etc.. objects.
	//converts the entire things to a string, so might have performance issues.
	E.deepClone = function ext_deepClone(obj) {
		return JSON.parse(JSON.stringify(obj));
	};
	
		/************  TYPES ***************************/
	E.valid = function ext_valid(obj, type) {
		switch(type || "object") {
			case "object": return obj !== null && obj !== undefined;
			case "arr":
			case "array": return E.isArr(obj);
			case "func": 
			case "function": return E.isFunc(obj);
			case "str":
			case "string": return E.isStr(obj) && obj !== "";
			case "num": 
			case "number": return E.isNum(obj) && !isNaN(obj);

		}
	};


	E.isArr = function ext_isArr(obj) {
		return Object.prototype.toString.call(obj) == "[object Array]";
	};
	E.isArray = E.isArr;
	
	E.isFunc = function ext_isFunc(obj) {
		return Object.prototype.toString.call(obj) == "[object Function]";
	};
	E.isFunction = E.isFunc;
	
	E.isStr = function ext_isStr(obj) {
		return Object.prototype.toString.call(obj) == "[object String]";
	};
	E.isString = E.isStr;
	
	E.isBool = function ext_isBool(obj) {
		return Object.prototype.toString.call(obj) == "[object Boolean]";
	};
	E.isBoolean = E.isBool;
	
	E.isNum = function ext_isNum(obj) {
		return Object.prototype.toString.call(obj) == "[object Number]";
	};
	E.isNumber = E.isNum;
	
	E.isDate = function ext_isDate(obj) {
		return Object.prototype.toString.call(obj) == "[object Date]";
	};
	
	
	//helper function that gets executed in the context of the callee.
	E._getClass= {}.toString;
	
	
		/************  STRINGS  ***************************/
	E.caps = function ext_caps(s) {
		s = E.isArray(s) ? s : [s];
		return s.reduce( function ext_caps_reduce(prev,el) {
			if(!el) { return prev; }
			return (prev ? (prev + " ") : "") + el.charAt(0).toUpperCase() + el.slice(1);
		}, null);
	};
	E.capitalize = E.caps;
	
	E.replace = function ext_replace(src, obj) {
		var s = src;
		E.each(obj, function  ext_replace_each(v,k) {
			var r = new RegExp("%"+k.toUpperCase()+"%");
			s = s.replace(r, v);
		});
		return s;
	
	};
	
		/************  DATES ***************************/
	E.time = (function() { 
			if(!Date.now) {
				return function ext_time_old() { return new Date().getTime(); };
			} 
			return function ext_time() { return Date.now(); };
	}());	
	
	E.parseDate = function ext_moment(d) {
		E.deprecated("E.parseDate", "E.moment");
	};
	E.moment = function ext_moment(d, format) { return moment(d, format);	};
	E.dateNumber = function ext_dateNumber(d, format) { return E.moment(d, format).valueOf();	};
	E.date = function ext_date(d, format) { return E.moment(d, format).toDate();	};

	//number is positive when db is earlier than da
	E.daysDiff = function ext_daysDiff(da, db) {return E.moment(da).diff(E.moment(db),"days");};
	E.weeksDiff = function ext_daysDiff(da, db) {return E.moment(da).diff(E.moment(db),"weeks");};
	E.monthsDiff = function ext_daysDiff(da, db) {return E.moment(da).diff(E.moment(db),"months");};
	E.yearsDiff = function ext_daysDiff(da, db) {return E.moment(da).diff(E.moment(db),"years");};
	E.daysFrom = function ext_daysDiff(da, db, noPrefix) {return E.moment(db).from(da, noPrefix||false); };
	E.today = function ext_today() { return new Date(); };
	E.minDate = function ext_minDate() { return E.moment(E.slice(arguments).sort(E.sortDate)[0]); };
	E.maxDate = function ext_maxDate() { return E.moment(E.slice(arguments).sort(E.sortDate).last()); };
	E.serverFormat = "YYYY/MM/DD";
	E.unixFormat = undefined;
	E.userFormat = function ext_userFormat() { 
		var u = sb.queries.user();
		var udf = u ? u.date_format : E.serverFormat;
		//E.debug("User date format: ", udf);
		return udf;
	};
	E.serverDate = function ext_serverDate(d,format) { return E.moment(d,format).format(E.serverFormat); };
	E.serverMoment = function ext_serverDate(d) { return E.moment(d,E.serverFormat); };
	E.month = function ext_date(d, format) { return E.moment(d,format).format("MMM (YYYY)");	};
	E.userDate = function ext_userDate(d, format) { return E.moment(d,format).format( E.userFormat()); };
	E.dateFromNow = function ext_dateFromNow(d, format, reverse) { 
		if(reverse) {
			return "(" + moment(d).fromNow() + ") " + moment(d).format(format || E.userFormat());
		} 
		return moment(d).format(format || E.userFormat()) + " (" + moment(d).fromNow() + ")";
	};
	E.fromNow = function ext_fromNow(d, format) {		return moment(d, format).fromNow();	};

	//return a standard format for searching via dates
	E.filterDateString = function ext_fromNow(d) {		return moment(d).format("YYYY MMMM DD");	};


		/************  REGEXPS ***************************/
	E.regEmail = new RegExp("([\\w-\\.]+)@((?:[\\w]+\\.)+)([a-zA-Z]{2,4})");
	E.regUrl = new RegExp("^https?:\/\/");
	
	
	
		/************  SORTING ***************************/
		//sort an array based on a property, and the function to use
		//so if an array is [{date:...,value:...},...], you can sort using E.sortProp("date",E.sortDate); 
	E.sortFactory = function ext_sortFactory(prop, func, reverse) {
		func = func || E.sortString;
		reverse = reverse || false;
		return function ext_sortFactory_cb(a,b) {	
			var aprop = a ? a[prop] : null;
			var bprop = b ? b[prop] : null;
			return func(aprop, bprop) * (reverse ? -1 : 1);		
		};
	};
	E.sortTime = function ext_sortTime(a,b) { return E.sortNumbers(E.parseDate(a).getTime(), E.parseDate(b).getTime()); }; 
	E.sortNumber = function ext_sortNumber(a,b){ return a-b; };
	E.sortNumbers = E.sortNumber;
	E.sortNumStr = function ext_sortNumber(a,b){ return E.to_f(a)-E.to_f(b); };
	E.sortDay = function ext_sortDate(a,b){ return E.daysDiff(a,b); }; 
	E.sortDays = E.sortDay;
	E.sortDate = function ext_sortDate(a,b){ return E.sortNumber(E.dateNumber(a), E.dateNumber(b)); }; 
	E.sortDates = E.sortDate;
	E.sortString = function ext_sortString(a,b){ return String(a).localeCompare(String(b)); };
	E.sortStrings = E.sortString;
	E.sortBool = function ext_sortBool(a,b) { return E.sortNumber(E.bool(a)?1:0, E.bool(b)?1:0); };
	E.sortBoolean = E.sortBool;
	 
	E.sortDateValue = function ext_sortDateValue(a,b) { return E.sortDate(a.date,b.date); };
	E.sortUsers = function ext_sortUsers(a,b) {  return (E.sortFactory("last_name", E.sortString))(a,b); };
	E.sortFocus = function ext_sortFocus(a,b) {  return (E.sortFactory("title", E.sortString))(a,b); };
	E.sortName = function ext_sortName(a,b) {  return (E.sortFactory("name", E.sortString))(a,b); };
	E.sortBlocksByProgress = function ext_sortBlocksByProgress(a,b) {
		//closed blocks 
		var ac = a.closed, bc = b.closed;
		if(ac && !bc) { return 1; }
		if(!ac && bc) { return -1; }
		
		var an=a.ownership_state == "new", bn = b.ownership_state=="new"; 
		if(an && !bn) { return 1; }
		if(!an && bn) { return -1; }
		
		if( (an && bn) || (ac && bc)) { 
			return E.sortString(a.title,b.title); 
		}

		var aep = a.expected_progress, bep = b.expected_progress;
		//return the one which has started over the one which hasn't.
		if(!aep && bep ) { return 1; }  
		if(aep  && !bep ) { return -1; }
		if(!aep && !bep) { return 0; }
		
		//Now, both have started. Return the variance diff
		return E.sortNumbers( (a.percent_progress/aep), (b.percent_progress/bep) );
	};

	E.bool = function ext_bool(b){ 
		return E.isStr(b) ? (b === "true") : b;
	};
		
		/************  CSS ***************************/
	E.px = function ext_px(number) {		return [number,"px"].join("");	};
	E.pc = function ext_pc(number) {		return [number,"%"].join("");	};
		
		//************  Math ***************************/



	E.roundTo = function ext_roundTo(number, dec) {
		var val = Math.pow(10,E.number(dec,0));
		return Math.round(number * val)/val;
	};
	E.floorTo = function ext_floorTo(number, dec) {
		var val = Math.pow(10,E.number(dec,0));
		return Math.floor(number * val)/val;
	};
	E.ceilTo = function ext_ceilTo(number, dec) {
		var val = Math.pow(10,E.number(dec,0));
		return Math.ceil(number * val)/val;
	};

	E.to_i = function ext_to_i(str, base, def/*=0*/) {
		var i = parseInt(str, base||10);
		return isNaN(i) ? E.number(def,0) : i; 
	};
	E.to_f = function ext_to_f(str, def/*=0*/) {
		var f = parseFloat(str);
		return isNaN(f) ? E.number(def,0) : f; 
	};
	E.rand = function ext_rand(min, max, dec/*==0*/) {
		return E.floorTo( (Math.random() * (max - min + 1)), dec) + min;
	};
	E.to_color = function ext_to_color(num) {
		return '#' +  ('00000' + (num | 0).toString(16)).substr(-6);
	};

	//turns #FFFFFF into rgba(255,255,255,0.5) where alpha is between 0 - 1.
	E.color_to_rgba = function ext_color_to_rgba(hex, alpha) {
		hex = hex.replace('#','');
		var r = parseInt(hex.substring(0,2), 16);
		var g = parseInt(hex.substring(2,4), 16);
		var b = parseInt(hex.substring(4,6), 16);

		var result = 'rgba('+r+','+g+','+b+','+alpha+')';
		return result;
	};
	E.hex_to_rgba = E.color_to_rgba;

	//str in #ff4455 or 0x004340 format to int
	E.from_color = function ext_from_color(str) {
		//handle an existing number
		if(E.isNum(str)) { return str; }

		//str is a string
		str = str.replace("#", "0x");
		return E.to_i(str, 16);
	};
	
	//quick version of E.number for just strings. 
	E.to_num = function ext_to_num(str) {
		return +str;
	};

	// The argument [n] can be:
	//		literal numbers (e.g., 24)
	//		a function that returns a number n==foo, where foo() returns 24
	//		an array with a function as the first argument, so n=[foo, "bar", "stuff"] and foo("bar", "stuff") returns 24
	//		a string that can be converted to number by coercing it
	E.number = function ext_number(n,def/*==0*/) {
		n = E.isStr(n) ? +n : (
				E.isFunc(n) ? n() : (
					E.isArr(n) && E.isFunc(n[0]) ? 
						n[0].apply(null, n.slice(1)) : 
						n		
				)
			)
		;
		return isNaN(n) ? (def||0) : n;
	};
	E.max = function ext_max(/*etc....*/) {
		var args =E.slice(arguments).map(function ext_max_map(el) {return E.number(el,Number.NEGATIVE_INFINITY);});
		var max = args.reduce(function  ext_max_reduce(prev,el){
			return prev > el ? prev : el;
		},Number.NEGATIVE_INFINITY);

		return max;
	};
	E.min = function ext_min(/*etc....*/) {
		var args =E.slice(arguments).map(function ext_min_map(el) {return E.number(el,Number.POSITIVE_INFINITY);});
		var min = args.reduce(function ext_min_reduce(prev,el){
			return prev < el ? prev : el;
		},Number.POSITIVE_INFINITY);

		return min;
	};

	//return the first argument that is !NaN
	E.first = function ext_first(/*etc...*/) {
		var i, args = E.slice(arguments);
		for(i = 0; i < args.length; ++i) {
			if(!isNaN(args[i])) {
				return args[i];
			}
		}
		return NaN;
	};

	//given a value and a total, returns a rounded percentage out of 100
	// e.g., percent(3, 7, 1) returns 42.9
	E.percent = function ext_percent(val, total, round/*==0*/) {
		round = E.first(round,0);
		return E.roundTo(  (E.number(val) / E.number(total))*100, round );
	}

	E.range = function ext_range(min,max,num) {
		return E.max(min, E.min(max,num));
	};

	//given a list of numbers, returns the one closest to "num"
	E.snapto = function ext_snapto(list, num) {
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
	E.sum = function ext_sum() {
		var args =E.slice(arguments).map(function ext_sum_map(el) {return E.number(el);});
		var sum = args.reduce(function ext_sum_reduce(prev,el){
			return prev + E.number(el);
		},0);

		return sum;

	};

	//SUBTRACT: takes an array of literals or functions and subtracts them the first element in the list
	E.diff = function ext_diff() {
		var base = E.number(arguments[0]);
		var args  = E.slice(arguments,1).map(function ext_diff_map(el) {return E.number(el);});
		var diff = args.reduce(function ext_diff_reduce(prev,el){
			return prev - E.number(el);
		},base);

		return diff;
	};

	//takes an array of literals or functions and multiplies the result
	E.prod = function ext_prod() {
		var args =E.slice(arguments).map(function ext_prod_map(el) {return E.number(el,1);});
		var prod = args.reduce(function ext_prod_reduce(prev,el){
			return prev * E.number(el);
		},1);

		return prod;

	};
	//compare two numbers and return true if their difference is less/equals to "within".
	//the purpose of this function is to ameliorate problems with DOM co-ords
	E.compareInt = function ext_compareInt(a,b,within/*==0*/) {
		within = E.number(within,0);
		return Math.abs(a-b) <= within;
	};
		
	E.absDiff = function  ext_absDiff(a,b) {
		return (a === b) ? 0 : Math.abs(a-b);
	};


	E.domain = function ext_domain(type,min,max, pc) {
		pc = E.first(pc, 0);

		if(type === "date") {
			min = E.moment(min);
			max = E.moment(max);
			var pad = E.daysDiff(max, min) * pc;
			min = min.subtract(pad, "days").toDate();
			max = max.add(pad, "days").toDate();
		} else { 
			//(!type || type === "number") {
			var pad = (max - min) * pc;
			min -= pad;
			max += pad;
		}
		return [min,max];
	};

	E.fixRect = function(rect) {
		return {
			x: E.first(rect.x, rect.left),
			y: E.first(rect.y, rect.top),
			width:rect.width,
			height:rect.height
		};
	};

	E.rectDiff = function ext_rectDiff(target, reference) {
		target = E.fixRect(target);
		reference = E.fixRect(reference);
		return {
			x: 		(target.x - reference.x), 
			y:		(target.y - reference.y), 
			width:	target.width, 
			height:	target.height
		};

	}

		/************  BLOCK COLOR CONSTANTS***************************/
		//status is -1 (red), 0 (yellow), and 1 (green)

	E.healthColor = function ext_healthColor(data) { return (["#67b41f","#d3a900","#b41f27"])[data.status+1]; };
	E.healthText = function ext_healthText(data) { return (["Bad","Warning","Good"])[data.status+1]; };
	E.progressColor = function ext_progressColor(block) {
		//support passing just the color
		block = block || "none";
		block = E.isStr(block) ? block : ( (block.closed || block.ownership_state=="new") ? "" : block.progress_color);
		block = block || "none";

		switch(block) {
			case "green": 	return ["#196419", 		"url(#progressGood)", 		"url(#progressHatchGood)" 		,["#67b41f", "#508121"] ];
			case "yellow":	return ["#7d741f", 		"url(#progressWarning)",	"url(#progressHatchWarning)"	,["#d3a900", "#95780d"] ];
			case "red": 	return ["#7d1f1f", 		"url(#progressBad)",		"url(#progressHatchBad)" 		,["#b41f27", "#812127"] ];
			default: 		return ["#999", 		"url(#progressNone)",		"url(#progressHatchNone)" 		,["#999", "#aaa"]  ];
		}
	};





		
	/************  MASSAGE SERVER DATA INTO BETTER OBJECTS FOR D3/presentation ***************************/
	E.getResultMessages = function ext_getResultMessages(r) {
		var res = {
			errors:null,
			warnings: null,
			notices:null
		};
		if (r) {
			//errors that mean something in the form was incorrect, hopefully out of our control (e.g., bad input from user)
			if(E.isArray(r.result)) {
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
	E.massageTA = function ext_massageTA(data) {
		var dates = [E.today()];

		data.values = data.values && data.values.length ? data.values : [{date:dates[0], value:0, comment:"(today, interpolated)", interpolated:true}]; 
		data.target = data.target && data.target.length ? data.target : [{date:dates[0], value:0, comment:"(today, interpolated)", interpolated:true}]; 

		var dataMap = {};
		
		data.values.forEach(function ext_massageTA_forEachVal(el) {
			el.date = E.date(el.date);
			dates[dates.length] = (el.date);
		});
		data.values.sort(E.sortDateValue);
		if(E.daysDiff(data.values[0].date, dates[0]) > 0) {
			data.values.push({date:dates[0], value:data.values[0].value, comment:"(today, interpolated)", interpolated:true});
		} else if (E.daysDiff(data.values.last().date, dates[0]) < 0) {
			data.values.push({date:dates[0], value:data.values.last().value, comment:"(today,interpolated)", interpolated:true});
		}
		
		data.target.forEach(function ext_massageTA_forEachTar(el) {
			el.date = E.date(el.date);
			dates[dates.length] = (el.date);
			var rs = data.tolerance.range_start > data.tolerance.range_end ? data.tolerance.range_start : data.tolerance.range_end;
			var re = data.tolerance.range_start > data.tolerance.range_end ? data.tolerance.range_end : data.tolerance.range_start;
			
			el.upper = el.value  + (data.tolerance.percentage ? (el.value *rs/100) : rs);
			el.lower = el.value  + (data.tolerance.percentage ? (el.value *re/100) : re);
		});
		data.target.sort(E.sortDateValue);
		if(E.daysDiff(data.target[0], dates[0]) > 0) {
			data.target.push({date:dates[0], value:data.target[0], comment:"(today, interpolated)", interpolated:true});
		} else if (E.daysDiff(data.target.last(), dates[0]) > 0) {
			data.target.push({date:dates[0], value:data.target.last(), comment:"(today,interpolated)", interpolated:true});
		}
		
		data.dates = dates.sort(E.sortDate);

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
			if(E.daysDiff(vd.date, tsd.date) <= 0) {
				vd.target = tsd.value; v++; continue;
			}
			//v is after next target
			if(E.daysDiff(vd.date, tnd.date) > 0) {
				if(tn == tdata.length-1) {
					vd.target = tnd.value;
					v++; continue; 
				} else {
					ts++; tn++; continue;
				}
			}

			//v is before tn but after ts
			if(E.daysDiff(vd.date, tnd.date) <=0 ) {
				var tsn = E.dateNumber(tsd.date);
				var tnn = E.dateNumber(tnd.date);
				var vn = E.dateNumber(vd.date);

				vd.target = tsd.value + (((tnn-vn)/(tnn-tsn)) * (tnd.value - tsd.value));
				v++;
			}

		}

		return data;
	};

	
	E.massageKpi = function ext_massageKpi(data) {
		//fix legacy code issue
		data.values = data.values || data.actuals;
		data = E.massageTA(data);

		var vd = data.values;
		var td = data.target;
		
		var minY = Number.POSITIVE_INFINITY;
		var maxY = Number.NEGATIVE_INFINITY;
		
		
		if(vd.length && td.length) {
			//push a target at the front to line up with values
			if(E.daysDiff(data.dates[0], td[0].date) < 0) {
				td.unshift( { value:td[0].value, upper:td[0].upper, lower:td[0].lower,
								date:data.dates[0], comment:"(First value, interpolated)" } );
			} 
			//push a target at the end to line up with values
			if(E.daysDiff(data.dates.last(), td.last().date) > 0) {
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
		E.each(vd, function(el) {
			minA = E.min( el.value, minA );
			maxA = E.max( el.value, maxA );
			el.id = el.id || ("actual_" + E.unique());
		});
		var minT = td[0].value;
		var maxT = td[0].value;
		E.each(td, function(el) {
			minT = E.min( el.value, minT );
			maxT = E.max( el.value, maxT );
			el.id = el.id || ("target_" + E.unique());
		});
		
		var upper = E.max(data.tolerance.range_end, data.tolerance.range_start) / (pc ? 100 : 1);
		var lower = E.min(data.tolerance.range_end, data.tolerance.range_start) / (pc ? 100 : 1);

		var ml;
		var mu;
		if (!pc) {
			ml = minT + lower;
			mu = maxT + upper;
		} else {
			ml = minT + (lower * minT);
			mu  = maxT + (upper * maxT);
		}
		
		ml = E.min(ml, minT) - E.absDiff(minT, ml)*0.02;
		mu = E.max(mu, maxT) + E.absDiff(maxT, mu)*0.02;
		

		data.minY = E.min(minA, minT, ml);
		data.maxY = E.max(maxA, maxT, mu);
		
		
		var offset = (E.absDiff(data.maxY, data.minY) * 0.05) || 10;
		data.minY -= offset;
		data.maxY += offset;

		//fix legacy code issue
		data.actuals = data.values;
		return data;		
	};
		
		//fix dates and sort history for health charts
	E.massageHealth = function ext_massageHealth(data) {
		var dates = [];
		var series = E.map(data.historical_values, function ext_massageHealth_map(v, k) {
			return {date: E.date(k), value:v};
		});
		
							//sort by the date number
		data.series = series.sort(E.sortDateValue);
		
		data.dates = E.values(data.series, "date");
		data.dates.push(Date.parse(data.end_date));
	
		return data;
	
	};
	
	
	//source gets priority over target
	//all source properties are applied to target.
	//  EXCEPT the ones in ignore.
	//	ignore can be an array of names, or an object with keys. All these key names are skipped from being applied,
	//	but they will not be removed from target if they exist there. 
	E.mixin = function ext_mixin (/*Object*/ target, /*Object*/ source, /*Object or Array*/ ignore ){
		var empty = ignore || {}; //default template for properties to ignore
		target = target || {};
		source = source || {};
		
		var name, s;
		for(name in source){
			s = source[name];
			var skip =  E.isArray(empty) ? (empty.indexOf(name) >= 0) : (empty.hasOwnProperty(name));
			if(skip) { continue; }
			target[name] = s;
		}
		return target; // Object
	};
	 
	// Create a new object, combining the properties of the passed objects with the last arguments having
	// priority over the first ones
	//WARNING: Multiple objects to be combined should be passed in as an array. The second argument is a list of
	//properties to ignore. 
	E.combine = function ext_combine( /*Object or array*/ props, /*object or array*/ ignore) {
		props = E.isArray(props) ? props : [props];
		var res = props.reduce(function ext_combine_reduce(newObj, v) {
			var mixed = E.mixin(newObj, v, ignore);
			return mixed;
		},{});
		return res;
	};		
	//same as combine but only takes two properties.
	//A takes precedence over A when overlaps occur
	E.merge = function ext_merge(a, b, ignore) {
		return E.combine([a||{},b||{}], ignore);	
	};

	//cherry pick the key/values of an object and clone them into a new one
	E.cherryPick = function ext_clone(o, props) {
		if(!props) { return E.mixin(null, o); }
		if(E.isStr(props)) {
			props = props.split(",");
		}
		var res = {};
		props.forEach(function(prop){
			res[prop] = o[prop];
		});
		return res; 

	};

	//return the number of differences from diff to orig
	E.changes = function ext_changes(diff,orig, keys) {
		keys = keys || [];
		var res = {};
		orig = orig || {};
		E.each(diff, function(v,k) {
			if( (!keys.length || keys.indexOf(k) >-1) &&  orig[k] != v) {
				res[k] = v;
			}
		});
		return res;
	};
	//return the number of differences from diff to orig
	E.hasChanges = function ext_changes(diff,orig, keys) {
		keys = keys || [];
		var res = {};
		orig = orig || {};
		return E._.some(diff, function(v,k) {
			if( (!keys.length || keys.indexOf(k) >-1) &&  orig[k] != v) {
				return true;
			}
			return false;
		});
	};


	//take a list of "complete" length and merge the sparse "smaller" into it by matching keys
	//returns an object with "key" as the key
	E.mergeLists = function ext_mergeLists(larger,smaller, key) {
		larger = E.toObject(larger||[], key);
		E.each(smaller, function(v) {
			if(!v.name) {
				console.log("wtf");
			}
			larger[v.name] = v;
		});

		return larger;
	};

	//dumb string to object function
	//doesn't parse values from string to, say, number, array, etc like JSON. 
	// String keys, String values
	E.fromStr = function ext_fromStr(str, elSep, valSep) {
		var o = {};
		elSep = elSep || ";";
		valSep = valSep || ":";
		str = str.split(elSep);
		E.each(str, function(v) {
			v = v.split(valSep);
			if(v[0]) {
				o[String(v[0]).trim()] = String(v[1]).trim();
			}
		});
		return o;
	};

	E.template = function ext_template(obj, template, defaults) {
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
