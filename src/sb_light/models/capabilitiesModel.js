
/*globals define */

define(['sb_light/models/_abstractModel','sb_light/globals', 'sb_light/utils/ext'], function( _Model, sb, E ) {
	'use strict';

	var E;
	var Model = _Model.extend({
		init: function() {
			this._authStateCheck = this._authStateCheck || sb.state.authorized;
			this._super("capabilities", sb.urls.MODEL_CAPABILITIES);
		},
		

		_addTimestamp: function() {
			//ignore this. Not relevant to capabilities
		},

		//build an array cache of the model to make list-fetches / iterations / sorting quicker. 
		//but preserve the model as a map for key-value queries
		_resetArrayCache:function() {
			this._modelArray = E.map(this._model, function(v, k) {
				return {name:k, value:v};
			});
		},
	});
	
	return Model;	
});


