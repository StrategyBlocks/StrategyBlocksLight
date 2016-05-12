
/*globals define */

define(['sb_light/models/_abstractModel','sb_light/globals'], function( _Model, sb ) {
	'use strict';

	var E;
	var Model = _Model.extend({

		init: function() {
			E = sb.ext;
		
			this._super("bookmarks", sb.urls.MODEL_BOOKMARKS);
		},

	/****************************

	bookmark: {
		page: The page we want to save
		block: current block ID
		metric: current metric ID
		risk: current Risk ID
		blockFilters: {
			search: 	
			tags: 		
			focus: 		
			owners: 	
			managers: 	
			groups: 	
			distance: 	
			levels: 	
			priority: 	
			ownership: 	
			status: 
		}
		blockSettings:  {
			"16179_16180_16188_16217" : {
				blockType: ""
				nodeType: ""
			}
			"16179" : {}
		}

		displaySettings:{
			nodeType:    //map node style
			blockType:	 //block view style
			mapLayoutType: //layout engine for blocks network
		}
	}




	*****************************/


		_massageUpdatedModel: function() {
			this._super();

			var self = this;


			E.each(this._model, function(d, k) {
				if(d.generated) {
					delete self._model[k];
				}
				var orig = d.state;
				if(d.state.match(/(^|;)page=/)) {
					d.state = self._migrateFlashState(orig);
				} else {
					d.state = JSON.parse(d.state);
				}
				d.created_moment  = E.moment(d.created_at, E.unixFormat);

			});	

		},

		_migrateFlashState: function(d) {
			var state = {};
			var map = {};
			E.each(d.split(/;/), function(d) {
				d = d.split(/=/);
				map[d[0]] = d[1];
			});

			this._migratePage(state, map);
			this._migrateModels(state, map);
			this._migrateFilters(state, map);
			this._migrateDisplaySettings(state, map);
			this._migrateBlockSettings(state, map);

			return state;
		},

		_migratePage: function(state, map) {
			var page = map.page; 
			state.page = PAGE_MAP[ page + '_' + map[page] ] || PAGE_MAP[page] || "blocksTree";
		},

		_migrateModels: function(state,map) {
			if(map.block) { 	state.block = map.block; }
			if(map.kpi) { 		state.metric = map.kpi; }
			if(map.risk) { 		state.risk = map.risk; }
		},

		_migrateFilters: function(state,map) {
			var f = state.blockFilters = {
				search: 	{},
				tags: 		{list:[], children: false },
				focus: 		{list:[], children: false },
				owners: 	{list:[] },
				managers: 	{list:[] },
				groups: 	{list:[] },
				distance: 	{distance:0},		
				levels: 	{/*start:0, end:5*/},
				priority: 	{/*start:0, end:10*/},
				ownership: 	{owned: true, managed: true, watched:true, normal:true, private:true},
				status: 	{good: true, bad:true, warning:true, overdue:true, closed:false },
			};


			if(map.tag && map.tag !== "show_all") {
				f.tags.children = map.tag.match(/^c/) ? true : false;
				f.tags.list = map.tag.replace(/^c/, "").split("_");
			}
			if(map.focus && map.focus !== "show_all") {
				f.focus.children = map.focus.match(/!/) ? true: false;
				f.focus.list = map.focus.replace(/!/g, "").split("-");
			}
			if(map.groups && map.groups !== "show_all") {
				f.groups.list = map.groups.replace(/!/g, "").split("-");
			}
			if(map.owner && map.owner !== "show_all") {
				f.owners.list = map.owner.replace(/!/g, "").split("-");
			}
			if(map.manager && map.manager !== "show_all") {
				f.managers.list = map.manager.replace(/!/g, "").split("-");
			}
			if(map.levels) {
				f.levels.start = E.to_i(map.levels.split("_")[0]);
				f.levels.end = E.to_i(map.levels.split("_")[1]);
			}

		
			var stateClosed = 			8;
			var stateNormal = 			16;
			var stateBad =  			32;
			var stateWarning =  		64;
			var stateGood =  			128;
			var statePrivate =  		256;

			if(map.state & stateClosed) 	{	f.status.closed 	= true;		}
			if(map.state & stateBad) 		{	f.status.bad 		= true;		}
			if(map.state & stateWarning) 	{	f.status.warning 	= true;		}
			if(map.state & stateGood) 		{	f.status.good 		= true;		}

			if( !(map.state & stateNormal) ) {	
				f.status.normal 	= false; 
				f.status.owned 		= false; 
				f.status.managed 	= false; 
				f.status.watched 	= false;  
			}
			if(	!(map.state & statePrivate)) {	
				f.status.private 	= false;		
			}


		},

		_migrateDisplaySettings: function(state, map) {
			var ds = state.displaySettings = state.displaySettings  || {}; 
			if(map.maplayout) {
				ds.mapLayoutType = map.maplayout == "tree" ? "horizontalTree" : "radialCluster"; 
			}
			if(map.blocktype) {
				ds.blockType = BLOCK_TYPE_MAP[map.blocktype]; 
			}
			if(map.maptype) {
				ds.nodeType = NODE_TYPE_MAP[map.nodetype]; 
			}
		},

		_migrateBlockSettings: function(state,map) {
			if(!map.block_settings) { return; }
			var settings = {};
			E.each(map.block_settings.split("-"), function(v) {
				v = v.split("!");
				var parts = v[1].split("_");
				var s = settings[v[0]] = {};
				E.each(parts, function(p) {
					if(p == "c") {
						s.collapse = true;
					} else if(NODE_TYPE_MAP[p]) {
						s.nodeType = NODE_TYPE_MAP[p];
					} else if(BLOCK_TYPE_MAP[p]) {
						s.blockType = BLOCK_TYPE_MAP[p];
					} else if(p.match(/^bk/)) {
						s.metric = p.replace(/^bk/,"");
					} else if(p.match(/^br/)) {
						s.risk = p.replace(/^br/,"");
					} else if(p.match(/^x/)) {
						s.x = p.replace(/^x/,"");
					} else if(p.match(/^y/)) {
						s.y = p.replace(/^y/,"");
					}
				});
			});

			state.blockSettings = settings;  
		},

	

		// //display options
		// "maplayout"="circular";
		// "blocktype"="bs";
		// "maptype"="mn";
		// "block_settings"="16179_16183!mh_x735_y398-16179_16183_16194!x477_y311";
		
		// //filters
		// "tag"="show_all";
		// "owner"="show_all";
		// "state"="111110111";
		// "manager"="show_all";
		// "levels"="";
		// "focus"="show_all"
		
		// //obsolete
		// "block_collapse"="none";
		// "timeline_sort"="sortTitleHier";
		// "map_labels"="true";
		// "map_depth"="1000";
		// "company"="301";
		// "risk_sub"=null


	});

	var PAGE_MAP = {
		"home_news":			"dashboardNew",
		"home_dashboard":		"dashboardCharts",

		"block_tree":			"blocksTree",
		"block_map":			"blocksNetwork",
		"block_timeline":		"blocksTable",
		"block_table":			"blocksTable",

		"monitor_kpis":			"metricsTable",
		"monitor_risks":		"risksTable",

		"admin_settings":		"settingsAccount",
		"admin_users":			"settingsUsers",
		"admin_levels":			"settingsLevels",
		"admin_focus":			"settingsFocus",
		"admin_company":		"settingsCompany",
		"admin_capabilities":	"settingsCapabilities",
		"admin_health":			"settingsHealth",
		"admin_risk":			"settingsRisk",
		"admin_milestones":		"settingsMilestones",
		"admin_login":			"settingsHistory",
		"admin_payments":		"settingsPayments",

		"help":					"helpDocumentation"
	}; 

	var BLOCK_TYPE_MAP = {
		"bs":	"status",
		"bd":	"status",
		"bn":	"info",
		"bh":	"health",
		"bk":	"metric",
		"br":	"risk",
		"bp":	"progress"
	};

	var NODE_TYPE_MAP = {
		"mn":	"status",
		"mt":	"title",
		"mh":	"block",
		"mb":	"block"
	};




	return Model;
});
