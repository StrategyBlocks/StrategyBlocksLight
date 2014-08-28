
/*globals define */

define(['sb_light/models/_abstractModel','sb_light/globals'], function( _Model, sb ) {
	'use strict';

	var E;

	var Model = _Model.extend({
		init: function() {
			this._super("health_calculations", sb.urls.MODEL_HEALTHS);
		},
		_processResponse: function(data) {
			return this._super(data);
		}
		
	});
	
	return Model;	
});


