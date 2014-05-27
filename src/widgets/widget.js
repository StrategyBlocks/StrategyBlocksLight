/* globals define, $, d3 */

define([
	'sb_light/utils/Class', 
	//no args
	"d3"
], function( Class ) {
	
	'use strict';

	//local private statics
	var dims = {"b":"bottom", "l":"left", "r":"right", "t":"top", "h":"height","w":"width", "f":"fringe"};
	var dimReg = /left|right|top|bottom|height|width|fringe/;

	var E;

	var Widget = Class.extend({
		//called by "new Widget()"
		_sb:null,
		_dom:null,
		_def:null,
		_domFuncs:null,
		_sizeFuncs:null,
		_sizeDefs:null,
		_classList:null,
		_parent: null,
		_name:null,
		_binds:null,
		_props:null,
		_animate:0,
		_created:false,
		_visible:false,
		_ignoreLayout:false,
		_listeners:null,
		_watching:null,
		_layout: null,
		_rootElement:null,
		_childrenLayout:null,
		_defaultLayout:null,
		_delay:50,
		__drawing:false,

		//do not override
		init:function(sb, parent, def) {
			this._sb = sb;
			E = this._sb.ext;

			this._rootElement = this._rootElement || "div";
			this._props = this._buildPropsList();

			//storage place for bound functions. Storing bound functions here allows us to unsubscribe
			//from DOM event handlers, since the "bind" method returns a different function each time. 
			this._binds = {};

			this._sizeFuncs = {};
			this._sizeDefs = {};
			this._parent = parent;
			this._def = def;
			this._classList = {};
			this._listeners = {};
			this._watchers = {
				"state":{},
				"context":{},
				"data":{}
			};
			this._models = {};

			this._domFuncs = this._propertyOverrides();


			Object.defineProperties(this, {
				"created": 		{get: function() { return this._created; }},
				"widget": 		{get: function() { return true; }},
				"isDrawing": 	{get: function() { return this.__drawing; }},
				"dom": 			{get: function() { return this._dom; }},
				"d3dom": 		{get: function() { return d3.select(this._dom); }},
				"id": 			{get: function() { return (this._def && this._def.id) || (this._dom && this._dom.id);  	}},
				"name": 		{get: function() { return this._name || (this._def && this._def.widget); }},
				"parent": 		{get: function() { return this._parent || null;  }},
				"parentId": 	{get: function() { return this._parent ? this._parent.id : null;  }},
				"parentDom": 	{get: function() { return this._parent && this._parent.widget ? this.parent.dom  : (this.parent || null);  }},
				"parentWidget": {get: function() { return (this._parent && this._parent.widget && this.parent) || null; }},
				"parentLayout": {get: function() { return this.parentWidget ? this.parentWidget.layout :null; }},

				"widgets": 		{get: function() { return (this.layout && this.layout.widgets) || null; }},
				//same as widgets, but doesn't failover into a parent layout
				"children": 	{get: function() { return (this._layout && this._layout.widgets) || null; }},
				"layout": 		{get: function() { return this._layout || this.parentLayout || null; }},
				"visible": 		{	
									get: function() {   return 	this._visible;		},
								 	set: function(x) { 
								 		//normalize to force boolean otherwise .toggle gets odd
								 		x = x ? true : false;
								 		if(this._visible != x) {
								 			this._visible = x; this.invalidate(); 
								 			$(this.dom)[x ?"show":"hide"]();
								 		} 
								 	}		
								},

			});


			try {
				this.create();
				this.postCreate();
			}catch(e) {
				console.log( "Failed to create widget " + def.id + " " + JSON.stringify(e.message? (e.message + "\n" + e.source) : e)); 
				throw new Error("Failed to create widget " + def.id + " " + JSON.stringify(e.message? (e.message + "\n" + e.source) : e)); 
			}
			


		},



		cid:function(name, hash) {
			return (hash ? "#":"") + [this.id, name].join("_");
		},


		cidDim:function(name, dim, amt) {
			var _base = ["@",this.cid(name)];

			var _dim = String(dims[dim] || dim || "");
			_dim = _dim.match(dimReg) ? _dim : null;

			var _amt = arguments.length == 2 && !_dim ? dim : (amt||0);
			
			if(_dim) {
				_base.put("#", _dim);
			}
			_base.put("#", _amt);
			return _base.join("");
		},
		child: function(id) {
			return this.widgets ? (this.widgets[id] || this.widgets[this.cid(id)]) : null;
		},
		childDom: function(id) {
			var c = this.child(id);
			return c ? c.dom : null;
		},
		childD3: function(id) {
			return d3.select(this.childDom(id));
		},


		create:function() {
			this._name = this._name || ("widget::" + this._rootElement);
			this._dom = this.createDom(this._def);
			this.className("sb_light_widget");
			this.createLayout();
			this.parentDom.appendChild(this._dom);
			this._created = true;

			$(this.dom).on("resize change", this.bind("dirty"));
			//E.debug("created", this._name);
		},



		destroy: function() {
			if(!this._created) { return; }
			this._created = false; 
			//NEEDS DOING or events go wonky. 
			this._sb.queue.cancel("_buffer" + this.id);

			var each = E.each;
			//use the local layout so we don't destroy a parent's layout
			if(this._layout) {
				each(this.children, function(v,k) {
					if(v.created) {
						v.destroy();
					}
				});
			}
			var dom = this.dom; 
			each(this._listeners, function(v,k) {
				v.forEach(function(cb) {
					dom.removeEventListener(k, cb);
				});
			});
			this._sb.dom.empty(this.dom);


			var w = this._watchers;
			var state = this._sb.state;

			each(w, function(type) {
				var list = w[type];
				each(list, function(v,k) {
					state.unwatch(type, w[type], v);
				});
			});

			var ms = this._sb.models;
			each(this._models, function(ref,k) {
				ms.unsubscribe(k, ref);
			});

			//null all private properties that begin with "_"
			for(var k in this) {
				if(k.charAt(0) == "_") {
					this[k] = null;
				}
			}
		},

		bind: function(name) {
			if(!this._binds[name]) {
				if(!this[name]) {
					throw new Error("SB_Light Widget (" + name + ") is not a function of : " + this.id);
				}
				this._binds[name] = this[name].bind(this);
			}
			return this._binds[name];
		},


		listen: function(type, cb) {
			this._listeners[type] = this._listeners[type] || [];
			this._listeners[type].push(cb);
			this.dom.addEventListener(type, cb);
		},


		//which models this widget subscribes to
		models: function(/*string list...*/) {
			var args = E.slice(arguments, 0);
			var m = this._sb.models;
			var ms = this._models;
			var df = this.bind("dirty");
			args.forEach(function(v,i) {
				ms[v] = m.subscribe(v, df);
			});
		},

		//watch a list of state properties
		watch: function(funcName, type /*, string list*/) {
			var args = E.slice(arguments, 1);
			var s = this._sb.state;
			var ss = this._watchers[type];
			var df = this.bind(funcName);
			args.forEach(function(v,i) {
				ss[v] = s.watch(type, v, df);
			});

		},


		modelsValid: function() {
			var ms = this._sb.models;
			var valid= true;
			E.each(this._models, function(v,k) {
				var m = ms.get(k);
				//"m.get" will force a fetch if it's not valid. 
				valid = valid && m && m.get() !== null;
			});
			return valid;
		},

		_buildPropsList: function() {
			var a = [];
			for(var i in this) { a.push(i); }
			return a.join(",");
		},

		//hasOwnProperty doesn't follow the prototype chain properly. This fixes it.
		has: function(name) {
			var re = new RegExp("(^|,)_?"+name+"(,|$)");
			return this._props.match(re);
		},

		//this is the best function to override when setting the default layout;
		createLayout:function() {
			var layout = this.childrenLayout();
			if(layout && layout.length) {
				this._layout = this._sb.layout.parse(this, layout);
			} 
		},

		postCreate:function() {
			this.applyProperties();

		},


		addChild: function(id, w) {
			var ws = this.children;
			if(ws && !ws[id]) {
				ws[id] = w;
				this.invalidate();
			}
		},
		removeChild:function(id) {
			var ws = this.children;
			if(ws[id]) {
				var w = ws[id];
				if(this.dom) {
					this.dom.removeChild(w.dom);
				}
				delete ws[id];
				w.destroy();
				this.invalidate();
			}
		},

		replaceClass: function(match, replacement) {
			delete this._classList[match];
			if(replacement) {
				this.className(replacement);
			}
			return this;
		},


		_noop: function() {},
		_propertyOverrides: function() {
			return {
				"default": this.bind("attr"),
				"css": this.bind("cssText"),
				"style": this.bind("cssText"),
				"widget": this._noop,
				"animate": this.bind("prop"),
				"visible": this.bind("prop"),
				"ignoreLayout": this.bind("prop"),
				"widget-name": this.bind("dataProperty"),
				//"class":this.deprecated.bind(this, 'Please use "klass" instead.'),
				"klass":this.bind("className"), //class is reserved
//				"fer": this.bind("attr"), //alias for "for" on labels, as it's a reserved word. 
				"children":this.bind("childrenLayout"),
				"domNode":this._noop,
				"text": this.bind("text"),
				"html": this.bind("html"),
				"left": this._noop,
				"right": this._noop,
				"top": this._noop,
				"bottom": this._noop,
				"x": this._noop,
				"y": this._noop,
				"height": this._noop,
				"width": this._noop,
				"fringe": this._noop,
			};
		},

		appendChild: function(c) {
			if(this._dom && c) {
				this._dom.appendChild(c);
			}
		},
		createDom:function(opts) {
			opts.widget = E.isStr(opts.widget) ? opts.widget : this._rootElement;
			if(!opts.widget) { throw new Error("The \'widget\' option must be specified, and be the name of a valid HTML element."); }
			return opts.domNode || document.createElement(opts.widget);
		},

		childrenLayout: function(/*name,*/ layout) {
			//childrenLayout: layout defined by a 3rd party who likely creates this widget
			//defaultLayout: layout this widget defines for itself. Normally this is set in the inherited
			//					createLayout function, and then the super function is called. 
			var args = E.slice(arguments, arguments.length > 1 ? 1 : 0);
			if(args.length) {
				this._childrenLayout = layout;
				return this; 
			} else {
				return (this._defaultLayout || []).concat(this._childrenLayout || []);
			}
		},


		applyProperties: function() {
			this._def["widget-name"]  = this.name;

			for(var k in this._def) {
				var f = this._domFuncs[k] || this._domFuncs["default"];
				f(k, this._def[k]);
			}
		},


		//widget property, not dom attribute
		prop:function(name,value) {
			//convert the name to "_name" if necessary
			var innerName;

			innerName = this.has("_"+name) ? ("_"+name) : name;
			if(!this.has(innerName)) {
				throw new Error("SB_Light Widget (" + name + ") is not a property of : " + this._name);
			}
			if(arguments.length > 1) {
				this[innerName] = value;
				this.dirty();
				return this;
			}
			return this[innerName];
		},

		source: function(name, value) {
			if(arguments.length > 1) {
				this._def[name] = value;
				return this;
			}
			return this._def[name] === undefined ? null : this._def[name];
		},


		deprecated: function(name,value) {
			var msg = 'Deprecation Warning: "' + name + '": ' + value; 
			if(this._sb.debug) {
				throw msg;
			} else {
				E.warn(msg);
			}
		},
		//optional "class" string based on who calls it. does nothing,gets ignored. 
		//name is the class name to apply. separate multiple with spaces as usual
		//remove is a boolean, which removes the class if true. 
		className: function(/*class(?), name, remove*/) {
			var args = E.slice(arguments, arguments[0]=="klass" ? 1 : 0);
			var dom = this.dom;
			var self = this;
			if(args.length) {
				var names = args[0];
				var remove = args[1]  || false;
				names.split(" ").forEach(function(n) {
					if(remove) {
						delete self._classList[n];
					} else {
						self._classList[n] = true;
					}
				});
				dom.className = E.keys(this._classList).join(" ");
				return this;
			}
			return dom.className;
		},


		_attrMap: {
			"fer":"for"   //"for" is a reserved word
		},
		attr: function(name, value /*==null*/) {
			name = (name && this._attrMap[name])  || name;
			if(arguments.length > 1) {
				this._dom.setAttribute(name, value);
				return this;
			}
			return this._dom.getAttribute(name);
		},


		dataProperty: function(name, value /*==null*/) {
			this.attr.call(this, "data-"+name, value);
		},

		cssText: function() {
			var args = E.slice(arguments, arguments.length > 1 ? 1 : 0);
			if(args.length) {
				this._dom.style.cssText = args[0];
				return this;
			}
			return this._dom.style.cssText;
		},

		text: function() {
			var args = E.slice(arguments, arguments.length > 1 ? 1 : 0);
			if(args.length ) {
				this._dom.textContent = args[0];
				return this;
			}
			return this._dom.textContent;
		},

		html: function() {
			var args = E.slice(arguments, arguments.length > 1 ? 1 : 0);
			if(args.length ) {
				this._dom.innerHTML = args[0];
				return this;
			}
			return this._dom.innerHTML;
		},

		sizeDefs:function(name, value) {
			if(arguments.length > 1) {
				this._sizeDefs[name] = value;
				return this;
			}

			return this._sizeDefs[name];
		},

		sizeFuncs:function(name, value) {
			if(arguments.length > 1) {
				this._sizeFuncs[name] = value;
				return this;
			}
			return this._sizeFuncs[name];
		},


		invalidate: function() {
			if(this && this._sb) {
				//this._beforeDraw.bindDelay(this,this._delay);
				this._sb.queue.buffer(this.bind("_beforeApplyLayout"), "_buffer" + this.id, this._delay, true);
			}
		},

		dirty: function() {
			if(this && this._sb) {
				//this._beforeDraw.bindDelay(this,this._delay);
				this._sb.queue.buffer(this.bind("_beforeDraw"), "_buffer" + this.id, this._delay, true);
			}
		},

		canDraw: function() {
			return this.created && this.visible && this.modelsValid();
		},

		_beforeApplyLayout: function() {
			if(this.canDraw()) { 		
				this.showChildren();
				this.applyLayout();
				this._afterApplyLayout();
			} else {
				this.showChildren();
				this.cleanup();
			}
		},

		_afterApplyLayout: function() {
			//var children = this.children || {};
			// E.each(children, function(v,k) {
			// 	v.invalidate();
			// });

			this.dirty();
		},


		showChildren:function() {
			var cd  = this.canDraw();
			var children = this.children || {};
			if(!this._sb) {
				console.log("wtf");
			}
			E.each(children, function(v,k) {
				v.visible = cd;
			});

		},

		applyLayout: function() {
			//E.debug("Applying layout:", this.id, this.name);
			if(this._ignoreLayout) { 
				this.className("sb_light_widget", true);
				return; 
			} 
			this.className("sb_light_widget");
			var d = this.dom;
			var dim = this.bind("dim");
			var px = E.px;
			var sz = this.bind("sizeFuncs");

			// if(this._animate > 0) {
			// 	$(d).animate({
			// 		"left": sz("left")(),
			// 		"top": sz("top")(),
			// 		"width": sz("width")(),
			// 		"height": sz("height")()
			// 	}, this._animate, this.bind("invalidate"));
			// } else {
				["left","top","width","height"].forEach(function(s) {
					var sf = sz(s);
					if(sf) {
						var amt = sf();
						if( (s != "width" && s != "height") || amt != 0) {
							dim(s, amt );
						}
					} 
				});
			// }
		},


		_beforeDraw: function() {
			if(this.canDraw()) {
				d3.select(this.dom).style("visibility", "visible");
				d3.select(this.dom).style("display", null);
				//do this to the local layout, not the parent one
				//E.debug("Drawing:", this.id, this.name);
				if(this._layout && !this._ignoreLayout) {
					var rect = this._dom.getBoundingClientRect();
					this._layout.rootWidth = rect.width;
					this._layout.rootHeight = rect.height;
					//apply child layout. 
					this._sb.layout.resize(this._layout);
				}
				//convenience helper. all widgets can check whether they are in the process of a draw or not. 
				this.__drawing = true;
				this.draw();
				this.__drawing = false;

				this._afterDraw();
			} else {
				d3.select(this.dom).style("visibility", "hidden");
				d3.select(this.dom).style("display", "none");
			}
		},

		_afterDraw: function() {
		},

		draw: function() {
			
		},

		cleanup: function() {

		},


		dim: function(name, value) {
			var ext = E;
			if(arguments.length > 1) {
				this.dom.style[name] = ext.isStr(value) ? value : ext.px(value);
				return this;
			}
			return E.to_i(this.dom.style[name]);
		},

		rect: function() {
			return {
				x:this.dim("left"),
				y:this.dim("top"),
				width: this.dim("width"),
				height:this.dim("height")
			};
		},




	});

	return Widget;

});