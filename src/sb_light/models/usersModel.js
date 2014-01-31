

define(['sb_light/models/_abstractModel'], function( _Model ) {

	var Model = _Model.extend({
		init: function(sb) {
			this._super(sb, "users", sb.urls.MODEL_USERS);
		},
		_massageUpdatedModel: function() {
			this._super();
			
			for(var i in this._model) {
				var u = this._model[i];
				u.name = u.first_name + " " + u.last_name;
				u.role = u.company_membership.role;
				u.active = u.company_membership.active;
				u.deletable = u.company_membership.deletable;
			}
		}
	});	
	return Model;
});
