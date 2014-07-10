/* globals define, $, d3, SB_PATH */

define([
	'sb_light/utils/Class', 
	"sb_light/main",
	//no args
	"bootstrap.switch",
	"d3"
], function( Class, sb ) {
	
	'use strict';

	var E, ST, M;
	var DOM_REGISTER = {};


	var Dom = Class.extend({

		__opts:null,
		__id:null,
		__binds:null,
		__children:null,
		__watchers:null,
		__models:null,
		__data:null,
		__parsers:null,
		__root:null,
		__created:false,
		__delay:50,
		__canDrawDelay:-1,
		__beforeDrawList:null,

		//do not override
		init:function(opts) {
			this.sb = sb;
			E = sb.ext;
			ST = sb.state;
			M = sb.models;

			var o = this.__opts = this.initOpts(opts);

			this.__root = o.appendTo || o.root || "body";

						//set inside the options take priority
			this.__id = o.id || 
						//next use a different property in the options
						(o.idKey && o[o.idKey]) || 
						//next try the DOM element itself
						$(this.__root).attr("id") || 
						//next just make one up							
						("dom_widget_" + E.unique())
			;

			if(!DOM_REGISTER[this.__id]) {
				DOM_REGISTER[this.__id] = this;
				$(this.__root).attr("id", this.__id);
			} else {
				throw new Error("DOM Widget with the same id already exists", this.__id);
			}


			//children dom widgets that were parsed
			this.__children = [];

			//children dom widgets that were parsed
			this.__binds = {};

			//parsers for data-* properties on the loaded HTML
			this.__parsers = {};

			//used to watch for sb.state properties easily
			this.__watchers = {
				"state":{},
				"context":{},
				"data":{}
			};

			//used to watch  sb.models 
			this.__models = {};

			this.__data = {};

			this.__beforeDrawList = [];

			Object.defineProperties(this, {
				//jQuery 
				"$": 		{get: function() { 	return $(this.__root); 			}},
				//DOM
				"dom": 		{get: function() { 	return this.$.get(0); 			}},
				//D3 selection
				"sel": 		{get: function() { 	return d3.select(this.dom); 	}},
				"id": 		{get: function() { 	return this.__id; 	}}
			});

			if(this.__opts.templatePath) {
				this.addBeforeDraw(this.loadTemplate.bind(this));
				this.addBeforeDraw(this.parseChildren.bind(this));
				this.addBeforeDraw(this.postCreate.bind(this));
				this.create();
			} else {
				this.create();
				this.postCreate.bindDelay(this, this.__delay);
			}
		},

		//override this for startup stuff
		//this._super() should be called last generally
		create: function() {
			this.addParser("require", this.createChildren.bind(this));

			this.__created = true;

			this.dirty();

			//console.log("create", this.id);
		},

		domById: function(id) {
			return DOM_REGISTER[id] || null;
		}, 


		//This function is called after creation when "canDraw" is true, but postCreate hasn't been called yet.
		//it generally signals the loading of the html templates
		postCreate:function() {
			// console.log("postCreate", this.id);
			//create the html and do other stuff as defined by subclasses
			this.parseChildren();

			//override for one-off post-creation stuff
			this.$.find("input[type='checkbox']").bootstrapSwitch();
			this.dirty.bindDelay(this, this.__delay);
		},

		destroy: function() {
			if(DOM_REGISTER[this.__id]) {
				delete DOM_REGISTER[this.__id];
			}

			var w = this.__watchers;
			var state = sb.state;
			var ms = sb.models;
			var m = this.__models;

			//NEEDS DOING or events go wonky. 
			sb.queue.cancel("_buffer" + this.id);

			//unsubscribe from states
			E.each(w, function(type) {
				var list = w[type];
				E.each(list,function(v,k) {
					state.unwatch(type, w[type], v);
				});
			});

			//unsubscribe from models
			E.each(m, function(ref,k) {
				ms.unsubscribe(k, ref);
			});

			//empty the child dom
			this.$.html("");

			//unset all __* variables. 
			E.each(this, function(v,k) {
				if(k.match(/^__/)) {
					this[k] = null;
				}
			})
		},


		addBeforeDraw: function(f) {
			this.__beforeDrawList.push(f);
		},

		//which models this widget subscribes to
		models: function(/*string list...*/) {
			var args = E.slice(arguments, 0);
			var m = sb.models;
			var ms = this.__models;
			var df = this.bind("dirty");
			args.forEach(function(v,i) {
				ms[v] = m.subscribe(v, df);
			});
		},

		//watch a list of state properties
		watch: function(funcName, type /*, string list*/) {
			var self = this;
			var args = E.slice(arguments, 2);
			var s = sb.state;
			var ss = this.__watchers[type];
			var df = this.bind(funcName);
			args.forEach(function(v) {
				if(ss[v]) { 
					sb.ext.warn("DOM::Watch:You are already watching this " +  v + " " +  type + " " + self.id);
					return;
				}
				ss[v] = s.watch(type, v, df);
			});
		},

		//id(String), data (Array|Object, optional), isDataObject(Bool, optional)
		//case: (id): return the data part of the data object for the id.
		//case: (id, true) return the full data object 
		//case: (id, data) set the data part of the object, return "this"
		data: function(id, opt) {
			var full = E.isBool(opt) ? opt : false; 
			var d = (!E.isBool(opt) && opt) || null;
			if(d) {
				this.__data[id].data  = d;
				return this;
			}
			return full ? this.__data[id] : this.__data[id].data;
		},

		//specify options/ urls/ etc.., for the data required to draw
		requireData:function(opts) {
			if(!opts.id ) {
				throw new Error("DOM::RequireData is missing an id.", this.id, "Root: ", this.root, opts.url); 
			} else if (this.__data[opts.id]) {
				throw new Error("DOM::RequireData has already defined that data item.", this.id, "Root: ", this.root, opts.id); 
			}

			opts =E.merge({
				state:sb.state.authorized,
				data:null,
				busy:false,
				collect:E.fidentity({}), //function for fetching, default just returns an empty object
			}, opts);
			this.__data[opts.id] = opts;
		},


		modelsValid: function() {
			var ms = sb.models;
			var valid= true;
			E.each(this.__models, function(v,k) {
				var m = ms.get(k);
				//"m.get" will force a fetch if it's not valid. 
				valid = valid && m && m.get() !== null;
			});
			return valid;
		},

		//create a context-bound function for handling events.
		//warning: this is purely convenience and won't be appropriate when you need to bind extra arguments
		bind: function(name) {
			if(!this.__binds[name]) {
				if(!this[name]) {
					throw new Error("SB_Light Widget (" + name + ") is not a function of : " + this.id);
				}
				this.__binds[name] = this[name].bind(this);
			}
			return this.__binds[name];
		},


		//done first after init. This allows the caller and subclass to override / add properties
		initOpts: function(opts) {
			var opts = E.merge({}, opts);
			return opts;
		},

		loadTemplate: function() {
			var self = this; 

			// console.log("DOM:LoadingTemplate", this.id, this.__opts.templatePath);

			var path = [SB_OPTIONS.path, "/templates/", this.__opts.templatePath, ".html"].join("");
			this.$.load(path, function() {
				// console.log("DOM:Parsing done", this.id);
				self.dirty.bindDelay(self, self.__delay);
			});
		},

		addParser: function(k,func) {
			this.__parsers[k] = func;
		},

		parseChildren: function(node) {
//			console.log("DOM:parseChildren", this.id);
			//parse the resulting HTML for data-template elements.
			var cel = node || this.$;

			E.each(this.__parsers, function(func,k) {
				cel.find("[data-"+k+"]").each(function() {
					var el = $(this);
					func($(this), el.data());
				});
			});
			sb.queue.buffer(this.dirty.bind(this), "_buffer" + this.id, this.__delay, true);
		},

		createChildren:function(el, opts) {
			var self = this; 
			var c = this.__children;
			opts = E.merge(opts, {root:el});

			var src = opts.require; 
			el.data("require", null);
			el.removeAttr("data-require");
			delete opts.require;

			if(src) {
//				console.log("DOM:CREATECHILDREN: Trying to load: ", this.id, src);
				require([src], function(El) {
					//no guarantee of order this happens
					if(El) {
//						console.log("DOM Create children: ", self.id);
						c.push(new El(opts));
					} else {
//						console.log("Cannot load SRC:", self.id, src);
					}
					sb.queue.buffer(self.dirty.bind(self), "_buffer" + self.id, self.__delay, true);
				});
			} else {
				sb.queue.buffer(this.dirty.bind(this), "_buffer" + this.id, this.__delay, true);
			}
		},

		dirty: function(delay) {
			delay = E.first(delay , this.__delay);
			//reset the delay
			this.__canDrawDelay = this.__canDrawDelay >= 0 ? E.max(50, delay) : -1;

			//queue drawing so we don't end up calling it repeatedly from different events
			sb.queue.buffer(this.__beforeDraw.bind(this), "_buffer" + this.id, delay, true);

//			console.log("DOM WIDGET dirtying: ", this.id)
		},

		fetchData: function() {
			// console.log("Fetch Data: ", this.id);
			var ctrl = this.sb.controller;
			var self = this;
			E.each(this.__data, function(d) {
				if(d && !d.busy && d.data === null) {
					d.busy = true;
					d.args = d.collect();
					var f = self.handleData.bind(self, d.id);
					ctrl.admin(d.url, d.args, f, f, d.state);				
				}
			});
		},

		clearData:function(id) {
			// console.log("Clear data: ", this.id, id);
			id = this.__data[id] ? id : null;
			if(id && this.__data[id]) {
				this.__data[id].data = null;
			} else if(!id) {
				E.each(this.__data, function(d) {
					d.data = null;
				});
			}
			this.dirty();
		},

		handleData: function(id, resp) {
			this.__data[id].busy = false;
			this.__data[id].data = resp ? (resp.result || resp ) : null;
			this.dirty();
		},

		needsData: function() {
			return E.reduce(this.__data, function(prev, curr) {
				return prev || curr.data === null
			},false);
		},

		canDraw:function() {
//			console.log("DOM:CanDraw", this.id, this.__created, !this.__busy, this.modelsValid(), !this.needsData(), this.__beforeDrawList.length);			
			return this.__created && !this.__busy && this.modelsValid() && !this.needsData();
		},

		//sanity before drawing
		__beforeDraw:function() {
			if(this.canDraw()) {
				if(this.__beforeDrawList.length) {
					this.__beforeDrawList.shift()();
				} else {
					this.draw();
				}
			} else if (this.needsData()) {
				this.fetchData();
			} else if(this.__busy) {
				this.drawBusy();
			} else {
				//if the delay is -1, we don't keep calling "dirty"
				if(this.__canDrawDelay >= 0) {
//					console.log("Queueing " + this.id);
					this.__canDrawDelay = E.max(5000/*5 seconds*/,this.__canDrawDelay);
					sb.queue.buffer(this.__beforeDraw.bind(this), "_buffer" + this.id, this.__delay, true);		
				}
			}
		},

		draw: function() {

		},

		drawBusy: function() {

		}

	});

	return Dom;

});