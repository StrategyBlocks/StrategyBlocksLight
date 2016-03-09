
/*globals define */

define(['sb_light/models/_abstractModel','sb_light/globals'], function( _Model, sb ) {
	'use strict';

	var E;
	var Model = _Model.extend({

		init: function() {
			E = sb.ext;
		
			this._super("dashboards", sb.urls.MODEL_DASHBOARDS);
		},


		_massageUpdatedModel: function() {
			this._super();

			E.each(this._model, function(d) {
				E.each(d.widgets, function(w) {
					w.id = w.id || E.unique("widget");
				})
			});

		}		


	});	
	return Model;
});
