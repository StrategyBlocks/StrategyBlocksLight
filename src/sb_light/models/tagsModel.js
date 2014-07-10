
/*globals define */

define(['sb_light/models/_abstractModel','sb_light/globals'], function( _Model, sb ) {
	'use strict';

	var Model = _Model.extend({
		init: function() {
			this._super("tags", sb.urls.MODEL_TAGS);
		}
	});
	return Model;	
});
