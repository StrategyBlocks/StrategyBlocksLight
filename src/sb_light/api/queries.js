

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
	var Q = q;
	




	/********************************
		DASHBOARDS
	*********************************/
	q.dashboard = function() {
		//see if there's a dashboard in the context storage
		var cdb = ST.context("dashboard");
		var did = ST.state("dashboard");
		if(!cdb && did != "new" ) {
			var dm = sb.models.rawArray("dashboards");
			//find the selected dashboard
			if(did) {
				cdb = E._.find(dm, {id:ST.state("dashboard")});
			}
			//find the default dashboard
			if(!cdb) {
				cdb = E._.find(dm, {"default":true});
				if(!cdb && dm.length) {
					//take the first one
					cdb = dm[0];
				}
			}
		}
		//create a new temporary one

		if(!cdb) {
			cdb = {id:"new", title:"", manager_id:q.user().id, widgets:[]};
			// ST.context("dashboard", cdb);
		}

		if(!cdb.print) {
			cdb.print = {
				pages:1, size:"A4", "orientation": "portrait", zoom:1
			};
		}

		return cdb;
	};



	/********************************
		COMPANIES
	*********************************/
	q.company = function(cid /*optional*/) {
		var cc = ST.context("company") || null
		var cm = sb.models.rawArray("companies");
		if(!cid) { 
			return cc;
		}
		cid = cid || ST.state("company_id") || (cc && cc.id) || null;

		return (cc && cid == cc.id) ? cc : sb.models.find("companies", cid);
	};
	
	q.companyRollup = function() {
		var c = Q.company();
		return c ? c.default_progress_weight_method : 1;
	};
	q.companyLinkedRollup = function() {
		var c = Q.company();
		return c ? c.default_linked_rollup_method : 2;
	};
	q.companyHealth = function() {
		var c = Q.company();
		return c ? c.default_health_calculation_id : null;
	};
	q.companyLicense = function() {
		var c = Q.company();
		return c ? c.license : null;
	};
	q.companyLogo = function() {
		var c = Q.company();
		return c ? c.logo_path : null;
	};
	q.companyRisk = function() {
		var c = Q.company();
		return c ? c.risk : null;
	};

	q.companyMaxSessionDays = function() {
		var c = Q.company();
		return c ? c.stay_logged_in_duration : 0;
	};

	q.shortCompanyName = function(cid) {
		var c = Q.company(cid);
		var t = c ? c.name : null;
		return E.shorten(t, 25);
	};

	q.yearEnd = function() {
		var c = Q.company();
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
		var c = Q.company();
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
		var c = Q.company();
		return (c &&  c.risk && c.risk.profile_properties) || null;

	};


	/********************************
		USERS
	*********************************/
	var DELETED_NAME = "<deleted>";

	q.fullname = q.fullName = function(/*uid*/) {
		var u = q.user.apply(q, E.slice(arguments));
		return u ? (u.name || (u.firstname + " " + u.lastname)) : DELETED_NAME;
	};

	q.firstname = q.firstName = function(/*uid*/) {
		var u = q.user.apply(q, E.slice(arguments));
		return u ? u.first_name : DELETED_NAME;
	};

	q.shortname = q.shortName = function(/*uid*/) {
		var u = q.user.apply(q, E.slice(arguments));
		return u? (u.first_name.slice(0,1) + ". " + u.last_name) : DELETED_NAME;
	};

	q.lastname = q.lastName = function(/*uid*/) {
		var u = q.user.apply(q, E.slice(arguments));
		return u ? u.last_name : DELETED_NAME;
	};


	q.user = function(uid /*optional*/) {
		if( E.isNum(uid) ) { uid = String(uid); }
		if( !E.isStr(uid) ) { uid = uid ? uid.id : null; }
	
		var um = sb.models.raw("users") || {};
		
		//return the default user
		if(!uid && arguments.length === 0) { 
			uid = ST.state("user_id");
			return (uid && um[uid]) || ST.context("user"); 
		}

		//passed an argument and it wasn't found
		if(!uid && arguments.length > 0) {
			return null;
		}
		return um[uid] || null; 
	};


	q.userProfile = function() {
		var uid = ST.state("profile_user");
		return uid ? q.user(uid): null;
	};

	q.companyMembership = function(/*uid*/) {
		var u = q.user.apply(q, E.slice(arguments));
		if(!u) { return null; }

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
	
	q.authors  = function(includeInactive/*=false*/) {
		var cid = ST.state("company_id");
		return sb.models.rawArray("users").filter(function(el) {
			
												//TODO: Remove legacy API support
			var cm = el.company_membership || (el.companies && el.companies[cid] || null);
			return cm && (cm.active || includeInactive) && (cm.role == "Author" || cm.role =="Administrator");
		}).sort(sb.ext.sortUsers);
	};

	q.userLogoSrc = function(uid, size) {
		var u = q.user.apply(q, E.slice(arguments));

		return u.logo_path || q.gravatar(uid, size);
	};


	q.gravatar = function(uid, size) {
		var u = q.user.apply(q, E.slice(arguments));
		return "https://www.gravatar.com/avatar/" +  (u ? u.gravatar : "") + "?d=" + (u ? "identicon" : "mm") + "&s="+ (size||50);
	};


	q.userMessageDisplay = function(uid, message, width) {
		var u = q.user.apply(q, E.slice(arguments));
		if(!u) {
			return DELETED_NAME;
		}
		return 	"<div style='min-width:"+ (width || "auto") +"'><a target='_blank' href='mailto:"+ u.username + "' title='"+ q.fullname() +"' >"  + 
					" <img style='float:left;margin:0 5px 5px 0;' src='" + q.gravatar(u.id) + "'></img> " + q.shortName(u.id) + ": " +
				"</a> " + (message||"") + "</div>";
	};


	q.hasRole = function(rolStr) {
		if(!rolStr) { return true; }
		
		var cm = q.companyMembership();
		if(!cm ) { return  false; }
		rolStr = rolStr.toLowerCase();
		if(rolStr == "user") {
			return Q.isUser();
		}
		if(rolStr == "author") {
			return Q.isAuthor();
		}
		if(rolStr == "admin" || rolStr == 'administrator') {
			return Q.isAdmin();
		}
		return false;
	};


	q.isAdmin = function(/*uid*/) {
		var cm = q.companyMembership.apply(q, E.slice(arguments));
		return cm && cm.role == "Administrator";
	};
	q.isAuthor = function(/*uid*/) {
		var cm = q.companyMembership.apply(q, E.slice(arguments));
		return cm && (cm.role == "Author" || cm.role == "Administrator");
	};
	q.isUser = function(/*uid*/) {
		var cm = q.companyMembership.apply(q, E.slice(arguments));
		return cm && (cm.role == "User" || cm.role == "Author" || cm.role == "Administrator");
	};

	//checks *ONLY* if they're a user
	q.isLimitedUser = function(/*uid*/) {
		var cm = q.companyMembership.apply(q, E.slice(arguments));
		return cm && (cm.role == "User");
	};

	q.isMetricAdmin = function() {
		return q.isAdmin();
	};
	q.isRiskAdmin = function() {
		return q.isAdmin();
	};

	q.userActive = function(/*uid*/) {
		var cm = q.companyMembership.apply(q, E.slice(arguments));
		return cm && cm.active;	
	};
	q.userPrimary = function(/*uid*/) {
		var cm = q.companyMembership.apply(q, E.slice(arguments));
		return cm && cm.primary_contact;	
	};

	q.userGroups = function(/*uid*/) {
		var u = q.user.apply(q, E.slice(arguments));
		var g = sb.models.rawArray("groups") || [];

		return g.filter(function(v) {
			return v.users.indexOf(u.id) > -1;
		}).map(function(v) {
			return v.id;

		});
	};

	q.userBlocks = function(/*uid*/) {
		var u = q.user.apply(q, E.slice(arguments));
		if(!u) { return []; }
		
		return q.blocksOpen().filter(function(b) {
			return b.owner_id == u.id || b.manager_id == u.id;
		});
	};
	q.userMetrics = function(/*uid*/) {
		var u = q.user.apply(q, E.slice(arguments));
		if(!u) { return []; }

		return sb.models.rawArray("metrics").filter(function(b) {
			return b.owner_id == u.id || b.manager_id == u.id;
		});
	};
	q.userRisks = function(/*uid*/) {
		var u = q.user.apply(q, E.slice(arguments));
		if(!u) { return []; }
		
		return sb.models.rawArray("risks").filter(function(b) {
			return b.owner_id == u.id || b.manager_id == u.id;
		});
	};
	q.userStatus = function(/*uid*/) {
		var res = {
			blocksOwner: 	[],
			blocksManager: 	[],
			metricsOwner: 	[],
			metricsManager: [],
			risksOwner: 	[],
			risksManager: 	[],
			owned:			0,
			managed:		0,
			total:			0
		};

		var u = q.user.apply(q, E.slice(arguments));
		if(u) {
			res.blockOwner = 	E._.filter(sb.models.rawArray("blocks"), {owner_id: u.id});
			res.blockManager = 	E._.filter(sb.models.rawArray("blocks"), {manager_id: u.id});
			
			res.metricOwner = 	E._.filter(sb.models.rawArray("metrics"), {owner_id: u.id});
			res.metricManager = E._.filter(sb.models.rawArray("metrics"), {manager_id: u.id});
			
			res.riskOwner = 	E._.filter(sb.models.rawArray("risks"), {owner_id: u.id});
			res.riskManager = 	E._.filter(sb.models.rawArray("risks"), {manager_id: u.id});

			res.owned = res.blockOwner.length + res.metricOwner.length + res.riskOwner.length;
			res.managed = res.blockManager.length + res.metricManager.length + res.riskManager.length;
			res.total = res.owned + res.managed;
		}

		return res; 
	};

	q.userOwnedBlocks = function(/*uid*/) { 
		var cm = q.companyMembership.apply(q, E.slice(arguments)); 
		return (cm && cm.count_owned_blocks) || 0; 
	};
	q.userManagedBlocks = function(/*uid*/) { 
		var cm = q.companyMembership.apply(q, E.slice(arguments));
		return (cm && cm.count_managed_blocks) || 0; 
	};
	q.userOwnedKpis = function(/*uid*/) { 
		var cm = q.companyMembership.apply(q, E.slice(arguments));
		return (cm && cm.count_owned_kpis) || 0; 
	};
	q.userManagedKpis = function(/*uid*/) { 
		var cm = q.companyMembership.apply(q, E.slice(arguments));
		return (cm && cm.count_managed_kpis) || 0; 
	};
	q.userOwnedRisks = function(/*uid*/) { 
		var cm = q.companyMembership.apply(q, E.slice(arguments));
		return (cm && cm.count_owned_risks) || 0; 
	};
	q.userManagedRisks = function(/*uid*/) { 
		var cm = q.companyMembership.apply(q, E.slice(arguments));
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
		CAPABILITY
	*********************************/
	q.capability = function(key) {
		var cm = sb.models.raw("capabilities");
		var c = (key &&cm &&  cm[key]) || null;
		return !c || c.value === true;

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

	q.metricLocked = function(m) {
		return !Q.isAdmin() && m.locked;
	};


	q.isMetricOwner = function(m) {
		return m && m.is_owner && !q.metricLocked(m); 
	};
	q.isMetricManager = function(m) {
		return m && m.is_manager && !q.metricLocked(m);
	};

	q.canEditMetric = function(m) {
		return q.isMetricOwner(m) || q.isMetricManager(m);
	}

	q.formatMetric = function(m, value, nounit/*=false*/) {
		var val = accounting.formatNumber(value, m.number_decimals);
		if(nounit) { return val; }
		return m ? 
			(m.unit_before ? E.join("", m.unit, val) : E.join(" ", val, m.unit) ) : 
			"--"
		;

	};

	//DISPLAY purposes
	q.metricActual = function(id, hierarchyData) {
		var m = hierarchyData ||  q.metric(id);
		var ma = m.last_actual_value;
		return q.formatMetric(q.metric(id), ma);

	};

	//DISPLAY purposes
	q.metricTarget = function(id, hierarchyData) {
		var m = hierarchyData ||  q.metric(id);
		var mt = m.last_target_value;
		return q.formatMetric(q.metric(id), mt);
	};

	q._trendMap = {
		"down": "fa fa-lg fa-fw fa-arrow-circle-down",
		"Down": "fa fa-lg fa-fw fa-arrow-circle-down",
		"up": "fa fa-lg fa-fw fa-arrow-circle-up",
		"Up": "fa fa-lg fa-fw fa-arrow-circle-up",
		"flat": "fa fa-lg fa-fw fa-minus-circle",
		"Flat": "fa fa-lg fa-fw fa-minus-circle"
	};

	q.metricTrendClass = function(id, hierarchyData) {
		var m = hierarchyData ||  q.metric(id);
		if(!m) { return ""; }
		return "trend" + m.trend;
	};

	//DISPLAY purposes
	q.metricTrendMarkup = function(id, hierarchyData) {
		var m = hierarchyData ||  q.metric(id);
		return "<i class='" + (q._trendMap[m.trend]) + "'></i>";

	};

	q._metricStatusClass = {
		"good": "statusGood",
		"Good": "statusGood",
		"warning": "statusWarn",
		"Warning": "statusWarn",
		"bad": "statusBad",
		"Bad": "statusBad",
	};
	q._metricStatusIcon = {
		"bad": "fa fa-lg fa-fw  fa-times-circle",
		"Bad": "fa fa-lg fa-fw  fa-times-circle",
		"good": "fa fa-lg fa-fw fa-check-circle",
		"Good": "fa fa-lg fa-fw fa-check-circle",
		"warning": "fa fa-lg fa-fw fa-minus-circle",
		"Warning": "fa fa-lg fa-fw fa-minus-circle"
	};
	q.metricStatusClass = function(id, hierarchyData) {
		var m = q.metric(id);
		if(!m) { return ""; }

		var status = hierarchyData ? hierarchyData.status :  m.status;

		return q._metricStatusClass[status];
	};


	//DISPLAY purposes
	q.metricStatusMarkup = function(id, hierarchyData) {
		var m = q.metric(id);
		if(!m) { return ""; }

		var status = hierarchyData ? hierarchyData.status :  m.status;
		return "<i class='" + (q._metricStatusIcon[status] + " " + q._metricStatusClass[status]) + "'></i>";
	};


	q._metricTypeMap = {
		"B": "fa fa-lg fa-fw fa-user", 	//basic
		"C": "fa fa-lg fa-fw fa-calculator",	//calculated
		"H": "fa fa-lg fa-fw fa-sitemap",	//hierarchical
	};


	q.metricTypeMarkup = function(id, sortKey/*==false*/) {
		var m = q.metric(id);
		if(!m) { return sortKey ? "Z" : ""; }

		var num = (m.hierarchy && "H") || ((m.calculation_actuals || m.calculation_targets) && "C") || "B";

		return sortKey ? num : ("<i class='" + q._metricTypeMap[num] + "'></i>");
	};


	q.metricChartData = function(id, hierarchyData, options) {
		// var timer = E.moment();
		options = options || {}

		var m = q.metric(id);
		var percent = m.percentage ? true : false;
		var start = E.min(m.range_start, m.range_end);
		var end = E.max(m.range_start, m.range_end);
		var today = E.serverDate(E.today());

		//display values
		var targets = hierarchyData ? hierarchyData.target : m.target;
		var actuals = hierarchyData ? hierarchyData.actuals : m.actuals;

		targets  = (targets && targets.length) ? E._.cloneDeep(targets) : [{date:E.serverDate(), value:0}];
		actuals  = (actuals && actuals.length) ? E._.cloneDeep(actuals) : [{date:E.serverDate(), value:0}];


//		targets.push({date:today, value:(m.last_target_value||0)});
//		actuals.push({date:today, value:(m.last_actual_value||0), comment:"Current Actual"});

		targets.sort(E.sortServerDate("date", false));
		actuals.sort(E.sortServerDate("date", false));

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
		var targetsMap = E.toObject(targets, "date");


		//add all the date strings to an array. Optionally add a lower-cap and an upper cap
		var all_dates = E._.union(targetDatestr, actualDatestr).sort();
		if (options.limit_past) {
			all_dates.push(options.limit_past);
		} 
		if (options.limit_future) {
			all_dates.push(options.limit_future);
		} 

		//ceate a unique, sorted list of dates. 
		var datestr = all_dates.sort(function(a,b) {
			return E.sortDate(E.serverMoment(a), E.serverMoment(b));
		});

		//if today is in the middle, add the date and re-sort
		var first = E.serverMoment(datestr[0]);
		var last = E.serverMoment(datestr.last());

		if(options.limit_past) {
			datestr = E._.filter(datestr, function(v) {
				return E.daysDiff(v, options.limit_past) >= 0;
			});
		}
		if(options.limit_future) {
			datestr = E._.filter(datestr, function(v) {
				return E.daysDiff(options.limit_future, v) >= 0;
			});
		}

		//add TODAY if we don't have it and it falls into range between first/last dates, or we only have a single value  
		if(datestr.indexOf(today) < 0 && (datestr.length < 2 || (E.daysDiff(today, first) > 0 && E.daysDiff(last,today) > 0 ))) {
			datestr.push(today);
			datestr = datestr.sort(function(a,b) {
				return E.sortDate(E.serverMoment(a), E.serverMoment(b));
			});
		}

		//add a dummy date one month ago if we dont't yet have enough data to chart. 
		if(datestr.length < 2) {
			datestr.unshift(E.moment().subtract(1,"month").format(E.serverFormat));
		}



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
			actualDomain.unshift(E.today());

			actualRange.push(actualValues[0]);
			actualRange.unshift(0)
		}
		var targetDomain = targetDates;
		var targetRange = targetValues;
		var upperRange = upperValues;
		var lowerRange = lowerValues;
		if(targetDomain.length === 1) { 
			targetDomain.push(E.moment().add(1, "month").toDate());
			targetDomain.unshift(E.today());
			targetRange.push(targetValues[0]);
			upperRange.push(upperValues[0]);
			lowerRange.push(lowerValues[0]);

			targetRange.unshift(0);
			upperRange.unshift(0);
			lowerRange.unshift(0);
		}

		var arRange, trRange, alRange, tlRange,
			arDomain, trDomain, alDomain, tlDomain,
			arScale, trScale, alScale, tlScale
		;

		actualDomain.unshift(E.moment(actualDomain[0]).subtract(1,"minute").toDate());
		actualRange.unshift(0);
		var aScale = d3.time.scale().domain(actualDomain).range(actualRange).clamp(true);
		// var raScale = d3.time.scale().domain(raDomain).range(raRange).clamp(true);


		var tScale = d3.time.scale().domain(targetDomain).range(targetRange).clamp(true);
		// var rtScale = d3.time.scale().domain(rtDomain).range(rtRange).clamp(true);


		var upperScale = d3.time.scale().domain(targetDomain).range(upperRange).clamp(true);
		var lowerScale = d3.time.scale().domain(targetDomain).range(lowerRange).clamp(true);

		var scales = [aScale, tScale/*, raScale, rtScale*/, upperScale, lowerScale];
		if(hierarchyData) {
			var arList = E._.clone(hierarchyData.actuals_rollup.sort(E.sortServerDate("date",false)));
			var trList = E._.clone(hierarchyData.target_rollup.sort(E.sortServerDate("date",false)));
			var alList = E._.clone(hierarchyData.actuals_local.sort(E.sortServerDate("date",false)));
			var tlList = E._.clone(hierarchyData.target_local.sort(E.sortServerDate("date",false)));

			//make sure each list has at least two items
			E.each([arList, trList, alList, tlList], function(list) {
				if(!list.length) {
					list.push({date:E.serverDate(E.today()), value:0});
				}
				if(list.length < 2) {
					list.push({date:E.serverMoment(list[0].date).subtract(1, "day"), value:0});	
				}
			});

			arList.sort(E.sortServerDate("date", false));
			alList.sort(E.sortServerDate("date", false));
			trList.sort(E.sortServerDate("date", false));
			tlList.sort(E.sortServerDate("date", false));

			// Rollup and local raw values
			arRange = E.values(arList, "value");
			trRange = E.values(trList, "value");
			alRange = E.values(alList, "value");
			tlRange = E.values(tlList, "value");

			arDomain = E.values(arList, "date", E.serverToDate);
			trDomain = E.values(trList, "date", E.serverToDate);
			alDomain = E.values(alList, "date", E.serverToDate);
			tlDomain = E.values(tlList, "date", E.serverToDate);


			arDomain.unshift(E.moment(arDomain[0]).subtract(1,"minute").toDate());
			arRange.unshift(0);
			alDomain.unshift(E.moment(alDomain[0]).subtract(1,"minute").toDate());
			alRange.unshift(0);

	
			arScale = d3.time.scale().domain(arDomain).range(arRange).clamp(true);
			alScale = d3.time.scale().domain(alDomain).range(alRange).clamp(true);
			trScale = d3.time.scale().domain(trDomain).range(trRange).clamp(true);
			tlScale = d3.time.scale().domain(tlDomain).range(tlRange).clamp(true);

			scales.put(arScale,alScale,trScale,tlScale);
		}

		if(!m.interpolate_values) {
			E.each(scales, function(s) {
				s.interpolate(function(a,b) {
					//step-after interpolate
					return function(t) {
						return t < 1 ? a : b; 
					};
				});
			});

		}


		var res = {
			td:targetDates,			tv:targetValues,
			ad:actualDates,			av:actualValues,
			as:aScale,				ts:tScale,
			// ras:raScale,			rts:rtScale,
			us:upperScale,			ls:lowerScale,
			uv:upperValues,			lv:lowerValues
		};

		if(hierarchyData) {
			res.ars = arScale;
			res.als = alScale;
			res.trs = trScale;
			res.tls = tlScale;
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

			var c = (E._.find(alList, {date:ds}) || actualsMap[ds] || {}).comment || "";

			var isActual =  actualsMap[ds] ? true : false;
			var isTarget = targetsMap[ds] ? true : false;

			var el = {
				date:d,
				moment:dm,
				dateStr: ds,
				dateNum: dn,
				target:t,
				target_rollup: (trScale ? trScale(d) : null),
				target_local: (tlScale ? tlScale(d) : null),

				actual:a,
				actual_rollup: (arScale ? arScale(d) : null),
				actual_local: (alScale ? alScale(d) : null),
				upper:u,
				lower:l,
				variance:v,
				comment:c,
				isRealActual: isActual,
				isRealTarget: isTarget
			};

			return el;
		});

		return res;
	};


	q.progressChartData = function(progressData, bid) {
		var pd = progressData[String(bid)];
		if(!pd) { return null;}

		var percent = true;
		var start = E.min(pd.range_end, pd.range_end)/100;
		var end = E.max(pd.range_start, pd.range_end)/100;
		var today = E.today();
		var tomorrow = E.moment().add(1, "day");
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

		if(td.length < 2) {
			td.push(E.moment(td[0]).add(1, "day").toDate());
			targetValues.push(targetValues[0]);
		}
		if(ad.length < 2) {
			ad.push(E.moment(ad[0]).add(1, "day").toDate());
			actualValues.push(actualValues[0]);
		}


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
			var v = E.variance(a,t);
			var u = Math.floor(upperScale(d));
			var l = Math.floor(lowerScale(d));

			return {
				date:d,
				dateStr: ds,
				dateNum: d.getTime(),
				target:t,
				actual:a,
				upper:u,
				lower:l,
				variance:v,
				// upperVariance:uv,
				// lowerVariance:lv,
				overdue: (E.daysDiff(end, d) > 0),
				comment:(actualsMap[ds] ? actualsMap[ds].comment : "")
			};
		});

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
	
	q.risk = function(r) {
		if(E.isNum(r)) { r = String(r); }
		//get the string 

		r = E.isStr(r) ? r : (r ? r.id : r );
		r = (r || !arguments.length) ? (r || ST.state("risk")) : null;
		//takes an object or string
		r = r ? sb.models.find("risks", r): null;
		return r ||  null;
	};


	q._riskStatusMap = {
		"inactive": "statusGood",
		"warning": "statusWarn",
		"triggered": "statusBad"
	};

	q.riskStatusClass = function(r, bid) {
		if (!bid) {
			return q._riskStatusMap[r.status];
		} else {
			var ri = E._.find(r.risk_impacts, {block_id:bid})
			return ri ? q._riskStatusMap[r.health_status] : q._riskStatusMap["inactive"]; 
		}
	};

		//DISPLAY purposes
	q.riskStatusMarkup = function(r) {
		r = q.risk(r);
		if(!r) { return ""; }

		return "<i class='fa fa-lg fa-fw fa-exclamation-triangle " + q._riskStatusMap[r.status] + "'></i>";
	};


	q.riskStatusMessage = function(r) {
		r = q.risk(r);

		return r.status =="triggered" ? "<strong>Triggered </strong>" : (
			r.status =="warning" ? "<strong>Warning</strong>" : "<span class='text-muted'>Inactive</span>"
		);   
	};

	q.isRiskOwner = function(r) {
		r = q.risk(r);
		return r && r.is_owner;
	};
	q.isRiskManager = function(r) {
		r = q.risk(r);
		return r && r.is_manager;
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
		var c = Q.company();
		rb = c ? (c.root_block || null): null;
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

	//if b is not passed, it's asssumed to be the current block
	q.blockDistance = function(a, b) {
		a = q.block(a);
		b = b ? q.block(b) : q.block();
		if(!a || !b) { return 9999999; } // big number;
		a = a.path.split("_"); b = b.path.split("_");

		while(a.length && b.length && a[0] == b[0]) {
			a.shift();
			b.shift();
		}
		var d = (a.length + b.length) + ((a.length > 0 && b.length > 0) ? -1 : 0);
		return d;
	};


	q.blockStatusClass= function(b) {
		b = q.block(b);
		var status = "status" + E.caps(b.status);
		if(b.FILTER_PLACEHOLDER) {
			status += " placeholder";
		} 
		return status;
		// return b.ownership_state == "new" ? "statusPrivate" : 
		// 		(b.closed ? "statusClosed" : 
		// 			("status" + E.caps(b.progress_color))
		// 		)
		// ;
	};

	q.blockTypeClass= function(b) {
		b = q.block(b);
		return b.is_company ? "blockTypeCompany" : (b.is_link ? "blockTypeLink" : "blockTypeNormal");
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
			return "Overdue by <strong>" + dd + "</strong> days.";
		} else if (dd === 0) {
			return "Due <strong>today</strong>";
		} else {
			var ds = E.daysDiff(E.today(), b.start_date);
			if(ds < 0) {
				return "Starts in <strong>" + ds + "</strong> days.";
			} else if (ds === 0) {
				return "Starts <strong>today</strong>";
			} else {
				return "<strong>" + Math.abs(dd) + "</strong> days remaining. <strong>" + b.expected_progress + "% </strong> expected.";
			}
		}
	};


	q.childBlocks = function(b) {
		b = arguments.length ? Q.block(b) : Q.block();
		if(!b) { return []; }
		return E.map(b.children, function(cb) {
			return Q.block(cb);
		});
	};
	//alias
	q.childrenBlocks = q.childBlocks;


	q.siblingBlocks = function(b) {
		b = arguments.length ? Q.parentBlock(b) : Q.parentBlock();
		if(!b) { return []; }
		return E.map(b.children, function(cb) {
			return Q.block(cb);
		});
	};

	q.blocksOpen = function() {
		return E._.filter(sb.models.rawArray("blocks"), {is_open:true});
	};
	q.blocksAddChildren = function() {
		return E._.filter(sb.models.rawArray("blocks"), {is_link:false, is_company:false, is_owner:true, is_closed:false});
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


	q.blockStatusMarkup = function(b) {
		b= q.block(b);
		if(!b) { return "";}

		var pc = sb.colors.status(b);
		return "<i class='fa fa-lg " + sb.icons.progressIcon(b) + "' style='color:" + pc + "'></i>";

	};
	q.blockHealthMarkup = function(b, size/*=fa-lg*/) {
		b= q.block(b);
		if(!b) { return "";}

		var hc = sb.colors.status(b.health_type);
		return "<i class='fa " + (size || "fa-lg") + " " + sb.icons.healthIcon(b) + "' style='color:" + hc + "'></i>";

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
		var ds = ST.cookie("displaySettings");
		var bt = ds.blockType || "status";
		// ST.initState("blockType", "status");
		
		var kn = type || null;
		var types = sb.consts.blockTypes();
		var val = types.findKey("key", bt).value;
		val = val || types[0];
		return kn ? val[kn] : val;
		
	};

	q.blockType = function(path) {
		var defaultType = q.defaultBlockType("key");
		var blockSettings = ST.cookie("blockSettings");
		var bs = blockSettings[path] || {};		

		return bs.blockType || defaultType;
	};

	q.blockLocked = function(b) {
		return !Q.isAdmin() && (b.locked || b.locked_inherited);
	};

	q.canDeleteBlock = function(b) {
		return !Q.blockLocked(b) && b.is_manager && b.parent;
	}

	q.isBlockManager = function(b) {
		return !Q.blockLocked(b) && b.is_manager;
	}
	q.isBlockOwner = function(b) {
		return !Q.blockLocked(b) && b.is_owner;
	}

	q.canCloseBlock = function(b) {
		return Q.isBlockManager(b) && b.can_close;
	}

	q.canPublishBlock = function(b) {
		return Q.isBlockOwner(b) && b.ownership_state == "new";
	}

	q.canEditBlock = function(b) {
		return q.canManageBlock(b) || q.canUpdateProgress(b) ;
	};
	q.canManageBlock = function(b) {
		return Q.isBlockManager(b) && !b.closed && !b.is_sub_company_block;
	};
	q.canUpdateProgress = function(b) {
		return Q.isBlockOwner(b) && !b.closed && b.ownership_state != "new" && b.leaf &&  !b.sub_company_block;
	};
	q.canAddChildren = function(b) {
		return Q.isBlockOwner(b) && !b.closed && !b.milestone_definition_id && !b.sub_company_block;
	}


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








	// //linear function that builds the center list from the current block to the root. 
	// //1. takes the previous block id so that the position of the children can reflect
	// //		where we've come from. 
	
	q.buildStrategyTree = function(prevBlockId) {
		var b = q.block();
		var filteredBlocks = sb.models.filteredList("blocks", "path");
		// console.log("filteredBlocks", filteredBlocks); 
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
			

			pnode.children = siblings.map(function(path, idx) {
				var cb = blocks[path];
				if(siblings[0] == cpath) {
					// console.log("Root B", cb);					
				}

				return {
					_parsed:true,
					id:path,
					path:path,
					parent:cb.parent,
					name:cb.title,
					dy:dy,
					// dx:(idx - cidx),
					data: cb
				};
			});
			//clone the list in case it's needed.
			pnode.originalChildren = ([]).concat(pnode.children);

			//filter the hidden ones from the children list
			E._.remove(pnode.children, function(d) {
				return d.data.FILTER_HIDDEN;
			});

			//find X-postion after filters
			var cidx = E.max(0, E._.findIndex(pnode.children, {path:cpath}));
			E.each(pnode.children, function(v,i) {
				v.dx = (i - cidx);
			});

			//concat to the main flat list
			superRoot.list = superRoot.list.concat(pnode.children);

			dy += 1;
			pnode = pnode.children[cidx];
		});
		// return superRoot.children[0];


		return superRoot.list.length ? superRoot.list[0] : null;
	};

	return q;
});

