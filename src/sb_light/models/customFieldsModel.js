
/*globals define */

define(['sb_light/models/_abstractModel','sb_light/globals'], function( _Model, sb ) {
	'use strict';

	var E;
	var Model = _Model.extend({
		init: function() {
			E = sb.ext;

			this._authStateCheck = this._authStateCheck || sb.state.authorized;
			this._super("custom_fields", sb.urls.MODEL_CUSTOM_FIELDS);
		},


	
		_addTimestamp: function() {
			//ignore this. Not relevant to capabilities
		},


	});
	
	return Model;	
});


