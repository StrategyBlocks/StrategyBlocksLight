
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

			E.each(this._model, function(v) {
				v.tolerance = {
					range_start: v.range_start,
					range_end: v.range_end,
					below_tolerance_good: v.below_tolerance_good,
					percentage: v.percentage
				}
			});

		},


	});
	return Model;	
});

