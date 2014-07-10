
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


		_handleUpdate: function(update) {
			this._progress = null;
			this._health = null;
			this._npv = null;
			this._properties = {};

			this._super(update);
		},
		
		//usually override by the model subclasses to provide some post-processing on the model elements before consumption 
		//by a view
		_massageUpdatedModel: function() {
			this._super();
			var root = this._model[Q.rootBlock("id")];
			if(!root) {
				root = this._modelArray.filter(function(v){
					return !v.parents || !v.parents.length;
				})[0];
			}
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
			
		comments: function(id, cb, force) {	this._property(cb, "comments", id, force);		},
		news: function(id, cb, force) {		this._property(cb, "news", id, force);		},
		tags: function(id, cb, force) {		this._property(cb, "tags", id, force);		},
		documents: function(id, cb, force) {	this._property(cb, "documents", id, force);		},
		context: function(id, cb, force) {		this._property(cb, "context", id, force);		},
		watching: function(id, cb, force) {		this._property(cb, "watching_users", id, force);		},
		
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
			var f = E.massageTA;
			E.each(d, function(dv) {
				f(dv);
			});			
		},
		_massageNpv: function(d) {

		},
		
		_massage: function(b, ppath, depth, pos, schema) {
			var recurse = this._massage.bind(this);

			if(!ppath) {
				this._idModel = {};
				this._pathModel = {};
			}

			b = Q.block(b);
			var bpath = ppath ? [ppath, b.id].join("_") : b.id;
			var p = Q.block(ppath);
			var pinfo = p ? b.parents.findKey("id", p.id).value : {};

			this._pathModel[bpath] = E.merge({}, E.merge(b, pinfo), {
				path:bpath,
				level: depth,
				is_link: (pinfo && pinfo.linked_parent_id !== null),
				level_sort: (p ? (p.levelPath + "." + pos) : "L1"),
				can_move_left: (b.is_owner && (pos> 0)),
				can_move_right: (b.is_owner && p && (pos < p.children.length-1) && p.children.length > 1),
				can_delete: (b.is_owner && !b.closed),
				progress_status_class: (b.closed ? "closed" : (b.ownership_state == "new" ? "private" : b.progress_color)),
				parent_title: (p ? p.title : ""),
				schema:schema,
				children:(b.children || [])
			});
			b = this._pathModel[bpath];

			//recurse each child and add their path to the model
			E.each(b.children, function(cb, i) {
				recurse(cb, bpath, depth+1, i, schema);
			});	

			//map the children ids to child paths
			b.children = E.map(b.children, function(c) {
				return Q.block(c);
			});

			if(!b.is_link) {
				this._idModel[b.id] = b;
			}


		},
		_resetArrayCache:function() {
			this._super();
			
			//
			this._pathArray = this._modelArray;

			//
			this._idArray = this._modelArray = E.values(this._idModel);

			this._pathArray.sort(E.sortFactory("level_sort", E.sortString));

			//E.debug(this.name, this._modelArray.length);
		}
	});
	
	return Model;		
});


