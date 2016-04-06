




/*globals define */

define(['sb_light/models/_abstractModel','sb_light/globals'], function( _Model, sb ) {
	'use strict';

	var E;
	var Model = _Model.extend({
		init: function() {
			this._authStateCheck = this._authStateCheck || sb.state.normal;

			E = sb.ext;

			this._super("metrics_expressions", sb.urls.MODEL_METRICS_EXPRESSIONS);
		},
		

		_massageUpdatedModel: function() {
			this._super();
			E.each(this._model, function(v) {
				v.name = v.name.toUpperCase();
			});
		}

	});
	
	return Model;	
});


