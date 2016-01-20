
/*globals define */

define(['sb_light/models/_abstractModel','sb_light/globals'], function( _Model, sb ) {
	'use strict';

	var E, Q;

	var Model = _Model.extend({

		//default response for models returns the id model
		//but you can ask for the pathmodel by calling (rawArray("path"))
		//path model has keys based on the block path
		_idModel:null,
		_idArray:null,
		_pathModel:null,
		_pathArray:null,

		_progress: null,
		_health: null,
		_npv: null,
		_npv_queue:null,
		_progress_queue:null,
		_health_queue:null,
		
		_properties: null,
		_propertiesList: ["comments","news","tags","documents", "context", "watching_users"],
	
		init: function() {
			this._npv_queue = [];
			this._progress_queue = [];
			this._health_queue = [];
			this._properties = {};

			E = sb.ext;
			Q = sb.queries;

			this._dataHandlers = {
				"_health": 	this._massageHealth,
				"_progress": 	this._massageProgress,
				"_npv": 	this._massageNpv
			};
			
			this._super("blocks", sb.urls.MODEL_BLOCKS);
		},
		
		//override the get function to handle a type. Path model or id model.
		get: function(type) {
			var array = this._super();
			if(array) {
				return this.rawArray(type);
			}
			return null;
		},

		rawArray: function(type) {
			return type === "path" ? this._pathArray : this._super();
		},
		raw: function(type) {
			return type === "path" ? this._pathModel : this._super();
		},




		find: function(id) {
			if(E.isStr(id) && id.match("_")) {
				return this._pathModel ? this._pathModel[id] : null;
			} else {
				return this._super(id);
			}
		},



		filteredList: function(type) {
			return type != "path" ? this._super() : this.filteredTree(); 
		},


		filteredTree: function() {
			var filters = this._filters || {};
			var ff = this.filterItem.bind(this, filters);
			var list = E._.filter(this._pathArray, ff); 
			var self = this;

			//add information about placeholder nodes
			var rb = E._.find(this._model, {is_root:true});
			var recurse = function(parent) {
				var childPassed = (!parent.children && !parent.children.length) || E.reduce(parent.children, function(prev, c) {
					var cb = self.find(c);
					recurse(cb);
					return prev || cb.FILTER_SHOW || cb.FILTER_PLACEHOLDER;
				}, false)

				parent.FILTER_PLACEHOLDER = !parent.FILTER_SHOW && (childPassed || Q.block().path == parent.path);
				parent.FILTER_HIDDEN = !parent.FILTER_PLACEHOLDER && !parent.FILTER_SHOW;
			}
			recurse(rb);

			return list;	
		},

		//*******************FILTER FUNCTION OVERRIDES************************************
		filter_distance: function(b, maxDistance) {
			var dist = Q.blockDistance(b);

			console.log("DISTANCE", b.title, dist);
			return dist <= maxDistance;			
		},

		filter_search: function(b, searchString) {
			return true;
		},
		filter_tags: function(b, tagsList) {
			if(!tagsList || !tagsList.length) { return true; }
			var tags = E._.filter(sb.models.raw("tags"), function(t) {
				return tagsList.indexOf(t.id) >= 0 && t.blocks.indexOf(b.id) >= 0;
			});
			return tags.length > 0;
		},
		//********************************************************************************




		_handleUpdate: function(update) {
			var ts = this._timestamp;

			this._super(update);
			
			if(ts != this._timestamp) {
				this._progress = null;
				this._health = null;
				this._npv = null;
				this._properties = {};
			}

		}, 
		
		//usually override by the model subclasses to provide some post-processing on the model elements before consumption 
		//by a view
		_massageUpdatedModel: function() {
			this._super();
			var root = E._.find(this._model, function(v) {
				return !v.parents || v.parents.length === 0;
			});
			this._massage(root, null, 0, 0, (new Date()).getTime());

			if(!Q.block()) {
				sb.state.state("block", root.id);
			}
		},
		

		
		progress: function(cb) {
			this._data(cb, "_progress", sb.urls.BLOCKS_PROGRESS);
		},
		health: function(cb) {
			this._data(cb, "_health", sb.urls.BLOCKS_HEALTH);
		},
		npv: function(cb) {
			this._data(cb, "_npv", sb.urls.BLOCKS_NPV);
		},
			
		comments: function(id, cb, force) {	
			this._property(cb, "comments", id, force);		
		},
		news: function(id, cb, force) {		
			this._property(cb, "news", id, force);		
		},
		tags: function(id, cb, force) {		
			this._property(cb, "tags", id, force);		
		},
		documents: function(id, cb, force) {	
			this._property(cb, "documents", id, force);		
		},
		context: function(id, cb, force) {		
			this._property(cb, "context", id, force);		
		},
		watching: function(id, cb, force) {		
			this._property(cb, "watching_users", id, force);		
		},
		
		_property: function(cb, type, id, force) {
			if(this._propertiesList.indexOf(type) >= 0) {
				this._properties[type]  =  this._properties[type] || {};
				if(!this._properties[type][id] || force) {
					this._properties[type][id] = "waiting";
					
					//add callback to queue
					this._properties[type+"_queue"] = this._properties[type+"_queue"] || {};
					this._properties[type+"_queue"][id] =  this._properties[type+"_queue"][id] || [];
					this._properties[type+"_queue"][id].push(cb);
					
					sb.controller.invoke(sb.urls.BLOCKS_PROPERTIES, {id:id, type:type}, this._handleProperty.bind(this, type,id));
				} else if ( this._properties[type][id] == "waiting") {
					this._properties[type+"_queue"][id].push(cb);
				} else {
					cb(this._properties[type][id]);
				}
			} else {
				throw new Error("BlockModel property is not valid:" + type);
			}
		},
		
		//push all requests onto the queue and only invoke the controller if it's the first one and we don't have data
		_data: function(cb, name, url) {
			var func = this._handleData.bind(this,name );
			this[name+"_queue"].push(cb);
			
			if (!this[name]) {
				if(this[name+"_queue"].length == 1) {
					sb.controller.invoke(url, null, func);
				}
			} else {
				func();
			}
		},
		
		//process the queue for the data.
		_handleData: function(name, data) {
			this[name] = data ? data.result : this[name];
			if(this._dataHandlers[name] && data && data.result) {
				this._dataHandlers[name].call(this, this[name]);
			}
			while(this[name+"_queue"].length) {
				var cb = this[name+"_queue"].pop();
				cb(this[name]);
			}
		},
		
		//process the properties
		_handleProperty: function(type, id, data) {
			this._properties[type] = this._properties[type] || {};
			this._properties[type][id] = data ? data.result : this._properties[type][id];

			//EACH PROPERTY OBJECT IS BLOODY DIFFERENT........
			//NEED TO HANDLE THIS STUFF IN A NON-generic manner
					// E.each(this._properties[type][id], function(v) {
					// 	E.each(["date", "created_at", "updated_at"], function(d) {
					// 		if(v[d]) {
					// 			v[d] = E.moment(v[d], E.unixFormat);
					// 			}
					// 	})
					// });
			
			while(this._properties[type+"_queue"][id].length) {
				var cb = this._properties[type+"_queue"][id].pop();
				cb(this._properties[type][id]);
			}
		},
		
		_massageHealth: function(d) {
			var f = E.massageHealth;
			E.each(d, function(dv) {
				f(dv);
			});

		},
		_massageProgress: function(d) {
			// var f = E.massageTA;
			// E.each(d, function(dv) {
				// f(dv);
			// });			
		},
		_massageNpv: function(d) {

		},
		

		//returns the path of the current block
		_massage: function(b, p, depth, pos, schema) {
			var recurse = this._massage.bind(this);

			if(!p) {
				this._idModel = {};
				this._pathModel = {};
			}
			var pm = this._pathModel;

			if(E.isStr(b)) {
				b = this._model[b.split("_").last()];
			}

			var bpath = p ? [p.path, b.id].join("_") : b.id;
			var pinfo = p ? E._.find(b.parents, {parent_id:p.id}) : null;


			var csize = 0;

			var uid = Q.user().id;

			b = pm[bpath] = E.merge(E.merge(b, pinfo), {
				path:bpath,
				parentPath:(p ? p.path : null),
				parent:p,
				level: depth,
				level_sort: (p ? (p.level_sort + "." + (1+pos)) : "L1"),

				size:1,
				status: ((b.ownership_state == "new") ? "new" : (
							b.closed? "closed" : (
								b.progress_color == "red" ? "bad" : (b.progress_color == "yellow" ? "warning" : "good")
							)
						)),
				percent_health: (b.percent_health || 0),
				overdue: E.first(E.max(0, E.daysDiff(E.moment(), E.serverMoment(b.end_date))), 0),
				is_root:(depth===0),
				is_link: ((pinfo && pinfo.linked_parent_id !== null) ? true : false),
				is_company: b.sub_company_block,
				is_open: ((b.ownership_state == "new" || b.closed) ? false : true),
				is_mine: (b.owner_id == uid || b.manager_id == uid),
				is_real_owner: (b.owner_id==uid),
				is_real_manager: (b.manager_id == uid),
				can_move_left: (b.is_manager && (pos> 0)),
				can_move_right: (b.is_manager && p && (pos < p.children.length-1) && p.children.length > 1),
				can_delete: (b.is_owner && !b.closed),
				parent_title: (p ? p.title : ""),
				schema:schema,
				start_date_str: b.start_date,
				end_date_str: b.end_date,
				start_date: E.serverMoment(b.start_date),
				end_date: E.serverMoment(b.end_date),
				start_date_num: E.dateNumber(E.serverMoment(b.start_date)),
				end_date_num: E.dateNumber(E.serverMoment(b.end_date)),
				variance_progress: E.variance(b.percent_progress, b.expected_progress),
				groups: b.group_ids.concat(sb.groups.parseExpression(b.group_expression_inherited, true)),
				ownership: 	(b.owner_id == uid ? "owned" : 
							(b.manager_id == uid ? "managed" : 
							(b.ownership_state == "watched" ? "watched" : "none") ) )
			});

			b.last_updated = E.serverMoment(b.last_progress_updated_date_str||b.start_date);
			b.last_updated = E.maxDate(b.start_date, E.minDate(b.end_date, b.last_updated));

			//map children ids to paths
			b.children = b.children ? E.map(b.children, function(cpath, i) {
				return recurse(cpath, b, depth+1, i, schema);
			}) : [];


			E.each(b.children, function(cpath) {
				b.size += pm[cpath].size;
				b.height = E.max(1, b.height, pm[cpath].height+1);
			});

			if(!b.is_link) {
				//THIS IS BEING MADE WRONG AND I DON"T KNOW WHY
				this._idModel[b.id] = b;
			}

			return bpath;
		},
		_resetArrayCache:function() {
			this._super();


			// //
			this._idArray = this._modelArray = E.values(this._idModel);

			this._pathArray = E.values(this._pathModel);

			this._pathArray.sort(E.sortFactory("level_sort", E.sortString));

			this._model = this._idModel;

			//E.debug(this.name, this._modelArray.length);
		}
	});
	
	return Model;		
});


