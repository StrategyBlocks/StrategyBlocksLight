define(['sb_light/globals','sb_light/utils/ext', 'moment'], function(sb, E, MOMENT) {
	'use strict';

	var DATES = {};
	var D = DATES;



	D.serverFormat = "YYYY/MM/DD";
	D.adminFormat = "DD MMM YYYY HH:mm Z";
	D.unixFormat = "YYYY/MM/DD HH:mm:ss Z";
	
	D.userFormat = function() { 
		var u = sb.queries.user();
		return  u ? u.date_format : D.serverFormat;
	}

	////////////////////////////PLUGINS TO MOMENT.JS////////////////////////////////////////
	MOMENT.fn.serverStr = function() {
		return this.format(D.serverFormat);
	};
	MOMENT.fn.userStr = function() {
		return this.format(D.userFormat());
	};

	/////////////////////////////////////////////////////////////////////////////////////////



	D.date = function(adjustments) { 
		var m = MOMENT();
		adjustments = adjustments || {};
		E.each(adjustments, function(v,k) {
			m.add(v, k);
		});
		return m; 
	}

	D.serverStr = function(moment, adjustments) { return (moment || D.date(adjustments)).serverStr(); }
	D.userStr = function(moment, adjustments) { return (moment || D.date(adjustments)).userStr(); }

	D.parse = function(date, format) {
		format = format || D.serverFormat;
		if(E.isStr(date)) {
			return MOMENT(date,format);
		}
		return MOMENT(date);
	};
	//parse from a user format to MOMENT
	D.parseUserDate = function(date) { return D.parse(date, D.userFormat()); }
	//parse from a user format to MOMENT
	D.parseAdminDate = function(date) { return D.parse(date, D.adminFormat); }
	//parse from a user format to MOMENT
	D.parseUnixDate = function(date) { return D.parse(date, D.unixFormat); }

	//Parse and output as a string
	D.parseToUser 	= function(date, format) { return D.parse(date,format).userStr(); 	}
	D.parseToServer = function(date, format) { return D.parse(date,format).serverStr(); 	}



	D.historicDateList = {
		"one_month": 		{unit:"months", 	subtract: 1, min_unit: "days", 		min:20, 	label: "One Month"},
		"two_months": 		{unit:"months", 	subtract: 2, min_unit: "days", 		min:40, 	label: "Two Months"},
		"one_quarter": 		{unit:"quarters", 	subtract: 1, min_unit: "months", 	min:2, 		label: "One Quarter"},
		"two_quarters": 	{unit:"quarters", 	subtract: 2, min_unit: "months", 	min:4, 		label: "Two Quarters"},
		"three_quarters": 	{unit:"quarters", 	subtract: 3, min_unit: "months", 	min:6, 		label: "Three Quarters"},
		"one_year": 		{unit:"years", 		subtract: 1, min_unit: "months", 	min:9, 		label: "One Year"},
		"two_years": 		{unit:"years", 		subtract: 2, min_unit: "months", 	min:18, 	label: "Two Years"},
		"three_years": 		{unit:"years", 		subtract: 3, min_unit: "months", 	min:24, 	label: "Three Years"},
	};

	//finds a period earliers that the current date, or passed date
	//subtract the period amount from the date, and then shift to the start of the month. 
	D.historicDate = function(str, date) {
		var cd = D.parse(date);
		var def = D.historicDateList[str];

		var d = null;
		if(def) {
			d = MOMENT(cd).subtract(def.subtract, def.unit).startOf("month");
			// if (MOMENT(cd).diff(d, def.min_unit) < def.min) {
			// 	d.subtract(1, "days").startOf("month");
			// }
		}
		return d;
	};


	D.futureDateList = {
		"today": 	{unit:"day", label: "Today"},
		"month": 	{unit:"months", label: "End of Month"},
		"quarter": 	{unit:"quarters", label: "End of Quarter"},
		"year": 	{unit:"years", label: "End of Year"},
	}
	D.futureDate = function(str,date) {
		var cd = D.parse(date);
		var def = D.futureDateList[str];

		var d = null;
		if(def) {
			d = cd.endOf(def.unit);
		}
		return d;
	};








	//TEST THE FUNCTIONS ABOVE AS BEST WE CAN
	if(SB_OPTIONS.debug) {
		var __TESTS = [
			 ["serverStr", 	[], 							MOMENT(), 							"Date serverStr function failed"]
			,["serverStr", 	[null, {months:3}], 			MOMENT().add(3, "months"), 			"Date serverStr function failed to add 3 months "]
			,["serverStr", 	[null, {months:-3}], 			MOMENT().subtract(3, "months"), 	"Date serverStr function failed to subtract 3 months "]
			,["serverStr", 	[null, {M:3}], 					MOMENT().add(3, "months"), 			"Date serverStr function failed to add 3 months "]
			,["serverStr", 	[null, {M:-3}], 				MOMENT().subtract(3, "months"), 	"Date serverStr function failed to subtract 3 months "]
			,["serverStr", 	[null, {days:3}], 				MOMENT().add(3, "days"), 			"Date serverStr function failed to add 3 months "]
			,["serverStr", 	[null, {days:-3}], 				MOMENT().subtract(3, "days"), 		"Date serverStr function failed to subtract 3 months "]
			

			,["parseToServer", 		[new Date()], 			MOMENT(),			 		"Date parseToServer function failed parsing DATE"]
			,["parseToServer", 		[MOMENT()], 			MOMENT(), 					"Date parseToServer function failed parsing MOMENT"]
			,["parseToServer", 		["2001/1/1"], 			"2001/01/01", 				"Date parseToServer function failed parsing STRING in the past"]
			,["parseToServer", 		["2050/12/31"], 		"2050/12/31", 				"Date parseToServer function failed parsing STRING in the future"]

			//historic dates from october 12, 2016
			,["historicDate", 		["one_month", "2016/10/12"], 		"2016/09/01", 	"Date historicDate function failed one_month from october 12"]
			,["historicDate", 		["two_months", "2016/10/12"], 		"2016/08/01", 	"Date historicDate function failed two_months from october 12"]
			,["historicDate", 		["one_quarter", "2016/10/12"], 		"2016/07/01", 	"Date historicDate function failed one_quarter from october 12"]
			,["historicDate", 		["two_quarters", "2016/10/12"], 	"2016/04/01", 	"Date historicDate function failed two_qurters from october 12"]
			,["historicDate", 		["three_quarters", "2016/10/12"], 	"2016/01/01", 	"Date historicDate function failed three_qauarters from october 12"]
			,["historicDate", 		["one_year", "2016/10/12"], 		"2015/10/01", 	"Date historicDate function failed one_year from october 12"]
			,["historicDate", 		["two_years", "2016/10/12"], 		"2014/10/01", 	"Date historicDate function failed two_years from october 12"]
			,["historicDate", 		["three_years", "2016/10/12"], 		"2013/10/01", 	"Date historicDate function failed three_years from october 12"]
			//historic dates from may 04, 2017
			,["historicDate", 		["one_month", "2017/05/04"], 		"2017/04/01", 	"Date historicDate function failed one_month from May the forth be with you"]
			,["historicDate", 		["two_months", "2017/05/04"], 		"2017/03/01", 	"Date historicDate function failed two_months from May the forth be with you"]
			,["historicDate", 		["one_quarter", "2017/05/04"], 		"2017/02/01", 	"Date historicDate function failed one_quarter from May the forth be with you"]
			,["historicDate", 		["two_quarters", "2017/05/04"], 	"2016/11/01", 	"Date historicDate function failed two_qurters from May the forth be with you"]
			,["historicDate", 		["three_quarters", "2017/05/04"], 	"2016/08/01", 	"Date historicDate function failed three_qauarters from May the forth be with you"]
			,["historicDate", 		["one_year", "2017/05/04"], 		"2016/05/01", 	"Date historicDate function failed one_year from May the forth be with you"]
			,["historicDate", 		["two_years", "2017/05/04"], 		"2015/05/01", 	"Date historicDate function failed two_years from May the forth be with you"]
			,["historicDate", 		["three_years", "2017/05/04"], 		"2014/05/01", 	"Date historicDate function failed three_years from May the forth be with you"]
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
			,["futureDate", 		["today", "2016/10/12"], 		"2016/10/12", 			"Date futureDate failed to handle Oct 12"]
			,["futureDate", 		["month", "2016/10/12"], 		"2016/10/31", 			"Date futureDate failed to handle MONTH from Oct 12"]
			,["futureDate", 		["quarter", "2016/10/12"], 		"2016/12/31", 			"Date futureDate failed to handle QUARTER from Oct 12"]
			,["futureDate", 		["year", "2016/10/12"], 		"2016/12/31", 			"Date futureDate failed to handle YEAR from Oct 12"]
			//future dates from may 04, 2017
			,["futureDate", 		["today", "2017/05/04"], 		"2017/05/04", 			"Date futureDate failed to handle May 04"]
			,["futureDate", 		["month", "2017/05/04"], 		"2017/05/31", 			"Date futureDate failed to handle MONTH from May 04"]
			,["futureDate", 		["quarter", "2017/05/04"], 		"2017/06/30", 			"Date futureDate failed to handle QUARTER from May 04"]
			,["futureDate", 		["year", "2017/05/04"], 		"2017/12/31", 			"Date futureDate failed to handle YEAR from May 04"]
		];


		E.each(__TESTS, function(v) {
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
				var msg = message + "  response=" + response + "   expected=" + expected;
				console.log(msg);
				throw msg; 
			}
		});
	}

	return DATES;

});