/*globals define, Ti, console, d3*/
/*jslint passfail: false */


define(["sb_light/globals", "lodash", "moment", "d3"], function(sb, _, MOMENT) {
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
	E.unique = function ext_unique(prefix, suffix) {
		if(arguments.length) {
			var str = [E.time()+"_"+(E._unique++)];
			if(prefix) { str.unshift(prefix); }
			if(suffix) { str.push(suffix); }
			return str.join("_");
		} else {
			return (E.time()+"-"+(E._unique++));
		}
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
		if(E.global("API")) {
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
			for(var k in list) {
				init = fn.call(scope|| list, init, list[k], k, list);
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
		key = key || "id";
		return list.reduce(function ext_toObject_reduce(prev, el) {
			prev[el[key]] = el;
			return prev;
		}, {});
	};

	//takes a hash map / array and returns an array of values. 
	E.values = function ext_values(map, keyName, func) {
		return E.map(map, function ext_values_map(el) { 
			var ret = keyName ? el[keyName] : el;
			if(func) {
				ret = func(ret);
			}
			return ret;
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


	//Appends the elements of B which are not in A and unions them based on a property value (prop)
	//match is based 
	E.union = function(a, b, prop) {
		var res = E.map(a, E.identity);
		var match = {}; 
		return E._.union(res, E.filter(b, function() {
			match[prop] = b[prop];
			return !E._.find(a, match); 
		}));
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
	//return the first key from doing a for-in on the map
	//WARNING: this may not be consisten. The order is arbitrary. 
	//			this is only useful if you just want a valid key, and it doesn't matter which one (e.g., a default setting)
	E.firstValue = function ext_keys(map) {
		if(!map) { return null; }
		var k;
		for(k in map) { return map[k]; }
	};	

	//simplify array join syntax for when I need to create the array as well
	E.join = function ext_join(ch /*, arguments:an array or a list of arguments to join */) {
		var arr =  E.slice(arguments,1);
		arr = (arr.length == 1 && E.isArr(arr[0])) ? arr[0] : arr;
		return arr.join(ch);
	};

	E.cloneArray = function(arr) {
		return arr.map(function(v) { return E.merge(v); });
	};

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
		return MOMENT.isMoment(obj) || Object.prototype.toString.call(obj) == "[object Date]";
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
	
	E.lower = function ext_lower(str) {
		return E.isStr(str) ? str.toLowerCase() : "";
	};

	E.replace = function ext_replace(src, obj) {
		var s = src;
		E.each(obj, function  ext_replace_each(v,k) {
			var r = new RegExp("%"+k.toUpperCase()+"%");
			s = s.replace(r, v);
		});
		return s;
	
	};

	E.shorten = function ext_shorten(str, maxLen) {
		if(!str || str.length < maxLen) { return str; }
		var size = Math.floor( (maxLen-3) /2);
		return [str.substr(0,size), "...", str.substr(str.length-size)].join("");
	};


	E._escapeMap = {
	    "&": "&amp;",
	    "<": "&lt;",
	    ">": "&gt;",
	    '"': '&quot;',
	    "'": '&#39;',
	    "/": '&#x2F;'
	};

	E.escapeHTML = function ext_escapeHTML(string) {
		return String(string).replace(/[&<>"'\/]/g, function (s) {
    		return E._escapeMap[s];
    	});
	};

	
		/************  DATES ***************************/
	E.time = (function() { 
			if(!Date.now) {
				return function ext_time_old() { return new Date().getTime(); };
			} 
			return function ext_time() { return Date.now(); };
	}());	
	
	E.parseDate = function ext_moment() {
		E.deprecated("E.parseDate", "E.moment");
	};
	E.parseUnix = function ext_parseUnix(dn) {	return MOMENT.unix(dn); };
	E.moment = MOMENT;
	E.momentFn = function(date, format) {
		if(E.isStr(date) && !format) {
			format = E.serverFormat;
		}
		return E.moment(date, format);
	};
	E.dateNumber = function ext_dateNumber(d, format) { return E.moment(d, format).valueOf();	};
	E.date = function ext_date(d, format) { return E.moment(d, format).toDate();	};

	//number is positive when db (e.g., start date) is earlier than da (eg., end date)
	E.isFuture = function ext_isFuture(d) { return E.momentFn(d).diff(E.today(), "days") > 0; };
	E.minutesDiff = function ext_minutesDiff(da, db) {return E.momentFn(da).diff(E.momentFn(db),"minutes");};
	E.hoursDiff = function ext_hoursDiff(da, db) {return E.momentFn(da).diff(E.momentFn(db),"hours");};
	E.daysDiff = function ext_daysDiff(da, db) {return E.momentFn(da).diff(E.momentFn(db),"days");};
	E.weeksDiff = function ext_weeksDiff(da, db) {return E.momentFn(da).diff(E.momentFn(db),"weeks");};
	E.monthsDiff = function ext_monthsDiff(da, db) {return E.momentFn(da).diff(E.momentFn(db),"months");};
	E.yearsDiff = function ext_yearsDiff(da, db) {return E.momentFn(da).diff(E.momentFn(db),"years");};

	//returns a string showing the time difference in the most logical format
	E.dateDifference =	function ext_difference(da,db) {
		var dd = E.roundTo(Math.abs(da.diff(db, "days", true)),0);
		var wd = E.roundTo(Math.abs(da.diff(db, "weeks", true)),0);
		var md = E.roundTo(Math.abs(da.diff(db, "months", true)),0);
		var yd = E.roundTo(Math.abs(da.diff(db, "years", true)),0);

		//show days if less than 2 weeks
		if(dd < 14) { return dd + " days"; }
		if(wd < 10) { return wd + " weeks"; }
		if(md < 18) { return md + " months"; }

		return yd + " years";
	}

	E.daysFrom = function ext_daysFrom(da, db, noPrefix) {return E.momentFn(db).from(da, noPrefix||false); };
	E.today = function ext_today() { return E.todayMoment().toDate(); };
	E.todayMoment = function ext_today_moment() { return E.moment().startOf("day"); };
	E.minDate = function ext_minDate(dates) { 	return MOMENT.min.apply(null, arguments.length > 1 ? E.slice(arguments) : dates); 	};
	E.maxDate = function ext_maxDate(dates) { 	return MOMENT.max.apply(null, arguments.length > 1 ? E.slice(arguments) : dates); 	};
	E.rangeDate = function ext_maxDate(date, start,end) { 	return E.minDate(start, E.maxDate(end, date)); };
	E.serverFormat = "YYYY/MM/DD";
	E.unixFormat = "YYYY/MM/DD HH:mm:ss Z";
	
	//07 Jun 2015 22:08 +0000
	E.adminFormat = "DD MMM YYYY HH:mm Z";

	E.userFormat = function ext_userFormat() { 
		var u = sb.queries.user();
		var udf = u ? u.date_format : E.serverFormat;
		//E.debug("User date format: ", udf);
		return udf;
	};
	E.serverDate = function ext_serverDate(d,format) { return E.moment(d,format||(E.isStr(d) ? E.serverFormat: undefined)).format(E.serverFormat); };
	E.serverMoment = function ext_serverMoment(d) { return E.moment(d,E.serverFormat); };
	E.serverToDate = function ext_serverToDate(d) { return E.serverMoment(d).toDate(); };
	E.month = function ext_date(d, format) { return E.moment(d,format).format("MMM (YYYY)");	};
	E.userDate = function ext_userDate(d, format) { return E.moment(d,format||(E.isStr(d) ? E.serverFormat: undefined)).format( E.userFormat()); };
	E.dateFromNow = function ext_dateFromNow(d, format, reverse) { 
		d = E.momentFn(d, format);
		if(reverse) {
			return d.fromNow() + " (" +  d.format(format || E.userFormat()) + ")";
		} 
		return d.format(format || E.userFormat()) + " (" + d.fromNow() + ")";
	};
	E.fromNow = function ext_fromNow(d, format) {		return E.moment(d, format).fromNow();	};

	//return a standard format for searching via dates
	E.filterDateString = function ext_fromNow(d) {		return E.momentFn(d).format("YYYY MMMM DD");	};


		/************  REGEXPS ***************************/
	E.regEmail = new RegExp("([\\w-\\.]+)@((?:[\\w]+\\.)+)([a-zA-Z]{2,4})");
	E.regUrl = new RegExp("^https?:\/\/");
	E.regHtml = new RegExp("</?\w+\s+[\^>]*>");

	
	
	
		/************  SORTING ***************************/
		//sort an array based on a property, and the function to use
		//so if an array is [{date:...,value:...},...], you can sort using E.sortProp("date",E.sortDate); 
	E.sortFactory = function ext_sortFactory(prop, func, reverse, prepFunc) {
		func = func || E.sortString;
		reverse = reverse || false;
		return function ext_sortFactory_cb(a,b) {	
			var aprop = a ? a[prop] : null;
			var bprop = b ? b[prop] : null;
			if(E.isFunc(prepFunc)) {
				aprop = prepFunc(aprop);
				bprop = prepFunc(bprop);
			}
			return func(aprop, bprop) * (reverse ? -1 : 1);		
		};
	};


	E.sortTime = function ext_sortTime(a,b) { return E.sortNumbers(E.parseDate(a).getTime(), E.parseDate(b).getTime()); }; 
	E.sortNumber = function ext_sortNumber(a,b){ return a-b; };
	E.sortNumbers = E.sortNumber;
	E.sortNumStr = function ext_sortNumber(a,b){ return E.to_f(a)-E.to_f(b); };
	E.sortDay = function ext_sortDate(a,b){ return E.daysDiff(a,b); }; 
	E.sortDays = E.sortDay;
	//b is larger, result is negative
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

	//SORT OUT THE CURRY
	E.parseUnixDate = _.curry(E.momentFn)(_, E.unixFormat);
	E.sortUnixDate = _.curry(E.sortFactory)(_, E.sortDate, _, E.parseUnixDate);
	E.parseServerDate = _.curry(E.momentFn)(_, E.serverFormat);

	//requires property name, and whether to reverse it (newest first)
	E.sortServerDate = _.curry(E.sortFactory)(_, E.sortDate, _, E.parseServerDate);


	E.sortByOrder = function(list, props, orders) {
		var orders = E.map( (orders||[]), function(v) {
			return E.isBool(v) ? (v?'asc':'desc') : v;
		});
		return E._.orderBy.call(this, list,props,orders);
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

	E.roundEven = function ext_roundEven(number) {
		return 2 * Math.round(number/2);
	};

	//http://stackoverflow.com/questions/10454518/javascript-how-to-retrieve-the-number-of-decimals-of-a-string-number
	E.decimals = function ext_decimalCount(num) {
		var match = (''+num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
		if (!match) { return 0; }
		return Math.max(
			 0,
			 // Number of digits right of decimal point.
			 (match[1] ? match[1].length : 0)
			 // Adjust for scientific notation.
			 - (match[2] ? +match[2] : 0))
		;
	};

	E.to_i = function ext_to_i(str, base/*==10*/, def/*=0*/) {
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
	E.random = E.rand;
	
	E.to_color = function ext_to_color(num) {
		return '#' +  ('00000' + (num | 0).toString(16)).substr(-6);
	};

	E.randomColor = function() {
		var color = d3.scale.linear()
			.domain([0, 0.5, 1])
			.range(["red", "green", "blue"])
		;
		return color(Math.random());
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
		var num = +str;
		return E.isNum(num) ? num : str;
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
			var ci= args[i];
			if(E.isNum(ci) && !isNaN(ci)) {
				return ci;
			}
		}
		return NaN;
	};

	//given a value and a total, returns a rounded percentage out of 100
	// e.g., percent(3, 7, 1) returns 42.9
	E.percent = function ext_percent(val, total, round/*==0*/) {
		round = E.first(round,0);
		return E.roundTo(  (E.number(val) / E.number(total))*100, round );
	};

	E.range = function ext_range(min,max,num) {
		return E.max(min, E.min(max,num));
	};

	E.minmax = function ext_mimmax(list) {
		return [E.min.apply(null,list), E.max.apply(null,list)];
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

	E.variance = function ext_variance(actual,target) {
		var v = 0;
		var a = actual; 
		var b = target;


		if 			(a === b) 	{ v = 0; }
		else if 	(b === 0) 	{ v = a; }
		else 				 	{ v = a/b - 1;}

		// console.log("VARIANCE", a, b, v);
		return E.roundTo(E.range(-1, v, 1) * 100, 1);
	};



	//event handler function generator where we are using Jquery or D3 and want to bind to a class function
	//but also maintain the event's context
	//So, generally, call E.$Handler(this, "myfunc") where "myfunc" is a member function of "this" class
	//	This returns a function than can be bound to events where the event context is important as well. 
	//	myFunc would then appear as: 
	//		myFunc: function(eventContext, ...args) {
	//			"this" is the class that defined "myFunc"
	//			"eventContext" is the element that triggered the event
	//		}
	
	E.$Handler = function(context, func) {
		var origArgs = E.slice(arguments, 2);
		if(E.isStr(func)) {
			func = context[func];
		}
		if(!E.isFunc(func)) { 
			throw Error("E.$Handler expects a function", arguments); 
		}
		return function()  {
			//push the current context in with the arguments
			var args = origArgs.concat([this]).concat(E.slice(arguments));
			func.apply(context, args);
		};
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


	E.domain = function ext_domain(type,min,max, pcA, pcB) {
		pcA = E.first(pcA, 0);
		pcB = E.first(pcB, pcA, 0);

		var padA, padB;
		if(type === "date") {
			min = E.moment(min);
			max = E.moment(max);
			padA = E.daysDiff(max, min) * pcA;
			padB = E.daysDiff(max, min) * pcB;
			min = min.subtract(padA, "days").toDate();
			max = max.add(padB, "days").toDate();
		} else { 
			//(!type || type === "number") {
			padA = (max - min) * pcA;
			padB = (max - min) * pcB;
			min -= padA;
			max += padB;
		}

		if(type === "bar") {
			if(min > 0) { min = 0;	}
			if(max < 0) { max = 0;	}
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

	};

		/************  BLOCK COLOR CONSTANTS***************************/
		//status is -1 (red), 0 (yellow), and 1 (green)

	E.healthColor = function ext_healthColor(data) { return (["#b41f27","#d3a900","#67b41f"])[data.status+1]; };
	E.healthText = function ext_healthText(data) { return (["Bad","Warning","Good"])[data.status+1]; };
	E.progressColor = function ext_progressColor(block) {
		// //support passing just the color
		block = block || "none";
		block = E.isStr(block) ? block : ( (block.closed || block.ownership_state=="new") ? "" : block.progress_color);
		block = block || "none";
		return sb.colors.statusColor(block);
	};





		
		
		//merge the target and actuals series into one array of objects. 
	E.massageTA = function ext_massageTA(data) {
		var dates = [E.today()];

		data.values = data.values && data.values.length ? data.values : [{date:dates[0], value:0, comment:"(today, interpolated)", interpolated:true}]; 
		data.target = data.target && data.target.length ? data.target : [{date:dates[0], value:0, comment:"(today, interpolated)", interpolated:true}]; 

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

	
	
		
		//fix dates and sort history for health charts
	E.massageHealth = function ext_massageHealth(data) {
		var series = E.map(data.historical_values, function ext_massageHealth_map(v, k) {
			return {date: E.serverMoment(k), value:v};
		});
		
							//sort by the date number
		data.series = series.sort(E.sortDateValue);
		
		data.dates = E.values(data.series, "date");
		data.dates.push(Date.parse(data.end_date));

		data.status = data.status > 0 ? "good" : (data.status < 0 ? "bad" : "warning");
	
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
	//B takes precedence over A when overlaps occur
	E.merge = function ext_merge(a, b, ignore) {
		return $.extend({}, a,b); //E.combine([a||{},b||{}], ignore);	
	};

	//cherry pick the key/values of an object and clone them into a new one
	E.cherryPick = function ext_clone(o, props) {
		if(!props) { return E.mixin(null, o); }
		if(E.isStr(props)) {
			props = props.split(",");
		}
		var res = {};
		props.forEach(function(prop){
			if(o.hasOwnProperty(prop)) {
				res[prop] = o[prop];
			}
		});
		return res; 
	};


	//compares two arrays for changes. Assuming the arrays are lists of objects, we compare the properties  
	//this also assumes they are sorted in the same order
	E.listHasChanges = function(a, b, keys) {
		if(!a || !b || a.length != b.length) { return true; }

		//limit the keys compared or use all the keys in the first element of A.
		keys = keys || E.keys(a[0]);

		//iterate through A and assume B is sorted the same
		return E._.some(a, function(av, i) {
			var bv = b[i];
			//iterate the keys and compare
			return E._.some(keys, function(k) {
				if(av[k] != bv[k]) { return true; }
				return false;
			});
		});
	};


	E.compare = function(a,b) {
		///yup == not ===
		if(a == b) { return true; }
		if(E.isArray(a) && E.isArray(b)) {
			return a.length == b.length && E._.difference(a,b).length === 0;
		}
		return false;
	}; 



	//return the number of differences from diff to orig
	E.changes = function ext_changes(diff,orig, keys) {
		keys = keys || [];
		var res = {};
		orig = orig || {};
		E.each(diff, function(v,k) {
			if( (!keys.length || keys.indexOf(k) >-1) &&  !E.compare(orig[k], v)) {
				res[k] = v;
			}
		});
		return res;
	};
	//return the number of differences from diff to orig
	E.hasChanges = function ext_changes(diff,orig, keys) {
		keys = keys || [];
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
			if(!v || !v[key]) {
				console.log("wtf");
			}
			larger[v[key]] = v;
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
