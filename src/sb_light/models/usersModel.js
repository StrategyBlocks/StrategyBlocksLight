
/*globals define, CryptoJS*/

define(['sb_light/models/_abstractModel','sb_light/globals', "sb_light/utils/ext", "md5"], function( _Model, sb, E ) {
	
	'use strict';

	var Model = _Model.extend({
		init: function() {

			this._authStateCheck = this._authStateCheck || sb.state.authorized;
			this._super("users", sb.urls.MODEL_USERS);
		},



		_massageUpdatedModel: function() {
			this._super();
			
			var cu = sb.state.context("user");

			E.each(this._model, function(u) {
				u.gravatar = CryptoJS.MD5(u.username).toString();
				u.name = u.first_name + " " + u.last_name;
				u.role = u.company_membership.role;
				u.active = u.company_membership.active;
				u.deletable = u.company_membership.deletable;


				if( cu.id == u.id) {
					//hack to fix server inconsistency
					u.stay_logged_in = cu.stay_logged_in;
				}

			});
		}
	});	
	return Model;
});
