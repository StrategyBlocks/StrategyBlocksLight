define(['sb_light/globals','sb_light/utils/Class'], function( sb, Class ) {

	UI_MAP: {};


	var ui = Class.extend({
		_parent: null,
		_children: null,
		_id:null, 
		_style:null, 
		_left:null, _right:null, _top:null, _bottom:null, _width:null, _height:null,

		get id() 			{ return this._id; }, 	
		set id(x) 			{ this._id = x; return this;},
		get left() 			{ return this._left; }, 	
		set left(x) 		{ this._left = x; return this;},
		get right() 		{ return this._right; }, 	
		set right(x) 		{ this._right = x; return this;},
		get top() 			{ return this._top; }, 	
		set top(x) 			{ this._top = x; return this;},
		get bottom() 		{ return this._bottom; }, 	
		set bottom(x) 		{ this._bottom = x; return this;},
		get width() 		{ return this._width; }, 	
		set width(x) 		{ this._width = x; return this;},
		get height() 		{ return this._height; }, 	
		set height(x) 		{ this._height = x; return this;},
		set style(x) 		{ this._style = x;},


		init:function(parent, props) {
			this.id = parent.id + "_" + (props.id || sb.ext.unique());
			if(UI_MAP[this.id]) {
				throw "And element with this id already exists. " + this.id + "(" + (props.id) + ")";
			}

		},

		destroy: function() {
			delete UI_MAP[this.id];

		},


		child: function(idxOrId) {
			if(sb.ext.isString(idxOrId)) {
				return UI_MAP[id] || UI_MAP[this.id+"_"+idxOrId] || null;
			}
			return this._children[idxOrId];
		},

		add: function() {

		},

		draw: function() {

		},


	});



	return ui;
});