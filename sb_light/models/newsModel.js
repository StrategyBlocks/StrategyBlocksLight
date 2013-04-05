
define(['sb_light/models/_abstractModel'], function( _Model ) {

	var Model = _Model.extend({
		init: function(sb) {
			this._super(sb, "news", sb.urls.MODEL_NEWS);
		},
		
		
		
		//usually override by the model subclasses to provide some post-processing on the model elements before consumption 
		//by a view
		_massageUpdatedModel: function() {
			this._super();
			// for(var k in this._model) {
			// }
		}
	});	
	return Model;
});

