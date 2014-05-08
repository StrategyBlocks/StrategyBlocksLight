
define(['sb_light/models/_abstractModel'], function( _Model ) {

	var E;
	var Model = _Model.extend({
		init: function(sb) {
			this._super(sb, "focus", sb.urls.MODEL_FOCUS);
		},
		_massageUpdatedModel: function() {
			this._super();

			E = this._sb.ext;

			this._modelArray.forEach(this._massageHierarchy.bind(this));
			this._massageDepth(null, this._modelArray.findKey("parent_id", "").value, 0);
			this._modelArray.sort(E.sortFactory("sortKey"));
		},


		_massageHierarchy:function(v) {
			var p = v.parent_id ? this._model[v.parent_id] : null;;
			if(p) {
				p.children = p.children || [];
				p.children.push(v.id);
			}
		},
		_massageDepth:function(p, el, i) {
			el = E.isStr(el) ? this._model[el] : el;
			el.depth = p ? (p.depth +1) : 0;
			el.sortKey = p ? (p.sortKey + "_" + i) : "root";
			if(el.children) {
				E.each(el.children, this._massageDepth.bind(this, el));
			}
		}

	});	
	return Model;	
});

