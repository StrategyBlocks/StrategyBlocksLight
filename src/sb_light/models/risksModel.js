
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
				v.title_lower = E.lower(v.title);
				
				v.is_mine = v.owner_id == uid || v.manager_id == uid;
				v.is_watching= (E._.find(v.watching_user_ids, uid) != null),
				
				v.status = v.status.toLowerCase();
				v.d3statusNum = v.status == "inactive" ? 1 : (v.status == "warning" ? 2 : (v.status == "triggered" ? 3 : 0));
				
				//add new keys for each textarea item and add "<br/>" for each line break.
				E.each(["description", "impact_description", "mitigation_steps", "response_steps"], function(key) {
					v[key+"_html"] =  v[key] ? v[key].replace(/(?:\r\n|\r|\n)/g, '<br />') : "";  
				})

				if(!v.impact_description_html) {
					v.impact_description_html = "<em>No impact description.</em>";
				}
				if(!v.mitigation_steps_html) {
					v.mitigation_steps_html = "<em>No mitigation steps.</em>";
				}
				if(!v.response_steps_html) {
					v.response_steps_html = "<em>No response steps.</em>";
				}


				v.message = [v.impact_description_html, v.impact_description_html, v.mitigation_steps_html, v.response_steps_html];

			});

		},

	});
	return Model;	
});
