

define(['sb_light/utils/Class'], function( Class ) {

	var Widget = Class.extend({
		//called by "new Widget()"
		_sb:null,
		_dom:null,
		_def:null,
		_domFuncs:null,
		_sizeFuncs:null,
		_sizeDefs:null,
		_parent: null,
		_name:null,
		_events:null,
		_binds:null,
		_props:null,


		//do not override
		init:function(sb, parent, def) {
			this._sb = sb;
			this._props = this._buildPropsList();

			//storage place for bound functions. Storing bound functions here allows us to unsubscribe
			//from DOM event handlers, since the "bind" method returns a different function each time. 
			this._binds = {};

			this._sizeFuncs = {};
			this._sizeDefs = {};
			this._parent = parent;
			this._def = def;

			this._domFuncs = this._propertyOverrides();

			try {
				this.create();
				this.postCreate();
			}catch(e) {
				console.log( "Failed to create widget " + def.id + " " + JSON.stringify(e.message? (e.message + "\n" + e.source) : e)); 
				throw new Error("Failed to create widget " + def.id + " " + JSON.stringify(e.message? (e.message + "\n" + e.source) : e)); 
			}
			


			//this._provideEvents(); // not necessary if it doesn't provide anything... just for example
		},

		bind: function(name) {
			if(!this._binds[name]) {
				if(!this[name]) {
					throw new Error("SB_Light Widget (" + name + ") is not a function of : " + this.id());
				}
				this._binds[name] = this[name].bind(this);
			}
			return this._binds[name];
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

		create:function() {
			this._dom = this.createDom(this._def);
			this.parentDom().appendChild(this._dom);
		},

		postCreate:function() {
			//this._sb.ext.debug("Widget", this.id(), "postCreate / apply properties");
			this.applyProperties();
		},

		dom:function() {	return this._dom;	},
		id:function() {		return this._def.id || this._dom.id;},
		name:function() {	return this._name || this._def.widget;		},

		parentId:function() {
			return this._parent ? (this._sb.ext.isFunc(this._parent.id) ? this._parent.id() : this._parent.id ) : null;
		},
		parentDom:function() {
			return this._parent ? (this._sb.ext.isFunc(this._parent.dom) ? this._parent.dom() : this._parent ) : null;
		},

		cid:function(name) {
			return [this.id(), name].join("_");
		},

		_dims: {"b":"bottom", "l":"left", "r":"right", "t":"top", "h":"height","w":"width", "f":"fringe"},
		_dimReg: /left|right|top|bottom|height|width|fringe/,

		cidDim:function(name, dim, amt) {
			var _dim = String(this._dims[dim] || dim || "");
			var _base = ["@",this.cid(name)];
			var _dim = _dim.match(this._dimReg) ? _dim : null;
			var _amt = arguments.length == 2 && !_dim ? dim : (amt||0);
			if(_dim) {
				_base.put("#", _dim);
			}
			_base.put("#", _amt);
			return _base.join("");
		},

		_noop: function() {},
		_propertyOverrides: function() {
			return {
				"default": this.bind("property"),
				"subscribe": this.bind("subscribe"),
				"css": this.bind("cssText"),
				"style": this.bind("cssText"),
				"widget": this._noop,
				"widget-name": this.bind("dataProperty"),
				"class":this.bind("className"),
				"children":this._noop,
				"text": this.bind("text"),
				"left": this._noop,
				"right": this._noop,
				"top": this._noop,
				"bottom": this._noop,
				"x": this._noop,
				"y": this._noop,
				"height": this._noop,
				"width": this._noop,
				"fringe": this._noop
			};
		},

		appendChild: function(c) {
			if(this._dom && c) {
				this._dom.appendChild(c);
			}
		},
		createDom:function(opts) {
			if(!opts.widget) { throw new Error("The \'widget\' option must be specified, and be the name of a valid HTML element."); }
			return document.createElement(opts.widget);
		},

		applyProperties: function() {
			// this._sb.ext.debug("Apply Properties to ", this.id());

			this._def["class"]  = (this._def["class"] || "") + " sb_light_widget";
			this._def["widget-name"]  = this.name();


			for(var k in this._def) {
				var f = this._domFuncs[k] || this._domFuncs["default"];
				f(k, this._def[k]);
			}
			//this._domFuncs("className",  "sb_light_widget");
			//this._domFuncs("widget-name", this.name());
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
			return typeof this._def[name] === "undefined" ? null : this._def[name];
		},
		className: function() {
			var args = this._sb.ext.slice(arguments, arguments[0]=="class" ? 1 : 0);
			if(args.length) {
				var dom = this.dom();
				args[0].split(" ").forEach(function(el){
					if(el === "") { return; }
					var cn = dom.className.replace(el, " ");
					dom.className = cn + (args[1] ? "": (" " + el));
				});
				return this;
			}
			return this.dom().className;
		},
		property: function(name, value /*==null*/) {
			if(arguments.length > 1) {
				this._dom.setAttribute(name, value);
				return this;
			}
			return this._dom.getAttribute(name);
		},

		subscribe:function() {
			var args = this._sb.ext.slice(arguments, arguments.length > 1 ? 1 : 0);
			var obj = args[0];
			for(var eventName in obj) {
				var def = obj[eventName];
				if(!this._events[eventName]) {
					throw new Error("SB_Light Widget (" + this._name + ") does not provide the event: " + eventName);
				}
				this._events[eventName] = this._events[eventName] || {};
				this._events[eventName][def.id] = def.func;
			}
		},
		unsubscribe: function(eventName, funcId) {
			if(this._events && this._events[eventName]) {
				delete this._events[eventName][funcId];
			}
		},
		trigger:function(eventName, context ) {
			var args=  this._sb.ext.slice(arguments, 2);
			if(this._events && this._events[eventName]) {
				for(var en in this._events[eventName]) {
					this._sb.queue.add(this._events[eventName][en]);
				}
			}
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
			if(args.length) {
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

		applyLayout: function() {
			var d = this.dom();
			var dim = this.bind("dim");
			var px = this._sb.ext.px;
			var sz = this.bind("sizeFuncs");

			["left","top","width","height"].forEach(function(s) {
				dim(s, sz(s)() );
			});

			//this._sb.ext.debug("sb_light Widget: applyLayout: ", this.id(), this.style());
			this._sb.queue.add(this.bind("handleResize"), "handleResize_"+this.id());
		},

		handleResize: function(e) {
			//this._sb.ext.debug("Widget: ", this.id(), "handleResize")
		},


		_provideEvents: function(/*..args*/) {
			var args = this._sb.ext.slice(arguments);
			this._events = this._events || {};
			for(var i = 0; i < arguments.length; ++i) {
				this._events[args] = {};
			}
		},

		dim: function(name, value) {
			if(arguments.length > 1) {
				this.dom().style[name] = this._sb.ext.px(value);
				return this;
			}
			return this._sb.ext.to_i(this.dom().style[name]);
		},

		rect: function() {
			return {
				x:this.dim("left"),
				y:this.dim("top"),
				width: this.dim("width"),
				height:this.dim("height")
			};
		}

	});

	return Widget;

});