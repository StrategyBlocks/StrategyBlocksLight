
/*globals define */

define(['sb_light/models/_abstractModel','sb_light/globals'], function( _Model, sb ) {
	'use strict';

	var E, Q;

	var Model = _Model.extend({

		_hierarchyCache: null,
		_queue: null,

		init: function() {
			this._super("metrics", sb.urls.MODEL_METRICS);
			E = sb.ext;
			Q = sb.queries;

		},

		_massageUpdatedModel: function() {
			this._super();

			var t = E.moment();
			//E.each(this._model, this._massageMetric.bind(this));

			// console.log("Massage: ", E.moment().diff(t));


			//RESET THE HIERARCHICAL CACHE STUFF
			this._hierarchyCache = {};
			this._queue = {};


			var uid = Q.user().id; 

			E.each(this._model, function(v) {
				v.is_owner = E.isBool(v.is_owner) ? v.is_owner : (v.is_owner === "true");
				v.is_manager = E.isBool(v.is_manager) ? v.is_manager : (v.is_manager === "true");
				v.status = v.status.toLowerCase();
				v.trend = v.trend.toLowerCase();
				v.statusNum = v.status == "good" ? 1 : (v.status == "warning" ? 2 : (v.status == "bad" ? 3 : 0)) ;
				v.trendNum = v.trend == "up" ? 1 : (v.trend == "flat" ? 2 : (v.trend == "down" ? 3 : 0)) ;
				v.is_mine = (v.owner_id == uid || v.manager_id == uid); 
				v.tolerance = {
					range_start: v.range_start,
					range_end: v.range_end,
					below_tolerance_good: v.below_tolerance_good,
					percentage: v.percentage
				};
			});

		},

		hierarchy: function(mid, nidList, cb) {
			var self = this; 
			var m = this._model[mid];
			//ONLY fetch is this is a hierarchical metric
			if(!m.hierarchy) { return null; }

			nidList = E.isArr(nidList) ? nidList : [nidList];
			var fetchList = [];
			var func = this._handleHierarchy.bind(this,mid, nidList );

			E.each(nidList, function(nid) {
				var name = "hierarchy_"+mid+"_"+nid;
				var data = self._hierarchyCache[name];
				
				if(!data) {
					if(!self._queue[name] ) {
						fetchList.push(nid);
					}
					self._queue[name] = self._queue[name] || [];
					self._queue[name].push(cb || E.noop);
				} 
			});

			if(fetchList.length) {
				console.log("Fetching HIERARCHY", mid, nidList,this._queue);
				sb.controller.metricHierarchy(mid, /*String(fetchList)*/null, func);
				return null;	
			}

			if(nidList.length > 1) {
				var res = {};
				E.each(nidList, function(nid) {
					var name = "hierarchy_"+mid+"_"+nid;
					res[nid] = self._hierarchyCache[name];
				});
				return res;
			} else {
				var name = "hierarchy_"+mid+"_"+nidList[0];
				return  this._hierarchyCache[name];
			}

		},

		_handleHierarchy: function(mid, nidList, resp) {
			var self = this; 

			resp = resp && resp.result;
			if(!resp) { return; }

			E.each(nidList, function(nid) {
				var name = "hierarchy_"+mid+"_"+nid;
				var data = self._hierarchyCache[name] = resp[nid] || self._hierarchyCache[name] || null;
				var cbs = self._queue[name] || [];
				while(cbs.length) {
					var f = cbs.pop();
					sb.queue.buffer(f, "metricModel"+name, 200, data);
				}
			});

		}


	});
	return Model;	
});

