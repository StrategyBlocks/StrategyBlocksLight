


/*globals define */

define(['sb_light/models/_abstractModel','sb_light/globals'], function( _Model, sb ) {
	'use strict';

	var E;
	var Q;
	var Model = _Model.extend({
		init: function() {
			this._authStateCheck = this._authStateCheck || sb.state.normal;

			this.responseKey = "exports";
			E = sb.ext;
			Q = sb.queries;

			this._super("library", sb.urls.MODEL_LIBRARY);
		},
		

		_handleUpdate: function(resp) {
			this._super(resp);
		},

		_massageUpdatedModel: function() {
			this._super();
			E.each(this._model, function(v) {
				v.date = v.created_at;
				v.public = v.status == "public";
				v.rating = v.rating || 0;
				v.local = v.company_id == Q.company().id;
				v.fromNow  = sb.dates.create({days: v.duration}).toNow(true);
			});
		}

	});
	
	return Model;	
});


