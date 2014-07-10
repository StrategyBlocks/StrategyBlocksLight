
/*globals define */

define(['sb_light/models/_abstractModel','sb_light/globals'], function( _Model, sb ) {
	'use strict';

	var Model = _Model.extend({
		init: function() {
			this._super("news", sb.urls.MODEL_NEWS);
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

