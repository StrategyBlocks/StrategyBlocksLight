
/*globals define */

define(['sb_light/models/_abstractModel','sb_light/globals', "fuse"], function( _Model, sb, Fuse ) {
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


		//*******************FILTER FUNCTION OVERRIDES************************************
	

		filter_search: function(m, searchString) {
			if(!searchString) {
				return true;
			}

			var fuse = new Fuse([m], {
				keys: ["title", "description"], 
				id:"id", 
				include:["score"],
				threshold:0.3}
			);
			var res = fuse.search(searchString); 
			return res && res.length ? true : false;
		},
	
		filter_types: function(m, typeList) {
			if(!typeList || !typeList.length) { return true; }

			var type = m.hierarchy ? "cascading" : ((m.calculation_actuals || m.calculation_target) ? "calculated" : "normal");

			switch(type) {
				case "cascading": return typeList.indexOf("cascading") > -1;
				case "calculated": return typeList.indexOf("calculated") > -1;
				case "normal": /* falls through */
				default:
					return typeList.indexOf("normal") > -1;
			}

		},
		//********************************************************************************



		_massageUpdatedModel: function() {
			this._super();

			//RESET THE HIERARCHICAL CACHE STUFF
			this._hierarchyCache = {};
			this._queue = {};


			var uid = Q.user().id; 

			E.each(this._model, function(v) {
				v.title_lower = E.lower(v.title);
				v.is_owner = E.isBool(v.is_owner) ? v.is_owner : (v.is_owner === "true");
				v.is_manager = E.isBool(v.is_manager) ? v.is_manager : (v.is_manager === "true");
				v.status = v.status.toLowerCase();
				v.trend = v.trend.toLowerCase();
				v.variance = E.variance(v.last_actual_value, v.last_target_value);
				v.statusNum = v.status == "good" ? 1 : (v.status == "warning" ? 2 : (v.status == "bad" ? 3 : 0)) ;
				v.trendNum = v.trend == "up" ? 1 : (v.trend == "flat" ? 2 : (v.trend == "down" ? 3 : 0)) ;
				v.is_mine = (v.owner_id == uid || v.manager_id == uid); 
				v.is_watching= (E._.find(v.watching_user_ids, uid) != null);
				v.cascade_list = E._.union(v.contributing_ids, v.contributing_ids_rollup);
				//used by other metrics
				v.used_by_metrics = E._.union(v.used_by_metric_ids_in_calculation_actuals, v.used_by_metric_ids_in_calculation_target);
				v.metrics_used = E._.union(v.calculation_actuals_metric_ids_used, v.calculation_target_metric_ids_used);

				v.is_score = (E.firstKey(v.calculation_actuals)||"").match(/score/);

				v.tolerance = {
					range_start: v.range_start,
					range_end: v.range_end,
					below_target_good: v.below_target_good,
					percentage: v.percentage
				};


				//add new keys for each textarea item and add "<br/>" for each line break.
				E.each(["description"], function(key) {
					v[key+"_html"] =  v[key] ? v[key].replace(/(?:\r\n|\r|\n)/g, '<br />') : "";  
				})
			});

		},

		hierarchy: function(mid, nidList, cb) {
			var self = this; 
			var m = this._model[mid];
			//ONLY fetch is this is a hierarchical metric
			if(!m.hierarchy) { return null; }

			var nodes  = nidList; 
			if(!nodes) {
				nodes = E._.map(sb.queries.blocksOpen(), "id");
			} else {
				nodes = E.isArr(nodes) ? nodes : [nodes];
			}



			self._hierarchyCache[mid] = self._hierarchyCache[mid] || {}; 

			E.each(nodes, function(nid) {
				var name = ["hierarchy",mid,nid].join("_");
				var data = self._hierarchyCache[mid][nid];
				
				if(!data) {
					self._queue[name] = self._queue[name] || [];
					self._queue[name].punique(cb || E.noop);
				} 
			});

			this._queueFetchList(mid);

			//check the original is an array 
			if(!nidList || E.isArr(nidList)) {
				//return a list
				var res = {};
				E.each(nodes, function(nid) {
					res[nid] = self._hierarchyCache[mid][nid] || null;
				});
				return res;
			} else if (nodes.length) {
				//return a single item
				var name = "hierarchy_"+mid+"_"+nodes[0];
				return  this._hierarchyCache[mid][nodes[0]] || null;
			}
			return null;

		},

		_queueFetchList: function(mid) {
			var currentNodes = [];
			E.each(this._queue||[], function(v,k) {
				var name = k.split("_");
				if(name[1] == mid) {
					currentNodes.punique(name[2]);
				}
			});

			if(currentNodes.length) {
				var cb = this._handleHierarchy.bind(this,mid, currentNodes );
				var func = sb.controller.metricHierarchy.bind(sb.controller, mid, currentNodes.join(","), cb );
				sb.queue.buffer(func, "MetricMode::queueFetchList::"+mid, 200, true);
			}
		},

		_handleHierarchy: function(mid, nodes, resp) {
			var self = this; 

			resp = resp && resp.result;
			if(!resp) { return; }

			self._hierarchyCache[mid] = self._hierarchyCache[mid] || {};

			E.each(nodes, function(nid) {
				var name = ["hierarchy",mid,nid].join("_");
				var cbs = self._queue[name] || [];
				var data = self._hierarchyCache[mid][nid] = resp[nid] || self._hierarchyCache[mid][nid] || null;

				if(data) {
					data.statusNum = data.status == "good" ? 1 : (data.status == "warning" ? 2 : (data.status == "bad" ? 3 : 0)) ;
					data.trendNum = data.trend == "up" ? 1 : (data.trend == "flat" ? 2 : (data.trend == "down" ? 3 : 0)) ;
					data.status = data.status.toLowerCase();
					data.trend = data.trend.toLowerCase();
				}

				while(cbs.length) {
					var f = cbs.pop();
					sb.queue.buffer(f, "metricModel_"+name, 200, data);
				}
				delete self._queue[name];
			});

		}


	});
	return Model;	
});

