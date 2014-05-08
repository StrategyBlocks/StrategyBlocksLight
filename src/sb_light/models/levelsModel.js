
/*globals define*/

define(['sb_light/models/_abstractModel'], function( _Model ) {

	'use strict';
	var Model = _Model.extend({

		init: function(sb) {
			this._super(sb, "levels", sb.urls.MODEL_LEVELS);
		},

		_massageUpdatedModel: function() {
			this._super();

			var E = this._sb.ext;

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
