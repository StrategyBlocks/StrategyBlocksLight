
/*globals define */

define(['sb_light/models/_abstractModel','sb_light/globals'], function( _Model, sb ) {
	'use strict';

	var E;

	var Model = _Model.extend({
		init: function() {
			E = sb.ext;

			this._super("news", sb.urls.MODEL_NEWS);
		},
		
		


		_massageUpdatedModel: function() {
			this._super();
			
			for(var i in this._model) {
				var h = this._model[i];
				h.fromNow = E.fromNow(h.date, E.unixFormat);
				h.dateNumber = E.moment(h.date, E.unixFormat);
				h.date = E.moment(h.date, E.unixFormat);
			}
		}
		
	});	
	return Model;
});

