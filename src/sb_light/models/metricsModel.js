
/*globals define */

define(['sb_light/models/_abstractModel','sb_light/globals'], function( _Model, sb ) {
	'use strict';

	var E;

	var Model = _Model.extend({
		init: function() {
			this._super("metrics", sb.urls.MODEL_METRICS);
			E = sb.ext;
		},

		_massageUpdatedModel: function() {
			this._super();

			var t = E.moment();
			//E.each(this._model, this._massageMetric.bind(this));

			console.log("Massage: ", E.moment().diff(t));

		},


	});
	return Model;	
});

