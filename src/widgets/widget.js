

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

		init:function(sb, parentNode, def) {
			this._sb = sb;
			this._domFuncs = this._propertyOverrides();
			this._sizeFuncs = {};
			this._sizeDefs = {};
			
			this._parent = parentNode;
			this._def = def;
			this._dom = this.createDom(this._def);
			this.parentDom().appendChild(this._dom);
			
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
		

		_noop: function() {},
		_propertyOverrides: function() { 
			return {
				"default": this.property.bind(this),
				"style": this.style.bind(this),
				"widget": this._noop,
				"class":this.className.bind(this),
				"children":this._noop,
				"text": this.text.bind(this),

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
			if(!opts.widget) { throw "The 'widget' option must be specified, and be the name of a valid HTML element."; }
			return document.createElement(opts.widget);

		},

		applyProperties: function() {
			for(var k in this._def) {
				var f = this._domFuncs[k] || this._domFuncs["default"];
				f(k, this._def[k]);
			}
			this.className("sb_light_widget");
			this.dataProperty("name", this.name());

		},

		source: function(name) {
			return typeof this._def[name] === "undefined" ? null : this._def[name];
		},
		className: function(value/*==null*/, remove/*==false*/) { 
			if(arguments.length > 0) {
				this._dom.className = this._dom.className.replace(new RegExp("(^|\s)"+value+"(\s|$)"), " ") + (remove ? "": (" " + value));
			}
			return this._dom.className; 
		},
		property: function(name, value /*==null*/) {
			if(arguments.length > 1) {
				this._dom.setAttribute(name, value);
			}
			return this._dom.getAttribute(name); 
		},
		dataProperty: function(name, value /*==null*/) {
			this.property.call(this, "data-"+name, value);
		},

		style: function(name, value /*==null*/) {
			if(arguments.length > 1) {
				this._dom.style.cssText = value;
			}
			return this._dom.style.cssText;
		},

		text: function(name, value/*==null*/) { 
			if(value != null) {
				this._dom.textContent = value;
			}
			return this._dom.textContent; 
		},

		sizeDefs:function(name, value) {
			if(arguments.length > 1) {
				this._sizeDefs[name] = value;
			}

			return this._sizeDefs[name];
		},

		sizeFuncs:function(name, value) {
			if(arguments.length > 1) {
				this._sizeFuncs[name] = value;
			}
			return this._sizeFuncs[name];
		},

		applyLayout: function() {
			var d = this.dom();
			var px = this._sb.ext.px;
			var sz = this.sizeFuncs.bind(this);

			["left","top","width","height"].forEach(function(s) {
				d.style[s] = px( sz(s)() );
			});

			this._sb.ext.debug(this.id(), this.style());
			this.handleResize();
		},

		handleResize: function(e) {
			this._sb.events.stop(e);
		}

	});

	return Widget;

});