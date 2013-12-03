
define(['sb_light/models/_abstractModel'], function( _Model ) {

	var Model = _Model.extend({
		init: function(sb) {
			this._super(sb, "milestone_definitions", sb.urls.MODEL_MILESTONES);
		},
		

		_processResponse: function(data) {
			this._super(data);
		}
	});
	
	return Model;	
});


