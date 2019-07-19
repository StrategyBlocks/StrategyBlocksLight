
/*globals define */

define(['sb_light/models/_abstractModel','sb_light/globals', 'fuse'], function( _Model, sb, Fuse ) {
	'use strict';

	var E,Q;


	var Model = _Model.extend({
		init: function() {
			this._super("risks", sb.urls.MODEL_RISKS);
			E = sb.ext;
			Q = sb.queries;

		},

		filter_search: function(m, searchString) {
			if(!searchString) {
				return true;
			}

			var fuse = new Fuse([m], {
				keys: ["title", "description"], 
				id:"id", 
				include:["score"],
				threshold:0.3}
			);
			var res = fuse.search(searchString); 
			return res && res.length ? true : false;
		},

		filter_likelihood: function(r, list) {
			if(!list || !list.length ) { return true; }


			return list.indexOf(String(r.likelihood)) > -1;
		},
		filter_impact: function(r, list) {
			if(!list || !list.length ) { return true; }
			return list.indexOf(String(r.impact)) > -1;
		},

		_massageUpdatedModel: function() {
			this._super();

			var uid = Q.user().id; 

			E.each(this._model, function(v) {
				v.title_lower = E.lower(v.title);
				
				
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
