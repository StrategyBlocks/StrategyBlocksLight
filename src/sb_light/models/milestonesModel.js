
/*globals define */

define(['sb_light/models/_abstractModel','sb_light/globals'], function( _Model, sb ) {
	'use strict';

	var E;

	var Model = _Model.extend({
		init: function() {
			this._super("milestone_definitions", sb.urls.MODEL_MILESTONES);
		},


		//build an array cache of the model to make list-fetches / iterations / sorting quicker. 
		//but preserve the model as a map for key-value queries
		_resetArrayCache:function() {
			this._super();
		},
		

		_processResponse: function(data) {
			return this._super(data);
		}
	});
	
	return Model;	
});


