
define(['./_abstractModel'], function( _Model ) {

	var Model = _Model.extend({
		init: function(sb) {
			this._super(sb, "timezones", sb.urls.MODEL_TIMEZONES);
		},
		
		_processResponse: function(data) {
			this._sb.ext.debug("Handle Timezone response");
			this._super(data);
			this._sb.ext.debug("Done Handle Timezone response", this._model);
		},
		
		get:function() {
			this._sb.ext.debug("Getting Timezones.");
			var m = this._super();
			this._sb.ext.debug("Done Getting Timezones.", m);
			return m;	
		}
	});
	
	return Model;	
});


