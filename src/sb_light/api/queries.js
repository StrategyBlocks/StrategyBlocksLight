

/*globals define, d3 */



/*************************
	These functions assume that the models you need have been 
	fetched and are up to date in "sb.models"
	They're intended to be convenience functions that exploit the global
	nature of the models. 
************************/

define(['sb_light/globals', 
		"moment",
		"accounting", 
		"sb_light/utils/ext", 
		'sb_light/api/state',
		//ignore
		'd3'
], function(sb, moment, accounting,  E, ST) {
	
	'use strict';
	var q = {};
	
	/********************************
		COMPANIES
	*********************************/
	q.company = function(cid /*optional*/) {
		var cm = sb.models.rawArray("companies");
		if(!cid && !cm) { 
			return ST.context("company") || null;
		}
		cid = cid || ST.state("company_id") || (ST.context("company") && ST.context("company").id) || null;
		return sb.models.find("companies", cid);
	};
	q.companyRollup = function() {
		var c = q.company();
		return c ? c.default_progress_weight_method : 1;
	};
	q.companyLinkedRollup = function() {
		var c = q.company();
		return c ? c.default_linked_rollup_method : 2;
	};
	q.companyHealth = function() {
		var c = q.company();
		return c ? c.default_health_calculation_id : null;
	};

	q.shortCompanyName = function(cid) {
		var c = q.company(cid);
		var t = c ? c.name : null;
		if(t && t.length > 25) {
			t = t.substr(0,10) + "..." + t.substr(t.length-10);
		} 
		return t;
	};

	q.yearEnd = function() {
		var c = ST.context("company");
		var fy = c ? c.npv.financial_year_starts_on : "1/4";
		var ds = fy.match(/^(\d\d?)\//)[1];
		var ms = fy.match(/\/(\d\d?)$/)[1];

		var cfy = E.moment().startOf("year").add(E.to_i(ms)-1,"m").add(E.to_i(ds)-1, "d").subtract(1, "d");
		if(cfy.isBefore(E.moment())) {
			return cfy.add(1, "year");
		} 
		return cfy; 
	};

	q.yearStart = function() {
		var c = ST.context("company");
		var fy = c ? c.npv.financial_year_starts_on : "1/4";
		var ds = fy.match(/^(\d\d?)\//)[1];
		var ms = fy.match(/\/(\d\d?)$/)[1];

		var cfy = E.moment().startOf("year").add(E.to_i(ms)-1,"m").add(E.to_i(ds)-1, "d");
		if(cfy.isAfter(E.moment())) {
			return cfy.subtract(1, "year");
		} 
		return cfy; 
	};

	q.risk_profile = function() {
		var c = ST.context("company");
		return (c &&  c.risk && c.risk.profile_properties) || null;

	};


	/********************************
		USERS
	*********************************/
	var DELETED_NAME = "<deleted>";

	q.fullname = function(uid) {
		var u = q.user(uid);
		return u ? (u.name || (u.firstname + " " + u.lastname)) : DELETED_NAME;
	};
	q.firstname = function(uid) {
		var u = q.user(uid);
		return u ? u.first_name : DELETED_NAME;
	};

	q.shortName = function(uid) {
		var u = q.user(uid);
		return u? (u.first_name.slice(0,1) + ". " + u.last_name) : DELETED_NAME;
	};

	q.lastname = function(uid) {
		var u = q.user(uid);
		return u ? u.last_name : DELETED_NAME;
	};
	q.user = function(uid /*optional*/) {
		var um = sb.models.rawArray("users");
		if(!uid && !um) { 
			return ST.context("user") || null;
		}
		uid = uid || ST.state("user_id");
		return sb.models.find("users", uid);
	};

	q.userProfile = function() {
		var uid = ST.state("profile_user");
		return uid ? q.user(uid): null;
	};

	q.companyMembership = function(uid) {
		var u = q.user(uid);
		if(u.company_membership) {
			return u.company_membership;
		} else {
			//TODO: Remove this code - legacy api.
			var c = q.company();
			return u && c && u.companies[c.id] || null;
		}
	}; 
	q.userDate = function(date, opts) {
		var u = q.user();
		return moment(date, opts).format(u.date_format);	
	
	};
	var _serverDateFormat =  "YYYY/MM/DD";
	q.userToServerDate = function(date) {
		var u = q.user();
		var m = moment(date, u.date_format);
		return m.format(_serverDateFormat);
	};
	
	q.authors  = function() {
		var cid = ST.state("company_id");
		return sb.models.rawArray("users").filter(function(el) {
			
												//TODO: Remove legacy API support
			var cm = el.company_membership || (el.companies && el.companies[cid] || null);
			return cm && cm.active && (cm.role == "Author" || cm.role =="Administrator");
		}).sort(sb.ext.sortUsers);
	};

	q.gravatar = function(uid, size) {
		var u = q.user(uid);
		return "http://www.gravatar.com/avatar/" +  (u ? u.gravatar : "") + "?d=identicon&s="+ (size||50);
	};


	q.userMessageDisplay = function(uid, message, width) {
		var u = q.user(uid);
		if(!u) {
			return DELETED_NAME;
		}
		return 	"<div style='min-width:"+ (width || "auto") +"'><a target='_blank' href='mailto:"+ u.username + "' title='"+ q.fullname() +"' >"  + 
					" <img style='float:left;margin:0 5px 5px 0;' src='" + q.gravatar(u.id) + "'></img> " + q.shortName(u.id) + ": " +
				"</a> " + (message||"") + "</div>";
	};

	q.isAdmin = function(uid) {
		var cm = q.companyMembership(uid);
		return cm && cm.role == "Administrator";
	};
	q.isAuthor = function(uid) {
		var cm = q.companyMembership(uid);
		return cm && cm.role == "Author";
	};
	q.isUser = function(uid) {
		var cm = q.companyMembership(uid);
		return cm && cm.role == "User";
	};

	q.isMetricAdmin = function() {
		return q.isAdmin();
	}

	q.userActive = function(uid) {
		var cm = q.companyMembership(uid);
		return cm && cm.active;	
	};
	q.userPrimary = function(uid) {
		var cm = q.companyMembership(uid);
		return cm && cm.primary_contact;	
	};

	q.userGroups = function(uid) {
		var u = q.user(uid);
		var g = sb.models.rawArray("groups") || [];

		return g.filter(function(v) {
			return v.users.indexOf(u.id) > -1;
		}).map(function(v) {
			return v.id;

		});
	};

	q.userBlocks = function(uid) {
		return sb.models.rawArray("blocks").filter(function(b) {
			return b.owner_id == uid || b.manager_id == uid;
		});
	};
	q.userMetrics = function(uid) {
		return sb.models.rawArray("metrics").filter(function(b) {
			return b.owner_id == uid || b.manager_id == uid;
		});
	};
	q.userRisks = function(uid) {
		return sb.models.rawArray("risks").filter(function(b) {
			return b.owner_id == uid || b.manager_id == uid;
		});
	};


	q.userOwnedBlocks = function(uid) { 
		var cm = q.companyMembership(uid); 
		return (cm && cm.count_owned_blocks) || 0; 
	};
	q.userManagedBlocks = function(uid) { 
		var cm = q.companyMembership(uid); 
		return (cm && cm.count_managed_blocks) || 0; 
	};
	q.userOwnedKpis = function(uid) { 
		var cm = q.companyMembership(uid); 
		return (cm && cm.count_owned_kpis) || 0; 
	};
	q.userManagedKpis = function(uid) { 
		var cm = q.companyMembership(uid); 
		return (cm && cm.count_managed_kpis) || 0; 
	};
	q.userOwnedRisks = function(uid) { 
		var cm = q.companyMembership(uid); 
		return (cm && cm.count_owned_risks) || 0; 
	};
	q.userManagedRisks = function(uid) { 
		var cm = q.companyMembership(uid); 
		return (cm && cm.count_managed_risks) || 0; 
	};


	/********************************
		GROUPS
	*********************************/
	q.group = function(gid /*optional*/) {
		var gm = sb.models.raw("groups");
		gid = gid || ST.state("group");
		return (gm && gid && gm[gid]) || null; 
	};

	/********************************
		FOCUS AREAS
	*********************************/
	q.focusArea = function(fid) {
		var fs = sb.models.raw("focus");
		return (fs && fs[fid]) || null;
	};

	q.focusTitle = function(fid) {
		var f = q.focusArea(fid);
		return f ? f.title : "";
	};
	q.focusDesc = function(fid) {
		var f = q.focusArea(fid);
		return f ? f.description : "";
	};

	q.focusList = function(fid) {
		var list = [];
		var f = q.focusArea(fid);
		while(f) {
			list.put(f);
			f = q.focusArea(f.parent_id);
		}
		return list; 
	};

	q.focusPath = function(fid) {
		var list = q.focusList(fid);
		return list.reverse().map(function(v){
			return v.title;
		}).join(" / ");
	};
	
	/********************************
		Levels
	*********************************/
	q.level = function(depth) {
		var lvls = sb.models.rawArray("levels");
		return (lvls && lvls.length > depth) ? lvls[depth] : null;
	};

	q.levelName = function(depth) {
		var lvl = q.level(depth);
		return lvl ? lvl.title : "";
	};


	/********************************
		NEWS
	*********************************/
	
	q.currentNewsItem = function() {
		var id = ST.state("news");
		var model = sb.models.raw("news");
		
		return model && id ? model[id] : null;	
	};
	
	
	
	/********************************
		METRICS
	*********************************/
	q.metric = function(id) {
		id = id || (!arguments.length && ST.state("metric"));
		var m = sb.models.raw("metrics");
		if(id && m) {
			id = E.isNum(id) ? String(id) : id;
			//return the original kpi if we've passed the real object
			return E.isStr(id) ? m[id] : m[id.id];
		}
		return null;
	};

	q.isMetricOwner = function(mid) {
		var m = q.metric(mid);
		return m && m.is_owner; 
	};
	q.isMetricManager = function(mid) {
		var m = q.metric(mid);
		return m && m.is_manager;
	};

	q.formatMetric = function(m, value) {
		var val = accounting.formatNumber(value);
		return m ? 
			(m.unit_before ? E.join("", m.unit, val) : E.join(" ", val, m.unit) ) : 
			"--"
		;

	};

	//DISPLAY purposes
	q.metricActual = function(id) {
		var m = q.metric(id);
		var ma = m.last_actual_value;
		return q.formatMetric(m, ma);

	};

	//DISPLAY purposes
	q.metricTarget = function(id) {
		var m = q.metric(id);
		var mt = m.last_target_value;
		return q.formatMetric(m, mt);
	};

	q._trendMap = {
		"Down": "fa fa-lg fa-arrow-circle-down",
		"Up": "fa fa-lg fa-arrow-circle-up",
		"Flat": "fa fa-lg fa-minus-circle"
	};

	q.metricTrendClass = function(id) {
		var m = q.metric(id);
		if(!m) { return ""; }
		return "trend" + m.trend;
	};

	//DISPLAY purposes
	q.metricTrendMarkup = function(id) {
		var m = q.metric(id);
		return "<i class='" + (q._trendMap[m.trend]) + "'></i>";

	};

	q._metricStatusClass = {
		"Good": "statusGood",
		"Warning": "statusWarn",
		"Bad": "statusBad",
	};
	q._metricStatusIcon = {
		"Bad": "fa fa-lg fa-arrow-circle-down",
		"Good": "fa fa-lg fa-arrow-circle-up",
		"Warning": "fa fa-lg fa-minus-circle"
	};
	q.metricStatusClass = function(id) {
		var m = q.metric(id);
		if(!m) { return ""; }

		return q._metricStatusClass[m.status];
	};


	//DISPLAY purposes
	q.metricStatusMarkup = function(id) {
		var m = q.metric(id);
		if(!m) { return ""; }

		return "<i class='" + (q._metricStatusIcon[m.status] + " " + q._metricStatusClass[m.status]) + "'></i>";
	};


	q._metricTypeMap = {
		"B": "fa fa-lg fa-user", 	//basic
		"C": "fa fa-lg fa-calculator",	//calculated
		"H": "fa fa-lg fa-sitemap",	//hierarchical
	};


	q.metricTypeMarkup = function(id, sortKey/*==false*/) {
		var m = q.metric(id);
		if(!m) { return sortKey ? "Z" : ""; }

		var num = (m.hierarchy && "H") || ((m.calculation_actuals || m.calculation_targets) && "C") || "B";

		return sortKey ? num : ("<i class='" + q._metricTypeMap[num] + "'></i>");
	};


	q.metricChartData = function(id, hierarchyData) {
		// var timer = E.moment();

		var m = q.metric(id);
		var percent = m.percentage ? true : false;
		var start = E.min(m.range_start, m.range_end);
		var end = E.max(m.range_start, m.range_end);
		var today = E.serverDate(E.today());

		//display values
		var targets = hierarchyData ? hierarchyData.target_total : m.target;
		var actuals = hierarchyData ? hierarchyData.actuals_total : m.actuals;

		targets  = (targets && targets.length) ? E._.cloneDeep(targets) : [{date:E.serverDate(), value:0}];
		actuals  = (actuals && actuals.length) ? E._.cloneDeep(actuals) : [{date:E.serverDate(), value:0}];


//		targets.push({date:today, value:(m.last_target_value||0)});
//		actuals.push({date:today, value:(m.last_actual_value||0), comment:"Current Actual"});

		targets.sort(E.sortUnixDate("date", false));
		actuals.sort(E.sortUnixDate("date", false));

		var targetDatestr = E.values(targets, "date");
		var actualDatestr = E.values(actuals, "date");

		var targetValues = E.values(targets, "value");
		var actualValues = E.values(actuals, "value");


		start = percent ? start/100 : start;
		end = percent ? end/100 : end;

		var upperValues = targetValues.map(function(v) {
			return v + (percent ? (v*end) : end );
		});
		var lowerValues = targetValues.map(function(v) {
			return v + (percent ? (v*start) : start );
		});

		var actualsMap = E.toObject(actuals, "date");


		//ceate a unique, sorted list of dates. 
		var datestr = E._.union([today], targetDatestr, actualDatestr).sort(function(a,b) {
			return E.sortDate(E.serverMoment(a), E.serverMoment(b));
		});

		//convert date strings to date objects for the time scales
		var dm = function(v) { 
			return E.serverMoment(v).toDate(); 
		};

		var targetDates = targetDatestr.map(dm);
		var actualDates = actualDatestr.map(dm);


		var actualDomain = actualDates;
		var actualRange = actualValues;
		if(actualDomain.length === 1) { 
			actualDomain.push(E.moment().add(1, "month").toDate());
			actualRange.push(actualValues[0]);
		}
		var targetDomain = targetDates;
		var targetRange = targetValues;
		var upperRange = upperValues;
		var lowerRange = lowerValues;
		if(targetDomain.length === 1) { 
			targetDomain.push(E.moment().add(1, "month").toDate());
			targetRange.push(targetValues[0]);
			upperRange.push(upperValues[0]);
			lowerRange.push(lowerValues[0]);
		}


		var raRange = E.values( (hierarchyData ? hierarchyData.raw_actuals_total : m.raw_actuals).sort(E.sortServerDate("date",false)), "value");
		var rtRange = E.values( (hierarchyData ? hierarchyData.raw_target_total : m.raw_target).sort(E.sortServerDate("date",false)), "value");
		var raDomain = E.values( (hierarchyData ? hierarchyData.raw_actuals_total : m.raw_actuals).sort(E.sortServerDate("date",false)), "date", E.serverToDate);
		var rtDomain = E.values( (hierarchyData ? hierarchyData.raw_target_total : m.raw_target).sort(E.sortServerDate("date",false)), "date", E.serverToDate);

		var rarRange, rtrRange, ralRange, rtlRange,
			rarDomain, rtrDomain, ralDomain, rtlDomain,
			rarScale, rtrScale, ralScale, rtlScale
		;


		var aScale = d3.time.scale().domain(actualDomain).range(actualRange).clamp(true);
		var raScale = d3.time.scale().domain(raDomain).range(raRange).clamp(true);


		var tScale = d3.time.scale().domain(targetDomain).range(targetRange).clamp(true);
		var rtScale = d3.time.scale().domain(rtDomain).range(rtRange).clamp(true);


		var upperScale = d3.time.scale().domain(targetDomain).range(upperRange).clamp(true);
		var lowerScale = d3.time.scale().domain(targetDomain).range(lowerRange).clamp(true);

		var scales = [aScale, tScale, raScale, rtScale, upperScale, lowerScale];
		if(hierarchyData) {
			// Rollup and local raw values
			rarRange = E.values(hierarchyData.raw_actuals_rollup.sort(E.sortServerDate("date",false)), "value");
			rtrRange = E.values(hierarchyData.raw_target_rollup.sort(E.sortServerDate("date",false)), "value");
			ralRange = E.values(hierarchyData.raw_actuals.sort(E.sortServerDate("date",false)), "value");
			rtlRange = E.values(hierarchyData.raw_target.sort(E.sortServerDate("date",false)), "value");

			rarDomain = E.values(hierarchyData.raw_actuals_rollup.sort(E.sortServerDate("date",false)), "date", E.serverToDate);
			rtrDomain = E.values(hierarchyData.raw_target_rollup.sort(E.sortServerDate("date",false)), "date", E.serverToDate);
			ralDomain = E.values(hierarchyData.raw_actuals.sort(E.sortServerDate("date",false)), "date", E.serverToDate);
			rtlDomain = E.values(hierarchyData.raw_target.sort(E.sortServerDate("date",false)), "date", E.serverToDate);
	
			rarScale = d3.time.scale().domain(rarDomain).range(rarRange).clamp(true);
			ralScale = d3.time.scale().domain(ralDomain).range(ralRange).clamp(true);
			rtrScale = d3.time.scale().domain(rtrDomain).range(rtrRange).clamp(true);
			rtlScale = d3.time.scale().domain(rtlDomain).range(rtlRange).clamp(true);

			scales.put(rarScale,ralScale,rtrScale,rtlScale);
		}
		if(!m.interpolate_values) {
			E.each(scales, function(s) {
				s.interpolate(function(a,b) {
					//step-after interpolate
					return function(t) {
						return t < 1 ? a : b; 
					}
				});
			});

		}


		var res = {
			td:targetDates,			tv:targetValues,
			ad:actualDates,			av:actualValues,
			as:aScale,					ts:tScale,
			ras:raScale,				rts:rtScale,
			us:upperScale,				ls:lowerScale,
			uv:upperValues,				lv:lowerValues
		};

		if(hierarchyData) {
			res.rars = rarScale;
			res.rals = ralScale;
			res.rtrs = rtrScale;
			res.rtls = rtlScale;
		}

		res.series = E.map(datestr, function(ds) {
			var dm = E.serverMoment(ds);
			var d = dm.toDate();
			var dn = d.getTime();
			var t = tScale(d);
			var a = aScale(d);
			var v = E.variance(a,t);
			var u = upperScale(d);
			var l = lowerScale(d);
			var uv = E.variance(u,t);
			var lv = E.variance(l,t);

			var el = {
				date:d,
				moment:dm,
				dateStr: ds,
				dateNum: dn,
				target:t,
				raw_target: rtScale(d),
				raw_target_rollup: (rtrScale ? rtrScale(d) : null),
				raw_target_local: (rtlScale ? rtlScale(d) : null),
				actual:a,
				raw_actual: raScale(d),
				raw_actual_rollup: (rarScale ? rarScale(d) : null),
				raw_actual_local: (ralScale ? ralScale(d) : null),
				upper:u,
				lower:l,
				variance:v,
				upperVariance:uv,
				lowerVariance:lv,
				comment:(actualsMap[ds] ? actualsMap[ds].comment : "")
			};

			return el;
		});

		// console.log("MetricsChart Timer: ", E.moment().diff(timer));
		return res;
	};


	q.progressChartData = function(progressData, bid) {
		var pd = progressData[bid];
		if(!pd) { return null;}

		var percent = true;
		var start = E.min(pd.range_end, pd.range_end)/100;
		var end = E.max(pd.range_start, pd.range_end)/100;
		var today = E.today();
		var targets  = (pd.target && pd.target.length) ? E._.cloneDeep(pd.target) : [{date:today, value:0}];
		var actuals  = (pd.actuals && pd.actuals.length) ? E._.cloneDeep(pd.actuals) : [{date:today, value:0}];

		
		targets.sort(E.sortFactory("date", E.sortDate, false, E.serverMoment));
		actuals.sort(E.sortFactory("date", E.sortDate, false, E.serverMoment));

		var targetDates = E.map(targets, function(v) { return E.serverMoment(v.date); });
		var actualDates = E.map(actuals, function(v) { return E.serverMoment(v.date); });

		var targetValues = E.values(targets, "value");
		var actualValues = E.values(actuals, "value");

		var upperValues = targetValues.map(function(v) {
			return v + (percent ? (v*end) : end );
		});
		var lowerValues = targetValues.map(function(v) {
			return v + (percent ? (v*start) : start );
		});

		var actualsMap = E.toObject(actuals, "date");
		//ceate a unique, sorted list of dates. 
		var dates = E._.union([today], targetDates, actualDates).sort(E.sortDate);

		//convert date strings to date objects for the time scales
		var dm = function(v) { return E.date(v); };
		var td = targetDates.map(dm);
		var ad = actualDates.map(dm);

		var ascale = d3.time.scale().domain(ad).range(actualValues).clamp(true);
		var tscale = d3.time.scale().domain(td).range(targetValues).clamp(true);
		var upperScale = d3.time.scale().domain(td).range(upperValues).clamp(true);
		var lowerScale = d3.time.scale().domain(td).range(lowerValues).clamp(true);

		var res = {
			td:targetDates,				tv:targetValues,
			ad:actualDates,				av:actualValues,
			as:ascale,					ts:tscale,
			us:upperScale,				ls:lowerScale,
			uv:upperValues,				lv:lowerValues,
		};

		res.series = E.map(dates, function(ds) {
			var d = E.date(ds);
			var t = Math.floor(tscale(d));
			var a = Math.floor(ascale(d));
			var v = (a ? ((a-t)/a) : Number.POSITIVE_INFINITY);
			var u = Math.floor(upperScale(d));
			var l = Math.floor(lowerScale(d));
			var uv = (u ? ((u-t)/u) : Number.POSITIVE_INFINITY);
			var lv = (l ? ((l-t)/l) : Number.POSITIVE_INFINITY);

			return {
				date:d,
				dateStr: ds,
				dateNum: d.getTime(),
				target:t,
				actual:a,
				upper:u,
				lower:l,
				variance:v,
				upperVariance:uv,
				lowerVariance:lv,
				overdue: (E.daysDiff(end, d) > 0),
				comment:(actualsMap[ds] ? actualsMap[ds].comment : "")
			};
		});

		// console.log("ProgressChart Timer: ", E.moment().diff(timer));
		return res;
	};




	// q.metricData = function(id) {
	// 	var m = q.metric(id);
	// 	// if(m.metricData) {
	// 	// 	return m.metricData();
	// 	// } else {
	// 		var percent = m.percentage ? true : false;
	// 		var btg = m.below_target_good ? true : false;
	// 		var ts = E.min(m.range_start, m.range_end);
	// 		var te = E.max(m.range_start, m.range_end);
	// 		ts = percent ? ts/100 : ts;
	// 		te = percent ? te/100 : ts;

	// 		var targetDates = E.values(m.target, "date");
	// 		var actualDates = E.values(m.actuals, "date");
	// 		var targetValues = E.values(m.target, "value");
	// 		var actualValues = E.values(m.actuals, "value");
	// 		var comments = E.toObject(m.actuals, "date");

	// 		var ascale = d3.time.scale().domain(actualDates).range(actualValues);
	// 		var tscale = d3.time.scale().domain(targetDates).range(targetValues);
	// 		var upperScale = d3.time.scale().domain(targetDates).range(targetValues.map(function(v) {
	// 			return v + (percent ? (v*te) : te )
	// 		}));
	// 		var lowerScale = d3.time.scale().domain(targetDates).range(targetValues.map(function(v) {
	// 			return v + (percent ? (v*te) : te )
	// 		}));

	// 		//force today
	// 		return E.map(E._.union([E.serverDate()], targetDates, actualDates), function(v) {
	// 			return {
	// 				data:v,
	// 				target:tscale(v),
	// 				actual:ascale(v),
	// 				upper:upperScale(v),
	// 				lower:lowerScale(v),
	// 				comment:(comments[v].comment)
	// 			}
	// 		});
	// 	// }
	// };

	/********************************
		RISKS
	*********************************/
	
	q.risk = function(id) {
		id = id || ST.state("risk");
		var m = sb.models.raw("risks");
		if(id && m) {
			return m[id];
		}
		return null;
	};


	q._riskStatusMap = {
		"inactive": "statusGood",
		"warning": "statusWarn",
		"triggered": "statusBad"
	};

		//DISPLAY purposes
	q.riskStatusMarkup = function(id) {
		var r = q.risk(id);
		if(!r) { return ""; }

		return "<i class='fa fa-lg fa-exclamation-triangle " + q._riskStatusMap[r.status] + "'></i>";
	};


	/********************************
		BLOCKS
	*********************************/

	q.rootBlock = function() {
		var ba = sb.models.get("blocks").rawArray();
		var rb = null;
		if(ba) {
			rb = E._.find(ba, {is_root:true});
			return rb ||  null;
		}
		var c = q.company();
		rb = c ? (c.company_block || c.root_block || null): null;
		return rb ? (q.block(rb.id) || rb) : null;
	};

	q.block = function(b) {
		if(E.isNum(b)) { b = String(b); }
		//get the string or use path in the "b" object
		b = E.isStr(b) ? b : (b ? (b.path || b.id) : b );
		b = (b || !arguments.length) ? (b || ST.state("block")) : null;
		//takes an object or string
		b = b ? sb.models.find("blocks", b): null;
		return b ||  null;
	};

	q.parentBlock = function(b) {
		b = q.block(b);
		if(b && b.parent) {
			return q.block(b.parent);
		}
		return null;
	};


	q.blockStatusClass= function(b) {
		b = q.block(b);
		return "status" + E.caps(b.status);
		// return b.ownership_state == "new" ? "statusPrivate" : 
		// 		(b.closed ? "statusClosed" : 
		// 			("status" + E.caps(b.progress_color))
		// 		)
		// ;
	};
	q.blockAlertClass = function(b) {
		b = q.block(b);
		var res = "alert alert-info";

		var ds = E.daysDiff(E.today(), b.start_date);
		if(ds < 0 || b.status == "new" || b.status == "closed") {
			return  res;
		}

		switch(b.status) {
			case "good": res = "alert alert-success"; break;
			case "warning": res = "alert alert-warning"; break;
			case "bad": res  = "alert alert-danger"; break;
		}
		return res;
	};


	q.blockStatusMessage = function(b) {
		b = q.block(b);
		var dd = E.daysDiff(E.today(), b.end_date);
		if(dd > 1) {
			//OVERDUE
			return "Overdue by <strong>" + dd + "</strong> days."
		} else if (dd === 0) {
			return "Due <strong>today</strong>";
		} else {
			var ds = E.daysDiff(E.today(), b.start_date);
			if(ds < 0) {
				return "Starts in <strong>" + ds + "</strong> days.";
			} else if (ds === 0) {
				return "Starts <strong>today</strong>";
			} else {
				return "<strong>" + Math.abs(dd) + "</strong> days remaining.";
			}
		}
	};


	q.blockTarget = function(b) {
		b = q.block(b);
		if(!b || b.ownership_state == "new") { return 0; }
		return b.expected_progress;
	};

	q.blockProgress = function(b) {
		b = q.block(b);
		if(!b || b.ownership_state == "new") { return 0; }
		return b.percent_progress;
	};
	q.blockActual = q.blockProgress;
	
	q.blockVariance = function(b) {
		var p  = q.blockProgress(b);
		var e  = q.blockTarget(b);
		return (e > 0) ? Math.floor( ((p - e)/e) *100) : 100;
	};

	q.blockProgressRatioLabel = function(b) {
		var p = q.blockProgress(b);
		var t = q.blockTarget(b);
		return [p,"/",t].join("");
	};	

	q.isCenterPath = function(b) {
		b = q.block(b);
		var cb = q.block();
		return cb.path.match(b.path) ? true : false;
	};

	q.defaultBlockType = function(type) {
		ST.initState("blockType", "status");
		
		var kn = type || null;
		var types = sb.consts.blockTypes();
		var val = types.findKey("key", ST.state("blockType")).value;
		val = val || types[0];
		return kn ? val[kn] : val;
		
	};

	q.blockType = function(path) {
		//make sure this property exists before we use it. 
		ST.initState("blockType", "status");
		ST.initState("blockSettings", "");

		//var types = sb.consts.blockTypes({key:"shortkey"});

		var defaultType = q.defaultBlockType("shortkey");
		var localType = ST.getStateKey("blockSettings", path);
		if(localType) {
			localType = localType.match(/b\w/)[0];
		}
		return localType || defaultType;
	};

	q.canEditBlock = function(b) {
		return q.canManageBlock(b) || q.canUpdateProgress(b);
	};
	q.canManageBlock = function(b) {
		return b.is_manager && !b.closed && !b.is_sub_company_block;
	};
	q.canUpdateProgress = function(b) {
		return b.is_owner && !b.closed && b.ownership_state != "new" && b.leaf && !b.is_link && !b.sub_company_block;
	};
	q.isBlockOwner = q.canUpdateProgress;
	q.isBlockManager = q.canManageBlock;


	q.progressRollupMethod = function(parent, companyFallback/*true*/) {
		return (parent.progress_weight_method < 0 && companyFallback) ? q.companyRollup() : parent.progress_weight_method;
	};

	q.linkedRollupMethod = function(parent, companyFallback/*true*/) {
		return (parent.linked_rollup_method < 0 && companyFallback) ? q.companyLinkedRollup() : parent.linked_rollup_method;
	};

	//PARENT NEEDS TO BE AN OBJECT, as do CHILDREN
	q.progessWeights = function(parent, children) {
		var idx = parent.progress_weight_method < 0 ? q.companyRollup() : parent.progress_weight_method;
		return E.map(children, function(c) {
			return q._blockProgressWeightMethods[idx](c, children);
		});
	};

	q._blockProgressWeightCustom = function(block/*, siblings*/) {
		return block.custom_progress_weight || 0;
	};

	q._blockProgressWeightDuration = function(block, siblings) {
		var total = E.reduce(siblings, function(prev, curr) {
			return prev + E.daysDiff(E.moment(curr.end_date, E.serverFormat), E.moment(curr.start_date, E.serverFormat));
		}, 0);
		return (E.daysDiff(E.moment(block.end_date, E.serverFormat), E.moment(block.start_date, E.serverFormat)) / total) * 100;
	};

	q._blockProgressWeightEffort = function(block/*, siblings*/) {
		return block.days_of_effort || 0;
	};

	q._blockProgressWeightPriority = function(block/*, siblings*/) {
		return block.priority || 0;
	};

	q._blockProgressWeightMethods = [
		q._blockProgressWeightCustom,
		q._blockProgressWeightDuration,
		q._blockProgressWeightEffort,
		q._blockProgressWeightPriority	
	];





	// q.block = function(b) {
	// 	//b can be a path, id, or the actual object
	// 	var blocks = sb.models.raw("blocks");
	// 	if(!blocks) { return null; }
	// 	if(E.isStr(b)) {
	// 		b = b.split("_").last(); 
	// 		b = blocks[b];
	// 	} else {
	// 		b = blocks[b.path];
	// 	}
	// 	return b;
	// };

	// q.currentBlock = function() {
	// 	return q.block(ST.state("block"));
	// };
	// q.rootBlock = function() {
	// 	var rbid = q.rootBlockId();
	// 	return rbid ? q.block(rbid) : null; 
	// };
	// q.rootBlockId = function() {
	// 	var c = q.company();
	// 	return c && c.root_block ? c.root_block.id : null; 
	// };
	// q.currentBlockId = function() {
	// 	var b = q.currentBlock();
	// 	return b ? b.id : null; 
	// };
	// q.currentBlockPath = function() {
	// 	return q.currentBlock().path;
	// };
	// q.currentBlockLevel = function() {
	// 	return q.currentBlock().level;
	// };
	// q.managedBlocks = function() {
	// 	return sb.models.rawArray("blocks").reduce(function(pre, el) {
	// 		if(el.is_manager) {
	// 			return pre.put(el);
	// 		} 
	// 		return pre;
	// 	}, []);
	// };
	// q.parentPath = function(bpath, str/*==false*/) {
	// 	bpath = q.blockPath(bpath);
	// 	return bpath ? q.blockPath(bpath.slice(0,-1), str) : null;
	// };
	// q.blockParentInfo = function(bpath) {
	// 	bpath = q.blockPath(bpath);
	// 	var b = bpath ? q.block(bpath) : null;
	// 	if(b && b.parents && b.parents.length) {
	// 		return b.parents.findKey("parent_id", bpath.last(1)).value;
	// 	}
	// 	return null;	
	// };
	
	// q.blockPath = function(bpath, str/*==false*/) {
	// 	if(!bpath)  {return null; }
 // 		bpath = _pathToArray(bpath);
	// 	var b = q.block(bpath);
	// 	if(b && bpath.length < 2 && b.parents.length > 0) {
	// 		bpath = b.default_path;
	// 	}
	// 	return str ? bpath.join("_") : bpath;
	// };

	// var _pathToArray = function(bpath) {
	// 	if(E.isArr(bpath)) { return bpath; }
	// 	if(E.isNum(bpath)) { return [String(bpath)]; }
	// 	if(E.isStr(bpath)) { return bpath.split("_"); }
	// 	return bpath;
	// };
	
	// q.blockId = function(bpath) {
	// 	bpath = bpath ? _pathToArray(bpath) : null;
	// 	return (bpath && bpath.length) ? bpath.last() : null;
	// };
	
	
	// q.blockLevel = function(bpath) {
	// 	var b = q.block(bpath);
	// 	return b ? b.level : -1;
	// };
	
	// q.childPath = function(ppath, id, str/*===false*/) {
	// 	var path = _pathToArray(ppath) || [];
	// 	return q.blockPath(path.push(id), str);
	// };
	// q.childrenPaths = function(bpath, str/*==false*/) {
	// 	//array, so we can concat
	// 	bpath = q.blockPath(bpath);
	// 	var b= q.block(bpath);
	// 	//concat each child id to the bpath array and return using internal blockPath function, passing the "str" option. 
	// 	return b ? 
	// 			b.children.map(function(el) { return q.blockPath(bpath.concat([el]), str); }) :
	// 			null; 
		
	// };
	// q.parentPaths = function(bpath, str/*==false*/) {
	// 	var b= q.block(bpath);
	// 	return b.paths.reduce(function(prev,el) {
	// 				var pp =  sb.queries.parentPath(el, str);
	// 				return pp && pp.length  ? prev.put(pp) : prev;
	// 	}, []);
	// };
	
	// //includes siblings from *ALL* parents
	// q.siblingPaths = function(bpath, str/*==false*/) {
	// 	var b= q.block(bpath);
	// 	return b.paths.reduce(function(prev,el) {
	// 		var cp = sb.queries.childrenPaths(sb.queries.parentPath(el), str);
	// 		if(cp) {
	// 			cp = cp.filter(function(el) { 
	// 				return sb.queries.blockPath(el,true) != sb.queries.blockPath(bpath,true); 
	// 			});  
	// 			return prev.concat(cp);
	// 		} 
	// 		return prev;
	// 	}, []);
	// };
	
	
	// q.arePathsEqual = function(apath, bpath) {
	// 	return q.blockPath(apath, true) == q.blockPath(bpath, true);
	// };
	// q.isCenterPath = function(apath) {
	// 	return q.currentBlockPath(true).indexOf(q.blockPath(apath,true)) > -1;
	// };
	// q.isCurrentPath = function(apath) {
	// 	return q.arePathsEqual(apath, q.currentBlockPath());
	// };
	

	// q._managerFields = ["title", "body", "start_date", "end_date", "owner_id", "focus_id", 
	// 					"priority", "days_of_effort", "floating_end_date", "milestone_definition_id", "health_calculation_id"];
	// q._ownerFields = ["progress_value", "progress_comment"];

	// q.canEditBlock = function(b) {
	// 	return b.is_owner || b.is_manager;
	// };
	// q.canManageBlock = function(b, optionalField) {
	// 	return b.is_manager && !b.closed;
	// };
	// q.canOwnBlock = function(b, optionalField) {
	// 	return b.is_owner && !b.closed && b.ownership_state != "new";
	// };

	// q.maxDate = function(bpath) {
	// 	var b = q.block(bpath || q.rootBlock());
	// 	return sb.ext.date(q.rootBlock().end_date);
	// };
	// q.minDate = function(bpath) {
	// 	var b = q.block(bpath || q.rootBlock());
	// 	return sb.ext.date(q.rootBlock().start_date);
	// };

	// q.blockTarget = function(b) {
	// 	b = (sb.ext.isStr(b) || sb.ext.isArr(b)) ? q.block(b) : b;
	// 	if(!b || b.ownership_state == "new") { return 0; }
	// 	return b.expected_progress;
	// },
	// q.blockProgress = function(b) {
	// 	b = (sb.ext.isStr(b) || sb.ext.isArr(b)) ? q.block(b) : b;
	// 	if(!b || b.ownership_state == "new") { return 0; }
	// 	return b.percent_progress;
	// },
	// q.blockVariance = function(b) {
	// 	var p  = q.blockProgress(b);
	// 	var e  = q.blockTarget(b);
	// 	return (e > 0) ? (Math.floor( ((p - e)/e) *100)) : 100;
	// };


	// q.blockProgressRatioLabel = function(b) {
	// 	var p = q.blockProgress(b);
	// 	var t = q.blockTarget(b);
	// 	return [p,"/",t].join("");
	// };


	// //returns the available range of dates for the date picker on this block
	// // 1. Block cannot START earlier than its parent blocks
	// // 2. Block cannot START later than its earliest child start date, or the parent's end date
	// // 3. Block cannot  END before its parent's start date or it's latest child's end date.
	// // 4. Block cannot END after its parent unless that parent it floating
	// q.dateRange = function(b) {
	// 	var dates = {
	// 		minStart: moment(new Date(1980,1,1)),	
	// 		maxStart: moment(new Date(2038,12,31)),	
	// 		minEnd: moment(new Date(1980,1,1)),	
	// 		maxEnd: moment(new Date(2038,12,31))	
	// 	};
		
	// 	var p = q.block(b.default_parent);
	// 	var maxsd = b.children.map(function(cid) { return q.block(cid).start_date; }).put(p ? p.end_date : dates.maxStart);
	// 	var mined = b.children.map(function(cid) { return q.block(cid).end_date; }).put(p ? p.start_date : dates.minEnd);
		
		
	// 	dates.maxStart = sb.ext.minDate.apply(null, maxsd);
	// 	dates.minStart =  p ? p.start_date : dates.minStart;
	// 	dates.maxEnd = p && !p.floating_end_date ? p.end_date : dates.maxEnd;
	// 	dates.minEnd = sb.ext.maxDate.apply(null, mined);
	// 	return dates;
	// };
	
	
	// q.is_link = function(parent, child) {
	// 	var pid = q.blockId(parent);
	// 	var id = q.blockId(child);
	// 	return _parent_child_link(pid, id).linked_parent_id != null;
	// };
	
	// q.custom_progress_weight = function(ppath, cpath) {
	// 	return sb.ext.to_i(_parent_child_link(ppath, cpath).custom_progress_weight) || 0;
	// };
	
	// var _parent_child_link = function(ppath, cpath) {
	// 	var blocks = sb.models.raw("blocks");
	// 	var parent = q.block(ppath);
	// 	var child = q.block(cpath);

	// 	if (parent.children.indexOf(child.id) == -1) {
	// 		throw new Error("Block(" + child.id + ") is not a parent of block(" + parent.id + ")");
	// 	}
	// 	return child.parents.findKey("parent_id", parent.id).value;
	// };
	
	// q.progressVariance = function(bpath) {
	// 	var b = q.block(bpath);
	// 	if(b) {
	// 		var a = b.percent_progress || 100;
	// 		var t = b.expected_progress || 0;
	// 		return t > 0 ? Math.round((a-t)/t*100) : 100;
	// 	}
	// 	return 0;
	// };
	
	// //recursive function -- no arguments are required on initial call
	// //1. If you supply arguments, you can build a subtree
	// //2. This function is designed to build trees for the map layout using D3.js
	// //3. Linked nodes are duplicated in the structure. 
	// //4. If cpath is not passed, cpath is set to the actual root. 
	// //5. If ppath is not passed, "cpath" is considered the current root: this is useful
	// //			for re-orienting the tree around the currently selected block
	// //6. If cpath and ppath is passsed on the initial call, the tree returned will be a branch
	// //		
	// //6. Blocks is only passed to simplify the recursion -- should never be necessary to pass it
	// //			unless you want a tree using a subset of data (
			
	// q.blockFullTree = function(cpath,ppath, blocks) {
	// 	blocks = blocks || sb.models.raw("blocks");
	// 	if(!blocks) { return; }
		
	// 	if(sb.ext.isStr(cpath) && sb.ext.isArr(ppath)) {
	// 		cpath = ppath.concat([cpath]);
	// 	}


	// 	cpath = q.blockPath(cpath || q.rootBlock().default_path);
	// 	ppath = ppath ||[];
	// 	//var ppath = ppath ||cpath.slice(0,-1);                                        
	// 	var b = blocks[cpath.last()];
		
	// 	var d = {
	// 		name: b.title,
	// 		data: b,
	// 		path: cpath,
	// 		children: []
	// 	};

	// 	var children = b.children.cloneExcept(ppath.last());
	// 	children.map(function(el) { return cpath.concat([el]); });
	// 	var rp = cpath.last(1);
	// 	if( rp && ppath.last() != rp) {
	// 		children.unshift(cpath.slice(0,-1));
	// 	}
				
	// 	var size = 1;
	// 	var leaves = 0;
	// 	var height= 1;
	// 	var child;
	// 	d.height = height;
		
	// 	children.forEach(function(el) {
	// 		var child = q.blockFullTree(el, cpath, blocks);
	// 		size += child.size;
	// 		d.children.put(child);
	// 		leaves += child.leaves || 1;
	// 		height = Math.max(d.height+1, child.height+1);
	// 	});
	// 	d.height = height;
	// 	d.size  = size;
	// 	d.leaves = leaves;
	// 	d.depth = cpath.length -1;
	// 	return d;
	// };



	// //linear function that builds the center list from the current block to the root. 
	// //1. takes the previous block id so that the position of the children can reflect
	// //		where we've come from. 
	
	q.buildStrategyTree = function(prevBlockId) {
		var b = q.block();
		var blocks = sb.models.raw("blocks", "path"); 
		if(!b || !blocks) { return null; }
		

		//walk up the tree from current block
		var centerList = [];
		var cb = b;
		do {
			centerList.unshift(cb.path);
			cb = blocks[cb.parentPath];
		} while(cb);

		//add the child 
		var dy = -(centerList.length-1);
		if(b.children.length) {
			var cidx = b.children.indexOf(prevBlockId);
			var cpath = b.children[cidx < 0 ? 0 : cidx];
			centerList.push(cpath);
		}
		
		//temp super parent to our root object to simplify the special cases
		//list is a flat collection of the same nodes

		var superRoot = {list:[]};
		var pnode = superRoot;
		

		//walk down the center
		centerList.forEach(function(cpath) {
			var b = q.block(cpath);
			var p = b.parent ? q.block(b.parent) : null;
			
			var siblings = p ? p.children : [cpath];
			var cidx = siblings.indexOf(cpath);
			
			pnode.children = siblings.map(function(path, idx) {
				var cb = blocks[path];
				return {
					_parsed:true,
					id:path,
					path:path,
					parent:cb.parent,
					name:cb.title,
					dy:dy,
					dx:(idx - cidx),
					data: cb,
				};
			});
			//
			superRoot.list = superRoot.list.concat(pnode.children);

			dy += 1;
			pnode = pnode.children[cidx];
		});
		// return superRoot.children[0];
		return superRoot.list;
	};


	// q.defaultBlockType = function(type) {
	// 	var kn = type || null;
	// 	var types = sb.consts.blockTypes();
	// 	var val = types.findKey("key", ST.state("blockType")).value;
	// 	val = val || types[0];
	// 	return kn ? val[kn] : val;
		
	// };

	// q.blockType = function(path) {
	// 	//make sure this property exists before we use it. 
	// 	ST.initState("blockType", "status");
	// 	ST.initState("blockSettings", "");

	// 	var types = sb.consts.blockTypes({key:"shortkey"});

	// 	var defaultType = q.defaultBlockType("shortkey");
	// 	var localType = ST.getStateKey("blockSettings", path);
	// 	if(localType) {
	// 		localType = localType.match(/b\w/)[0];
	// 	}
	// 	return localType || defaultType;
	// }

	return q;
});

