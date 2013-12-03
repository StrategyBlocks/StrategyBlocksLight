
define(['sb_light/models/_abstractModel'], function( _Model ) {

	var Model = _Model.extend({
		init: function(sb) {
			this._super(sb, "health_calculations", sb.urls.MODEL_HEALTHS);
		},
		_processResponse: function(data) {
			this._super(data);
		}
		
	});
	
	return Model;	
});


