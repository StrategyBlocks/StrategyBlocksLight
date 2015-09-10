
/*globals define */

define(['sb_light/models/_abstractModel','sb_light/globals'], function( _Model, sb ) {
	'use strict';

	var E;

	var Model = _Model.extend({

		_hierarchyCache: null,
		_queue: null,

		init: function() {
			this._super("metrics", sb.urls.MODEL_METRICS);
			E = sb.ext;

		},

		_massageUpdatedModel: function() {
			this._super();

			var t = E.moment();
			//E.each(this._model, this._massageMetric.bind(this));

			console.log("Massage: ", E.moment().diff(t));


			//RESET THE HIERARCHICAL CACHE STUFF
			this._hierarchyCache = {};
			this._queue = {};


			E.each(this._model, function(v) {
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

