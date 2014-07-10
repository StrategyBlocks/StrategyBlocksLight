
/*globals define */

define(['sb_light/models/_abstractModel','sb_light/globals'], function( _Model, sb ) {
	'use strict';

	var E;

	var Model = _Model.extend({
		init: function() {
			this._super("milestone_definitions", sb.urls.MODEL_MILESTONES);
		},
		

		_processResponse: function(data) {
			this._super(data);
		}
	});
	
	return Model;	
});


