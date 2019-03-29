/* globals define, SB_OPTIONS */
define(['sb_light/globals','sb_light/utils/ext','sb_light/api/queries', 'moment'], function(sb, E, Q,  MOMENT) {
	'use strict';

	var DATES = {};
	var D = DATES;



	D.serverFormat = MOMENT.HTML5_FMT.DATE;
	D.timeFormat = "YYYY-MM-DDThh:mm:ss Z";
	D.filterFormat = "YYYY MMMM DD"; //used for searching using month name
	D.monthFormat = "MMM (YYYY)"; //month display
	
	D.userFormat = function() { 
		var u = sb.queries.user();
		return  u ? u.date_format : D.serverFormat;
	};

	////////////////////////////PLUGINS TO MOMENT.JS////////////////////////////////////////
	MOMENT.fn.serverStr = function() {
		return this.format(D.serverFormat);
	};
	MOMENT.fn.userStr = function() {
		return this.format(D.userFormat());
	};
	MOMENT.fn.timeStr = function() {
		return this.format(D.timeFormat);
	};

	MOMENT.fn.filterStr = function() {
		return this.format(D.filterFormat);
	};

	MOMENT.fn.monthStr = function() {
		return this.format(D.monthFormat);
	};

	/////////////////////////////////////////////////////////////////////////////////////////



	D.create = function(adjustments) { 
		return D.change("today", adjustments);
	};

	D.change = function(d, adjustments, funcStr) {
		d = D.parse(d);
		adjustments = adjustments || {};
		E.each(adjustments, function(v,k) {
			switch(k){
				case "start_of": d = d.startOf(v); break;
				case "end_of": d = d.endOf(v); break;
				default:
					d = d.add(v, k);
			}
		});
		return (funcStr && d) ? d[funcStr]() : d; 
	};

	D.serverStr = function(date, adjustments) { return D.change(date, adjustments, "serverStr"); };
	D.userStr = function(date, adjustments) { return D.change(date, adjustments, "userStr"); };
	D.timeStr = function(date, adjustments) { return D.change(date, adjustments, "timeStr"); };
	D.filterStr = function(date, adjustments) { return D.change(date, adjustments, "filterStr");  };
	D.monthStr = function (date, adjustments) { return D.change(date, adjustments, "monthStr");	};

	//convert to a specific JS object
	D.number = function(date, adjustments) { return D.change(date, adjustments, "valueOf"); };
	D.date= function(date, adjustments) { return D.change(date, adjustments, "toDate"); };

	D.parse = function(date, format) {
		if(E.isStr(date)) {
			var m;

			if(date == 'today') { 
				m = MOMENT(); 
			} else {
				format = format || (date.length > 10 ? D.timeFormat : D.serverFormat);
				m = MOMENT(date,format);
			}

			if (format == D.serverFormat || date == "today") {
				m.set({
					hour: 12, 
					minute: 0
				});
			}
			return m;
		}
		// NULL , undefinded, 0, false, "" etc... will all return null
		return date ? MOMENT(date) : null;
	};

	//clone is nicer to use in code, but parse basically does the same thing when it's already a moment object.
	D.clone = D.parse;

	//to parse in a map. extra args in the map function messes with format argument in the parse func. 
	D.mapParse = function(v/*,i, arr*/) {
		return D.parse(v);
	};



	//parse from a user format to MOMENT
	D.parseUserDate = function(date) { return D.parse(date, D.userFormat()); };
	D.parseUserToServer = function(date) { return D.parseUserDate(date).serverStr(); };

	//Parse and output as a string
	D.parseToUser 	= function(date, format) { return D.parse(date,format).userStr(); 		};
	D.parseToServer = function(date, format) { return D.parse(date,format).serverStr(); 	};



	/*************************************************************************************
	/*****              FROM NOW                                       *******************
	/*************************************************************************************/
	D.serverTodayStr = D.serverStr("today");
	D.serverYesterdayStr = D.serverStr("today", {days: -1});
	D.serverTomorrowStr = D.serverStr("today", {days: 1});

	D.fromNow = function(dstr) {
		if (!arguments.length || !dstr) { 
			return 'Never'; 
		}
		switch(dstr) {
			case D.serverTodayStr: 		return "Today";
			case D.serverYesterdayStr: 	return "Yesterday";
			case D.serverTomorrowStr:  	return "Tomorrow";
			default:
				var m = MOMENT();
				var d = D.mapParse(dstr);
				if(dstr.length <= 10) {
					//set dates (not date-time) to be "now" for the purposes of the fromNow 
					d = d.set({hour:m.get('hour'), minute: m.get('minute')});
				}
				return d.fromNow();
		}
	};

	D.fromNowAfter = function(dstr) {
		return D.userStr(dstr) + " (" + D.fromNow(dstr) + ")";
	};

	D.fromNowBefore = function(dstr) {
		return D.fromNow(dstr) + " (" + D.userStr(dstr) + ")";
	};

	//days difference. 
	D.range = function(start, end, endOfDay/*=false*/) {
		if(!start || !end) { return "Never";}

		start = D.parse(start);
		end = D.parse(end);


		// start.endOf('day')
		// end.endOf('day')

		endOfDay = endOfDay ? 1 : 0;

		return end.diff(start, 'days') + endOfDay;
	};

	D.absFrom = function(start, end, endOfDay/*=false*/) {
		if(!start || !end) { return "Never";}
		
		var min = D.min(start, end);
		var max = D.max(start,end);

		var range = D.range(min,max, endOfDay);
		switch(range) {
			case 0: return "0 days";
			case 1: return "1 day";
			default:
				return MOMENT().from(MOMENT().add({days: range}), true);
		}
	};

	/*************************************************************************************
	/*****              Sorting / Comparing                            *******************
	/*************************************************************************************/
	D.compareDates = function(a,b) {
		return D.parse(a) - D.parse(b);
	};
	D.compareDays = function(a,b) {
		return D.range(a,b);
	};

	D.isFuture = function(a) {
		return D.range("today", a) > 0
	};

	D.min = function(dates) {
		dates = arguments.length > 1 ? E.slice(arguments) : dates;
		return MOMENT.min.apply(null, E._.map(dates, D.mapParse));
	};
	D.max = function(dates) {
		dates = arguments.length > 1 ? E.slice(arguments) : dates;
		return MOMENT.max.apply(null, E._.map(dates, D.mapParse));
	};
	D.minMap = function(list, key) {
		return D.min(E._.map(list, key));
	};
	D.maxMap = function(list, key) {
		return D.max(E._.map(list, key));
	};

	D.sortDates = E._.curry(E.sortFactory)(E._, D.compareDates, E._, D.parse);
	D.sortDays = E._.curry(E.sortFactory)(E._, D.compareDays, E._, D.parse);


	/*************************************************************************************
	/*****              HISTORIC DATES                                 *******************
	/*************************************************************************************/
	D.historicDateList = {
		"one_month": 		{unit:"months", 	subtract: 1, min_unit: "days", 		min:20, 	label: "One Month"},
		"two_months": 		{unit:"months", 	subtract: 2, min_unit: "days", 		min:40, 	label: "Two Months"},
		"one_quarter": 		{unit:"quarters", 	subtract: 1, min_unit: "months", 	min:2, 		label: "One Quarter"},
		"two_quarters": 	{unit:"quarters", 	subtract: 2, min_unit: "months", 	min:4, 		label: "Two Quarters"},
		"three_quarters": 	{unit:"quarters", 	subtract: 3, min_unit: "months", 	min:6, 		label: "Three Quarters"},
		"current_fy": 		{unit:"fyears",		subtract: 1, min_unit: "months",	min:1,		label: "Current FY"},
		"one_year": 		{unit:"years", 		subtract: 1, min_unit: "months", 	min:9, 		label: "One Year"},
		"previous_fy": 		{unit:"fyears",		subtract: 2, min_unit: "months",	min:13,		label: "Previous FY"},
		"two_years": 		{unit:"years", 		subtract: 2, min_unit: "months", 	min:18, 	label: "Two Years"},
		"three_years": 		{unit:"years", 		subtract: 3, min_unit: "months", 	min:24, 	label: "Three Years"},
	};

	//finds a period earliers that the current date, or passed date
	//subtract the period amount from the date, and then shift to the start of the month. 
	D.historicDate = function(str, date, fy/*MM/DD=null*/) {
		var cd = D.parse(date || "today");
		var def = D.historicDateList[str];

		var d = null;
		if(def) {
			if (def.unit == "fyears") {
				var ys = Q.yearStart();
				d = ys.subtract(def.subtract-1, "years");
			} else {
				d = cd.subtract(def.subtract, def.unit).startOf("month");
			}

		}
		return d;
	};


	/*************************************************************************************
	/*****              FUTURE DATES                                   *******************
	/*************************************************************************************/
	D.futureDateList = {
		"today": 		{unit:"day", label: "Today"},
		"month": 		{unit:"months", label: "End of Month"},
		"quarter": 		{unit:"quarters", label: "End of Quarter"},
		"current_fy": 	{unit: "fyears", label: "End of FY"},
		"year": 		{unit:"years", label: "End of Year"},
	};

	D.futureDate = function(str,date, fy/*MM/DD=null*/) {
		var cd = D.parse(date || "today");
		var def = D.futureDateList[str];

		var d = null;
		if(def) {
			d = (def.unit == "fyears") ? Q.yearEnd() : cd.endOf(def.unit);
		}
		return d;
	};








	//TEST THE FUNCTIONS ABOVE AS BEST WE CAN
	if(SB_OPTIONS.debug) {
		/* jshint laxcomma: true */
		var __TESTS = [
			 ["serverStr", 	[], 							null, 								"Date serverStr function failed"]
			,["serverStr", 	["today"], 						MOMENT(), 							"Date serverStr function failed"]
			,["serverStr", 	["today", {months:3}], 			MOMENT().add(3, "months"), 			"Date serverStr function failed to add 3 months "]
			,["serverStr", 	["today", {months:-3}], 		MOMENT().subtract(3, "months"), 	"Date serverStr function failed to subtract 3 months "]
			,["serverStr", 	["today", {M:3}], 				MOMENT().add(3, "months"), 			"Date serverStr function failed to add 3 months "]
			,["serverStr", 	["today", {M:-3}], 				MOMENT().subtract(3, "months"), 	"Date serverStr function failed to subtract 3 months "]
			,["serverStr", 	["today", {days:3}], 			MOMENT().add(3, "days"), 			"Date serverStr function failed to add 3 months "]
			,["serverStr", 	["today", {days:-3}], 			MOMENT().subtract(3, "days"), 		"Date serverStr function failed to subtract 3 months "]
			

			,["parseToServer", 		[new Date()], 			MOMENT(),			 		"Date parseToServer function failed parsing DATE"]
			,["parseToServer", 		[MOMENT()], 			MOMENT(), 					"Date parseToServer function failed parsing MOMENT"]
			,["parseToServer", 		["2001-1-1"], 			"2001-01-01", 				"Date parseToServer function failed parsing STRING in the past"]
			,["parseToServer", 		["2050-12-31"], 		"2050-12-31", 				"Date parseToServer function failed parsing STRING in the future"]

			,["fromNow",			[null],									"Never",			"Date fromNow failed to say NEVER"]
			,["fromNow",			[""],									"Never",			"Date fromNow failed to say NEVER"]
			,["fromNow",			[],										"Never",			"Date fromNow failed to say NEVER"]
			,["fromNow",			[D.serverStr()],						"Never",			"Date fromNow failed to say NEVER"]
			,["fromNow",			[D.serverStr("today")],					"Today",			"Date fromNow failed to say TODAY"]
			,["fromNow",			[D.serverStr("today", {days:-1})],		"Yesterday",		"Date fromNow failed to say YESTERDAY"] 
			,["fromNow",			[D.serverStr("today", {days:1})],		"Tomorrow",			"Date fromNow failed to say TOMORROW"] 


			,["absFrom",			[null, null, false],				"Never",			"Date absFrom failed"]
			,["absFrom",			[null, null, true],					"Never",			"Date absFrom failed"]
			,["absFrom",			["2001-02-02", "2001-02-02", false],"0 days",			"Date absFrom failed"]
			,["absFrom",			["2001-02-02", "2001-02-02", true],	"1 day",			"Date absFrom failed"]
			,["absFrom",			["2001-02-03", "2001-02-02", true],	"2 days",			"Date absFrom failed"]
			,["absFrom",			["2001-02-03", "2001-02-02", false],"1 day",			"Date absFrom failed"]
			,["absFrom",			["2001-02-03", "2001-02-17", false],"14 days",			"Date absFrom failed"]
			,["absFrom",			["2001-02-17", "2001-02-03", false],"14 days",			"Date absFrom failed"]
			,["absFrom",			["2001-02-03", "2001-03-17", false],"a month",			"Date absFrom failed"]
			,["absFrom",			["2001-03-17", "2001-02-03", false],"a month",			"Date absFrom failed"]




			//historic dates from october 12, 2016
			,["historicDate", 		["one_month", "2016-10-12"], 		"2016-09-01", 	"Date historicDate function failed one_month from october 12"]
			,["historicDate", 		["two_months", "2016-10-12"], 		"2016-08-01", 	"Date historicDate function failed two_months from october 12"]
			,["historicDate", 		["one_quarter", "2016-10-12"], 		"2016-07-01", 	"Date historicDate function failed one_quarter from october 12"]
			,["historicDate", 		["two_quarters", "2016-10-12"], 	"2016-04-01", 	"Date historicDate function failed two_qurters from october 12"]
			,["historicDate", 		["three_quarters", "2016-10-12"], 	"2016-01-01", 	"Date historicDate function failed three_qauarters from october 12"]
			,["historicDate", 		["one_year", "2016-10-12"], 		"2015-10-01", 	"Date historicDate function failed one_year from october 12"]
			,["historicDate", 		["two_years", "2016-10-12"], 		"2014-10-01", 	"Date historicDate function failed two_years from october 12"]
			,["historicDate", 		["three_years", "2016-10-12"], 		"2013-10-01", 	"Date historicDate function failed three_years from october 12"]
			//historic dates from may 04, 2017
			,["historicDate", 		["one_month", "2017-05-04"], 		"2017-04-01", 	"Date historicDate function failed one_month from May the forth be with you"]
			,["historicDate", 		["two_months", "2017-05-04"], 		"2017-03-01", 	"Date historicDate function failed two_months from May the forth be with you"]
			,["historicDate", 		["one_quarter", "2017-05-04"], 		"2017-02-01", 	"Date historicDate function failed one_quarter from May the forth be with you"]
			,["historicDate", 		["two_quarters", "2017-05-04"], 	"2016-11-01", 	"Date historicDate function failed two_qurters from May the forth be with you"]
			,["historicDate", 		["three_quarters", "2017-05-04"], 	"2016-08-01", 	"Date historicDate function failed three_qauarters from May the forth be with you"]
			,["historicDate", 		["one_year", "2017-05-04"], 		"2016-05-01", 	"Date historicDate function failed one_year from May the forth be with you"]
			,["historicDate", 		["two_years", "2017-05-04"], 		"2015-05-01", 	"Date historicDate function failed two_years from May the forth be with you"]
			,["historicDate", 		["three_years", "2017-05-04"], 		"2014-05-01", 	"Date historicDate function failed three_years from May the forth be with you"]
			//try today
			,["historicDate", 		["one_month"], 		MOMENT().subtract(1, "month").startOf("month"), "Date historicDate failed to handle TODAY"]
			,["historicDate", 		["GGGGGGGGG"], 		null, "Date historicDate failed to return null for invalid string"]
			,["historicDate", 		[null], 			null, "Date historicDate failed to return null for null"]

			//future dates
			,["futureDate", 		["all"], 		null, 						"Date futureDate failed to handle ALL"]
			,["futureDate", 		[null], 		null, 						"Date futureDate failed to handle null"]
			,["futureDate", 		["today"], 		MOMENT(), 					"Date futureDate failed to handle TODAY"]
			,["futureDate", 		["month"], 		MOMENT().endOf("month"), 	"Date futureDate failed to handle MONTH from TODAY"]
			,["futureDate", 		["quarter"], 	MOMENT().endOf("quarter"), 	"Date futureDate failed to handle QUARTER from TODAY"]
			,["futureDate", 		["year"], 		MOMENT().endOf("year"), 	"Date futureDate failed to handle YEAR from TODAY"]

			//future dates from october 12, 2016
			,["futureDate", 		["today", "2016-10-12"], 		"2016-10-12", 			"Date futureDate failed to handle Oct 12"]
			,["futureDate", 		["month", "2016-10-12"], 		"2016-10-31", 			"Date futureDate failed to handle MONTH from Oct 12"]
			,["futureDate", 		["quarter", "2016-10-12"], 		"2016-12-31", 			"Date futureDate failed to handle QUARTER from Oct 12"]
			,["futureDate", 		["year", "2016-10-12"], 		"2016-12-31", 			"Date futureDate failed to handle YEAR from Oct 12"]
			//future dates from may 04, 2017
			,["futureDate", 		["today", "2017-05-04"], 		"2017-05-04", 			"Date futureDate failed to handle May 04"]
			,["futureDate", 		["month", "2017-05-04"], 		"2017-05-31", 			"Date futureDate failed to handle MONTH from May 04"]
			,["futureDate", 		["quarter", "2017-05-04"], 		"2017-06-30", 			"Date futureDate failed to handle QUARTER from May 04"]
			,["futureDate", 		["year", "2017-05-04"], 		"2017-12-31", 			"Date futureDate failed to handle YEAR from May 04"]
		];


		E.each(__TESTS, function(v, i) {
			var func = D[v[0]];
			var args = v[1] || [];
			var expected = v[2];
			var message = v[3];


			if (!func) { throw "Test function does not exist."; }

			var response = func.apply(D, args);
			if(MOMENT.isMoment(response)) {
				response = response.serverStr();	
			}
			if(MOMENT.isMoment(expected)) {
				expected = expected.serverStr();	
			}

			if (response != expected) {
				var msg = message + "  response=" + response + "   expected=" + expected + " Test Index = " + i;
				E.warn(msg);
				throw msg; 
			}
		});
	}

	return DATES;

});