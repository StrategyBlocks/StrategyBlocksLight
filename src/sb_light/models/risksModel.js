
/*globals define */

define(['sb_light/models/_abstractModel','sb_light/globals'], function( _Model, sb ) {
	'use strict';

	var E,Q;


	var Model = _Model.extend({
		init: function() {
			this._super("risks", sb.urls.MODEL_RISKS);
			E = sb.ext;
			Q = sb.queries;

		},

		_massageUpdatedModel: function() {
			this._super();

			var uid = Q.user().id; 

			E.each(this._model, function(v) {
				v.is_mine = v.owner_id == uid || v.manager_id == uid;
				v.status = v.status.toLowerCase();
				v.statusNum = v.status == "inactive" ? 1 : (v.status == "warning" ? 2 : (v.status == "triggered" ? 3 : 0));
			});

		},

	});
	return Model;	
});
