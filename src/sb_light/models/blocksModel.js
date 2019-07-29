
/*globals define */

define(['sb_light/models/_abstractModel','sb_light/globals','sb_light/api/urls','fuse'], function( _Model, sb, urls, Fuse ) {
	'use strict';

	var E, Q, D;


	var QUEUES = {
		progress: urls.BLOCKS_PROGRESS,
		health: urls.BLOCKS_HEALTH,
		extra_info: urls.BLOCKS_EXTRA_INFO
	};

	var Model = _Model.extend({

		//default response for models returns the id model
		//but you can ask for the pathmodel by calling (rawArray("path"))
		//path model has keys based on the block path
		_idModel:null,
		_idArray:null,
		_pathModel:null,
		_pathArray:null,


		_queues: null,
		
		_properties: null,
		_propertiesList: ["comments","news","tags","documents", "relationship_info", "watching_users"],
	
		init: function() {

			this._properties = {};

			E = sb.ext;
			Q = sb.queries;
			D = sb.dates;


			var q = this._queues = {};
			E.each(QUEUES, function(v,k) {
				q[k] = sb.controller.idBufferQueueFactory(v, null, "block_ids", 100);
			});
			
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
			switch (type) {
				case "id": return this._super(); 
				case "path": /* falls through */ 
				default:
					return this._pathArray; 
			}
		},
		raw: function(type) {
			switch (type) {
				case "id": return this._super(); 
				case "path": /* falls through */ 
				default:
					return this._pathModel; 
			}
		},




		find: function(id) {
			if(E.isStr(id) && id.match("_")) {
				return this._pathModel ? this._pathModel[id] : null;
			} else {
				return this._super(id);
			}
		},

		//initialize the filters with a status so that closed blocks are filtered by default. 
		filtersInit: function() {
			var f = this._super();
			f.status = f.status || [];
			return f;
		},

		filteredList: function(type) {
			return /*type != "path" ? this._super() : */this.filteredTree(); 
		},


		filteredTree: function() {
			var filters = this.filtersInit();
			var ff = this.filterItem.bind(this, filters);
			var list = E._.filter(this._pathArray, ff); 
			var self = this;

			//add information about placeholder nodes
			var rb = E._.find(this._model, {is_root:true});
			var b = Q.block();
			if(!b) { return; }
			var recurse = function(parent) {
				//errors
				if (!parent) { return; }

				var childPassed = (!parent.children && !parent.children.length) || E.reduce(parent.children, function(prev, c) {
					var cb = self.find(c);
					recurse(cb);
					return prev || cb.FILTER_SHOW || cb.FILTER_PLACEHOLDER;
				}, false);

				parent.FILTER_PLACEHOLDER = !parent.FILTER_SHOW && (childPassed || b.path == parent.path);
				parent.FILTER_HIDDEN = !parent.FILTER_PLACEHOLDER && !parent.FILTER_SHOW;
			};
			recurse(rb);

			return list;	
		},

		//*******************FILTER FUNCTION OVERRIDES************************************
		filter_distance: function(b, maxDistance) {
			var dist = Q.blockDistance(b);

			// console.log("DISTANCE", b.title, dist);
			return dist <= maxDistance;			
		},
		filter_level: function(b, level) {
			var min = level[0]-1;
			var max = level[1]-1;

			// console.log("DISTANCE", b.title, dist);
			return b.level >= min && b.level <= max;
		},

		filter_search: function(b, searchString) {
			if(!searchString) {
				return true;
			}

			var fuse = new Fuse([b], {
				keys: ["title", "body"], 
				id:"id", 
				include:["score"],
				threshold:0.3}
			);
			var res = fuse.search(searchString); 
			return res && res.length ? true : false;
		},
		filter_tags: function(b, tagsFilter) {
			if(!tagsFilter) { return true; }
			if (E.isArray(tagsFilter)) {
				tagsFilter = {list: tagsFilter, include_desc: false};
			}
			if(!tagsFilter.list || !tagsFilter.list.length) { return true; }


			var list = tagsFilter.list;
			var desc = tagsFilter.include_desc;
			var tags = E._.filter(sb.models.raw("tags"), function(t) {
				var reg = new RegExp("(" + t.blocks.join("|") + ")");
				return list.indexOf(t.id) >= 0 && reg.test(desc ? b.path : b.id);
			});
			return tags.length > 0;
		},


		filter_status: function(b, statusList) {
			if(statusList.indexOf(b.status) > -1) { return true; }
			if(b.is_overdue && statusList.indexOf("overdue") > -1) { return true; }

			return statusList.length === 0; 
		},
		//********************************************************************************




		_handleUpdate: function(update) {
			var ts = this._timestamp;

			this._super(update);

			if(ts != this._timestamp) {
				this._properties = {};
				// clear queues on next tick
				var q = this._queues;
				setTimeout(function(){
					E.each(q, function(v, k) {
						q[k].clear();
					});
				}, 0);
			}

		}, 
		
		//usually override by the model subclasses to provide some post-processing on the model elements before consumption 
		//by a view
		_massageUpdatedModel: function() {
			this._super();
			var root = E._.find(this._model, function(v) {
				return !v.parents || v.parents.length === 0;
			});
			this._massage(root, null, 0, 0, E.time());

			if(!Q.block()) {
				if(!root) { return; }
				sb.state.state("block", root.id);
			}
		},

		progress: function(cb, bids) {
			this._queues.progress.add(cb, bids);
		},

		health: function(cb, bids) {
			this._queues.health.add(cb, bids);
		},
		extra_info: function(cb, bids) {
			this._queues.extra_info.add(cb, bids);
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
		relationship_info: function(id, cb, force) {		
			this._property(cb, "relationship_info", id, force);		
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
		
		//process the properties
		_handleProperty: function(type, id, data) {
			this._properties[type] = this._properties[type] || {};
			this._properties[type][id] = data ? data.result : this._properties[type][id];
			
			var q = this._properties[type+"_queue"];
			while(q && q[id] && q[id].length) {
				var cb = q[id].pop();
				cb(this._properties[type][id]);
			}
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

			if (!b) {
				//Not sure why we're here...
				return null;
			}

			var bpath = p ? [p.path, b.id].join("_") : b.id;
			var pinfo = p ? E._.find(b.parents, {parent_id:p.id}) : null;

			var u = Q.user();
			var uid = (u && u.id) || null;

			var hs = ["bad", "warning", "good"];
			var isNew = b.ownership_state == "new";

			var cLenLen = ((p ? p.children.length : 1)+"").length;
			var levelPos = E._.padStart( (""+(1+pos)), cLenLen, "0"); 
			var overdueDays =  !b.closed && E.first(E.max(0, D.range(b.end_date, "today")), 0);


			b = pm[bpath] = E.merge(E.merge(b, pinfo), {
				title_lower: E.lower(b.title),
				body: (b.body || ""),
				path:bpath,
				parentPath:(p ? p.path : null),
				parent:p,
				level: depth,
				level_sort: (p ? (p.level_sort + "." + levelPos) : "1"),

				size:1,
				status: (isNew ? "new" : (
							b.closed? "closed" : (
								b.progress_color == "red" ? "bad" : (b.progress_color == "yellow" ? "warning" : "good")
							)
						)),
				health_type: (!isNew ? (hs[E.first(b.status_health,0) + 1]) : "none"),
				percent_health: (b.percent_health || 0),
				count_metrics: (b.count_metrics || 0),
				count_risks: (b.count_risks || 0),
				overdue: overdueDays,
				is_root:(depth===0),
				is_closed: !!b.closed,
				is_branch_manager: (pinfo ? pinfo.is_branch_manager : b.is_manager),
				is_link: (p && (p.is_link || (pinfo && pinfo.fake))) || false,
				is_real_link: (p && pinfo && pinfo.fake) || false,
				is_company: (b.sub_company_block ? true: false),
				is_open: ((isNew || b.closed) ? false : true),
				is_overdue: (overdueDays > 0),
				is_real_owner: (b.owner_id==uid),
				is_real_manager: (b.manager_id == uid),
				is_new: isNew,
				position: pos,
				can_move_left: (b.is_manager && (pos> 0)),
				can_move_right: (b.is_manager && p && (pos < p.children.length-1) && p.children.length > 1),
				can_delete: (b.is_owner && !b.closed),
				parent_title: (p ? p.title : ""),
				schema:schema,
				variance_progress: E.variance(b.percent_progress, b.expected_progress),
				groups_inherited: sb.groups.parseExpression(b.group_expression_inherited, true),
				groups: b.group_ids.concat(sb.groups.parseExpression(b.group_expression_inherited, true)),
				ownership: 	(b.owner_id == uid ? "owned" : 
							(b.manager_id == uid ? "managed" : 
							(b.ownership_state == "watched" ? "watched" : "none") ) ),

				dependencies: (b.dependencies || []),
				watching_user_ids: (b.watching_user_ids || [])
			});

			E._.each(b.metrics, function(v) {
				v.status = v.status.toLowerCase();
				v.trend = v.trend.toLowerCase();
			});



			//add new keys for each textarea item and add "<br/>" for each line break.
			E.each(["body"], function(key) {
				b[key+"_html"] =  b[key] ? b[key].replace(/(?:\r\n|\r|\n)/g, '<br />') : "<em>No Description</em>";  
			});

			var blockType = b.is_link ? "blockTypeLink " : (b.is_company ? "blockTypeCompany" : "blockTypeNormal");

			b.level_display = "<span class='" + blockType + "'>" + b.level_sort + "</span>";
			b.last_updated = b.last_progress_updated_date;

			//map children ids to paths
			b.children = b.children ? E.map(b.children, function(cpath, i) {
				return recurse(cpath, b, depth+1, i, schema);
			}) : [];

			b.progressLeaf = b.leaf && b.is_owner && b.status != "new" && !b.closed;

			b.height = 0;
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


