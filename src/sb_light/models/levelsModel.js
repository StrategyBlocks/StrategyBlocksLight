
/*globals define */

define(['sb_light/models/_abstractModel','sb_light/globals'], function( _Model, sb ) {
	'use strict';

	var Model = _Model.extend({

		init: function() {
			this._super("levels", sb.urls.MODEL_LEVELS);
		},

		_massageUpdatedModel: function() {
			this._super();

			var E = sb.ext;

			this._modelArray.sort(E.sortFactory("position", E.sortNumber));
			this._modelArray.forEach(function(v) {
					if(E.isNum(v.color)) {
						v.color = E.to_color(v.color);
					}
				})
			;
			
		}

	});	
	return Model;
});
