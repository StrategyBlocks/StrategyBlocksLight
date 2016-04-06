




/*globals define */

define(['sb_light/models/_abstractModel','sb_light/globals'], function( _Model, sb ) {
	'use strict';

	var E;
	var Model = _Model.extend({
		init: function() {
			this._authStateCheck = this._authStateCheck || sb.state.normal;

			this.responseKey = "exports";
			E = sb.ext;

			this._super("library", sb.urls.MODEL_LIBRARY);
		},
		

		_handleUpdate: function(resp) {
			this._super(resp);
		},

		_massageUpdatedModel: function() {
			this._super();
			E.each(this._model, function(v) {
				v.date = E.moment(v.created_at, E.unixFormat)
				v.public = v.status == "public";
			});
		}

	});
	
	return Model;	
});


