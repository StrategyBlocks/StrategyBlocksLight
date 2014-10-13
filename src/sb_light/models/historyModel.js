
/*globals define */

define(['sb_light/models/_abstractModel','sb_light/globals'], function( _Model, sb ) {
	'use strict';

	var E;
	var Model = _Model.extend({
		init: function() {
			E = sb.ext;

			this._authStateCheck = this._authStateCheck || sb.state.authorized;
			this._super("history", sb.urls.MODEL_HISTORY);
		},


		_processResponse:function(data) {
			var d = data && data.added;
			this._modelArray = d ? d.items: [];
			this._timestamp = d ? d.timestamp: 0;

			this._model = E._.indexBy(this._modelArray, "created_at");

			return true;

		}		
	});
	
	return Model;	
});


