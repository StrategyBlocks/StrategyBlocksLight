
define(['./_abstractModel'], function( _Model ) {

	var Model = _Model.extend({
		init: function(sb) {
			this._super(sb, "tags", sb.urls.MODEL_TAGS);
		}
	});
	return Model;	
});
