
/*globals define */

define(['sb_light/models/_abstractModel','sb_light/globals'], function( _Model, sb ) {
	'use strict';

	var E;
	var Model = _Model.extend({

		init: function() {
			E = sb.ext;
		
			this._super("documents", sb.urls.MODEL_DOCUMENTS);
		},


		_massageUpdatedModel: function() {
			this._super();
			
			E.each(this._model, function(d) {
				d.created_at = E.moment(d.created_at, E.unixFormat);
				d.updated_at = E.moment(d.updated_at, E.unixFormat);
				d.real_id = d.id.replace(/^[\w]_(\w+)$/, "$1");
			});

		}		


	});	
	return Model;
});
