
/*globals define */

define(['sb_light/models/_abstractModel','sb_light/globals'], function( _Model, sb ) {
	'use strict';

	var E;

	var Model = _Model.extend({

		init: function() {
			this._super("kpis", sb.urls.MODEL_KPIS);
			E = sb.ext;
		},

		_massageUpdatedModel: function() {
			this._super();
			E.each(this._model, function(v,k) {
				//legacy stuff -- just don't want/need to rewrite yet
				E.massageKpi(v);
			});
		},

	});
	return Model;	
});

