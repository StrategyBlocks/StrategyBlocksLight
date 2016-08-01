
/*globals define */

define(['sb_light/models/_abstractModel','sb_light/globals'], function( _Model, sb ) {
	'use strict';

	var E;

	var Model = _Model.extend({
		
		init: function() {

			E = sb.ext; 
			
			this._authStateCheck = this._authStateCheck || sb.state.authorized;
			this._super("companies", sb.urls.MODEL_COMPANIES);
		},


		_massageUpdatedModel: function() {
			this._super();
			E.each(this._model, function(v) {
				v.name_lower = E.lower(v.name);
			});
		}

		
	});	
	return Model;
});
