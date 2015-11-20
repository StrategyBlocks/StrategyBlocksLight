
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
				}
			});

		},


		hierarchy: function(mid, nid, cb) {
			var name = "hierarchy_"+mid+"_"+nid;
			
			//ONLY fetch is this is a hierarchical metric
			var m = this._model[mid];
			if(!m.hierarchy) { return null; }

			var func = this._handleHierarchy.bind(this,mid, nid );
			var data = this._hierarchyCache[name];

			if(!data) {
				this._queue[name] = this._queue[name] || [];
				this._queue[name].push(cb || E.noop);
				
				if(this._queue[name].length == 1) {
					sb.controller.metricHierarchy(mid, nid, func);
				}
				return null;
			} 
			return data;
		},

		_handleHierarchy: function(mid, nid, resp) {
			var name = "hierarchy_"+mid+"_"+nid;
			var data = this._hierarchyCache[name] = (resp  && resp.result && resp.result[nid] ) || this._hierarchyCache[name] || null;

			var cbs = this._queue[name] || [];
			while(cbs.length) {
				cbs.pop()(data);
			}
		}


	});
	return Model;	
});

