

define(['sb_light/models/_abstractModel'], function( _Model ) {

	var Model = _Model.extend({
		_progress: null,
		_health: null,
		_npv: null,
		_npv_queue:null,
		_progress_queue:null,
		_health_queue:null,
		
		_properties: null,
		_propertiesList: ["comments","news","tags","documents", "context", "watching_users"],
	
		init: function(sb) {
			this._npv_queue = [];
			this._progress_queue = [];
			this._health_queue = [];
			this._properties = {};

			this._dataHandlers = {
				"_health": 	this._massageHealth,
				"_progress": 	this._massageProgress,
				"_npv": 	this._massageNpv
			}
			
			this._super(sb, "blocks", sb.urls.MODEL_BLOCKS);
		},
		
		_handleUpdate: function(update) {
			this._progress = null;
			this._health = null;
			this._npv = null;
			
			this._super(update);
		},
		
		//usually override by the model subclasses to provide some post-processing on the model elements before consumption 
		//by a view
		_massageUpdatedModel: function() {
			this._super();
			var root = this._model[this._sb.state.value("company").root_block.id];
			this._massage(root, null, 0, (new Date()).getTime());
			this._sb.ext.debug("Finished massaging blocks");
		},
		

		//return the raw object map, but use the paths as keys
		rawPaths: function() {
			var bl = this.rawArray() || [];
			var paths = {};
			bl.forEach(function(b) {
				b.paths.forEach(function(bp) {
					paths[bp] = b;
				});
			});
			return paths;
		},
		//return an array of all the paths + blocks from rawPaths
		rawArrayPaths: function() {
			return this._sb.ext.map(this.rawPaths(), function(v,k) {
				return {path:k, block:v};
			});
		},
		
		progress: function(cb) {
			this._data(cb, "_progress", this._sb.urls.BLOCKS_PROGRESS);
		},
		health: function(cb) {
			this._data(cb, "_health", this._sb.urls.BLOCKS_HEALTH);
		},
		npv: function(cb) {
			this._data(cb, "_npv", this._sb.urls.BLOCKS_NPV);
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
					
					this._sb.controller.invoke(this._sb.urls.BLOCKS_PROPERTIES, {id:id, type:type}, this._handleProperty.bind(this, type,id));
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
					this._sb.controller.invoke(url, null, func);
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
			var f = this._sb.ext.massageHealth;
			this._sb.ext.each(d, function(dv,dk) {
				f(dv);
			});

		},
		_massageProgress: function(d) {
			var f = this._sb.ext.massageTA;
			this._sb.ext.each(d, function(dv,dk) {
				f(dv);
			});			
		},
		_massageNpv: function(d) {

		},
		
		_massage: function(b, ppath, depth, schema) {
			var cleanup = b._schema != schema;
			b._schema = cleanup ? schema : b._schema;
			
			b.paths = (!cleanup && b.paths) || [];
			b.children = b.children || [];
			
			var p = ppath ? this._model[ppath.last()] : null;
			if(p) {
				var pel =  b.parents.find("parent_id", p.id).value;
				var dpel = b.parents.find("linked_parent_id", null).value;
				pel.position = p.children.indexOf(b.id);
				pel.level = depth;
				
				b.paths.put(ppath.concat([b.id]));
				if(p.id == dpel.parent_id) {
					b.default_path = b.paths.last();
					b.default_parent = p.id;
					b.default_level = depth;
					b.default_position = pel.position;
				} 
				if(p.is_owner) {
					pel.can_move_left = pel.position > 0;
					pel.can_move_right = pel.position < (p.children.length-1) && p.children.length > 1;
					pel.can_delete = true;
				}
			} else {
				b.default_path = [b.id];
				b.default_parent = null;
				b.paths.put([b.id]);
				b.default_position = 0;
				b.default_level = 0;
			}
			
			var bpath = b.paths.last();
	
			for (var i = 0; i < b.children.length; ++i) {
				this._massage(this._model[b.children[i]], bpath, depth+1, schema);
			}
		},
		_resetArrayCache:function() {
			this._super();
			this._modelArray.sort(this._sb.ext.sortBlocksByProgress);
			//this._sb.ext.debug(this.name, this._modelArray.length);
		}
	});
	
	return Model;		
});


