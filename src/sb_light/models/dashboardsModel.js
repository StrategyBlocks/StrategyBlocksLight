
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

			var u  = sb.queries.user();
			E.each(this._model, function(d) {
				d.title_lower = E.lower(d.title);
				d.updated_recently = E.daysDiff(E.todayMoment(), E.parseUnixDate(d.updated_at)) < 7;
				d.updated_today = E.daysDiff(E.todayMoment(), E.parseUnixDate(d.updated_at)) < 2;
				d.updated_number = E.parseUnixDate(d.updated_at);
				d.is_owner = u.id == d.owner_id;
				E.each(d.widgets, function(w) {
					w.id = w.id || E.unique("widget");
				});

				var normalizeDepth = E._.sortBy(
					E.map(d.widgets, function(w) {
						return {depth: E.first(w.depth, 0), widget: w};
					}), 'depth'
				);


				//widgets pushed to the FRONT
				var above = E._.filter(normalizeDepth, function(v) {
					return v.depth > 0;
				});
				E.each(above, function(v,k) {
					v.widget.depth = k+1;
				});

				//widgets pushed to to BACK
				var below = E._.filter(normalizeDepth, function(v) {
					return v.depth < 0;
				});
				
				E.each(below.reverse(), function(v,k) {
					v.widget.depth = -(k+1);
				});

			});

		}		


	});	
	return Model;
});
