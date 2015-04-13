

/*globals define */

define(['sb_light/models/_abstractModel','sb_light/globals'], function( _Model, sb ) {
	'use strict';

	var E;
	var Model = _Model.extend({

		// _template:null,
		// _templateBusy:false,

		init: function() {
			E = sb.ext;
			this._authStateCheck = this._authStateCheck || sb.state.authorized;
			this._super("builders", sb.urls.MODEL_BUILDERS);
		},
		
		// get: function() {
		// 	if(!this._template) {
		// 		if(!this._templateBusy) {
		// 			this._templateBusy = true;
		// 			sb.controller.invoke(sb.urls.BUILDER_TEMPLATE, null, this.handleTemplate.bind(this),this.handleTemplate.bind(this),sb.state.authorized);
		// 		}
		// 		return null;
		// 	}

		// 	this._super();
		// },
		// template: function() {
		// 	return this._template || null;
		// },	

		// handleTemplate: function(r) {
		// 	this._templateBusy = false;
		// 	if(r && r.result)  {
		// 		this._template = r.result;
		// 		this._publish();
		// 	}
		// },

		// _publish: function() {
		// 	if(this._template && this._model) {
		// 		this._super();
		// 	} else {
		// 		this.get();
		// 	}
		// },



		_massageUpdatedModel: function() {
			this._super();


			// console.log("BUILDERS MODEL", this._model, E.length(this._model));


			var self = this;
			// E.each(this._model, function(m) {
			// 	self._massageEstemple(m);
			// 	self._massageStakeholders(m);
			// 	self._massageIndustry(m);
			// 	self._massageGrowthRate(m);
			// 	self._massageCompetitors(m);
			// 	self._massageCapabilities(m);
			// 	self._massageOpportunities(m);
			// 	self._massageStrengths(m);
			// 	self._massageHeatmap(m);
			// 	self._massageAnsoff(m);
			// 	self._massageGoals(m);
			// })

		},

	
	});
	
	return Model;	
});


