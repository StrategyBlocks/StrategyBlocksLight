/* globals define, $ */

define(['sb_light/utils/Class'], function( Class ) {
	
	//local private statics
	var dims = {"b":"bottom", "l":"left", "r":"right", "t":"top", "h":"height","w":"width", "f":"fringe"};
	var dimReg = /left|right|top|bottom|height|width|fringe/;

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
		_listeners:null,
		_watching:null,
		_layout: null,
		_rootElement:null,
		_childrenLayout:null,
		_defaultLayout:null,
		_delay:50,

		//do not override
		init:function(sb, parent, def) {
			this._sb = sb;
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
				"dom": 			{get: function() { return this._dom; }},
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
								 			this._visible = x; $(this.dom).toggle(x); this.invalidate(); 
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



		cid:function(name) {
			return [this.id, name].join("_");
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



		create:function() {
			this._name = this._name || ("widget::" + this._rootElement);
			this._dom = this.createDom(this._def);
			this.className("sb_light_widget");
			this.createLayout();
			this.parentDom.appendChild(this._dom);
			this._created = true;
			//this._sb.ext.debug("created", this._name);
		},



		destroy: function() {
			if(!this._created) { return; }
			var each = this._sb.ext.each;
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
			var args = this._sb.ext.slice(arguments, 0);
			var m = this._sb.models;
			var ms = this._models;
			var df = this.bind("dirty");
			args.forEach(function(v,i) {
				ms[v] = m.subscribe(v, df);
			});
		},

		//watch a list of state properties
		watch: function(funcName, type /*, string list*/) {
			var args = this._sb.ext.slice(arguments, 1);
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
			this._sb.ext.each(this._models, function(v,k) {
				valid = valid && ms.raw(k) !== null;
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
				"default": this.bind("property"),
				"css": this.bind("cssText"),
				"style": this.bind("cssText"),
				"widget": this._noop,
				"animate": this.bind("prop"),
				"visible": this.bind("prop"),
				"widget-name": this.bind("dataProperty"),
				"class":this.deprecated.bind(this, 'Please use "klass" instead.'),
				"klass":this.bind("className"), //class is reserved
				"fer": this.bind("property"), //alias for "for" on labels, as it's a reserved word. 
				"children":this.bind("childrenLayout"),
				"domNode":this._noop,
				"text": this.bind("text"),
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
			opts.widget = this._sb.ext.isStr(opts.widget) ? opts.widget : this._rootElement;
			if(!opts.widget) { throw new Error("The \'widget\' option must be specified, and be the name of a valid HTML element."); }
			return opts.domNode || document.createElement(opts.widget);
		},

		childrenLayout: function(/*name,*/ layout) {
			//childrenLayout: layout defined by a 3rd party who likely creates this widget
			//defaultLayout: layout this widget defines for itself. Normally this is set in the inherited
			//					createLayout function, and then the super function is called. 
			var args = this._sb.ext.slice(arguments, arguments.length > 1 ? 1 : 0);
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


		//widget property, not dom property
		prop:function(name,value) {
			//convert the name to "_name" if necessary
			var innerName;

			innerName = this.has("_"+name) ? ("_"+name) : name;
			if(!this.has(innerName)) {
				throw new Error("SB_Light Widget (" + name + ") is not a property of : " + this._name);
			}
			if(arguments.length > 1) {
				this[innerName] = value;
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
				this._sb.ext.warn(msg);
			}
		},
		//optional "class" string based on who calls it. does nothing,gets ignored. 
		//name is the class name to apply
		//remove is a boolean, which removes the class if true. 
		className: function(/*class(?), name, remove*/) {
			var args = this._sb.ext.slice(arguments, arguments[0]=="klass" ? 1 : 0);
			var dom = this.dom;
			if(args.length) {
				var name = args[0];
				var remove = args[1]  || false;
				if(remove) {
					delete this._classList[name];
				} else {
					this._classList[name] = true;
				}
				dom.className = this._sb.ext.keys(this._classList).join(" ");
				return this;
			}
			return dom.className;
		},


		_propertyMap: {
			"fer":"for"
		},
		property: function(name, value /*==null*/) {
			name = (name && this._propertyMap[name])  || name;
			if(arguments.length > 1) {
				this._dom.setAttribute(name, value);
				return this;
			}
			return this._dom.getAttribute(name);
		},


		dataProperty: function(name, value /*==null*/) {
			this.property.call(this, "data-"+name, value);
		},

		cssText: function() {
			var args = this._sb.ext.slice(arguments, arguments.length > 1 ? 1 : 0);
			if(args.length) {
				this._dom.style.cssText = args[0];
				return this;
			}
			return this._dom.style.cssText;
		},

		text: function() {
			var args = this._sb.ext.slice(arguments, arguments.length > 1 ? 1 : 0);
			if(args.length ) {
				this._dom.textContent = args[0];
				return this;
			}
			return this._dom.textContent;
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
			// this._sb.ext.each(children, function(v,k) {
			// 	v.invalidate();
			// });

			this.dirty();
		},


		showChildren:function() {
			var cd  = this.canDraw();
			var children = this.children || {};
			this._sb.ext.each(children, function(v,k) {
				v.visible = cd;
			});

		},

		applyLayout: function() {
			//this._sb.ext.debug("Applying layout:", this.id, this.name);
			var d = this.dom;
			var dim = this.bind("dim");
			var px = this._sb.ext.px;
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
						dim(s, sf() );
					}
				});
			// }
		},


		_beforeDraw: function() {
			if(this.canDraw()) {
				d3.select(this.dom).style("visibility", "visible");
				//do this to the local layout, not the parent one
				//this._sb.ext.debug("Drawing:", this.id, this.name);
				if(this._layout) {
					var rect = this._dom.getBoundingClientRect();
					this._layout.rootWidth = rect.width;
					this._layout.rootHeight = rect.height;
					//apply child layout. 
					this._sb.layout.resize(this._layout);
				}

				this.draw();
				this._afterDraw();
			} else {
				d3.select(this.dom).style("visibility", "hidden");
			}
		},

		_afterDraw: function() {
		},

		draw: function() {
			
		},

		cleanup: function() {

		},


		dim: function(name, value) {
			var ext = this._sb.ext;
			if(arguments.length > 1) {
				this.dom.style[name] = ext.isStr(value) ? value : ext.px(value);
				return this;
			}
			return this._sb.ext.to_i(this.dom.style[name]);
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