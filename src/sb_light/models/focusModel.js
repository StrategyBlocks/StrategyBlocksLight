/*globals define */

define(['sb_light/models/_abstractModel','sb_light/globals'], function( _Model, sb ) {
	'use strict';

	var E;
	var Model = _Model.extend({
		init: function() {
			this._super("focus", sb.urls.MODEL_FOCUS);

			E = sb.ext;
		},
		
		_massageUpdatedModel: function() {
			this._super();

			var arr = E.values(this._model).sort(E.sortFactory());

			arr.forEach(this._massageHierarchy.bind(this));
			this._massageDepth(null, arr.findKey("parent_id", "").value, 0);
		},

		_massageHierarchy:function(v) {
			var p = v.parent_id ? this._model[v.parent_id] : null;
			if(p) {
				p.children = [];
				p.children.push(v.id);
			}
		},
		_massageDepth:function(p, el, i) {
			el = E.isStr(el) ? this._model[el] : el;
			el.depth = p ? (p.depth +1) : 0;
			el.level_sort = p ? (p.level_sort	 + "_" + i) : "L1";
			if(el.children) {
				E.each(el.children, this._massageDepth.bind(this, el));
			}
		},

		_resetArrayCache:function() {
			this._super();
			this._modelArray.sort(E.sortFactory("sortKey"));
		}


	});	
	return Model;	
});

