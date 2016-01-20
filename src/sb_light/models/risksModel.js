
/*globals define */

define(['sb_light/models/_abstractModel','sb_light/globals'], function( _Model, sb ) {
	'use strict';

	var E,Q;


	var Model = _Model.extend({
		init: function() {
			this._super("risks", sb.urls.MODEL_RISKS);
			E = sb.ext;
			Q = sb.queries;

		},

		_massageUpdatedModel: function() {
			this._super();

			var uid = Q.user().id; 

			E.each(this._model, function(v) {
				v.is_mine = v.owner_id == uid || v.manager_id == uid;
				v.status = v.status.toLowerCase();
				v.statusNum = v.status == "inactive" ? 1 : (v.status == "warning" ? 2 : (v.status == "triggered" ? 3 : 0));
				
				//add new keys for each textarea item and add "<br/>" for each line break.
				E.each(["description", "impact_description", "mitigation_steps", "response_steps"], function(key) {
					v[key+"_html"] =  v[key].replace(/(?:\r\n|\r|\n)/g, '<br />');  
				})
			});

		},

	});
	return Model;	
});
