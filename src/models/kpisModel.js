
define(['./_abstractModel'], function( _Model ) {

	var Model = _Model.extend({
		init: function(sb) {
			this._super(sb, "kpis", sb.urls.MODEL_KPIS);
		}
	});
	return Model;	
});

