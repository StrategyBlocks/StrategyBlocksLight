

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
			E.each(this._model, function(m) {
				self._massageEstemple(m);
				self._massageStakeholders(m);
				self._massageIndustry(m);
				self._massageGrowthRate(m);
				self._massageOpportunities(m);
				self._massageCompetitors(m);
				self._massageCapabilities(m);
			})

		},

		_massageEstemple: function(m) {
			m.estemple = E.map(m.estemple, function(v,i) {
				return E.merge(v, {
					id: E._.camelCase(v.name),
					index:(i+1)
				});
			});
		},

		_massageStakeholders: function(m) {
			m.stakeholders = E.map(m.stakeholders, function(v,i) {
				return E.merge(v, {
					id: E._.camelCase(v.name),
					key:String.fromCharCode(i+65)
				});
			}).filter(function(v) {
				return v.name && true;
			});
		},
		_massageIndustry: function(m) {
			m.industry = E.map(m.industry, function(v,i) {
				return E.merge(v, {
					id: E._.camelCase(v.name),
				});
			});
		},

		_growthProperties: {
			"introduction":	{end:0.85, mid:0.96, color:"#aaa", icon:(SB_OPTIONS.images + "/builder/growth_intro.png")},
	 		"growth":		{end:0.4, mid:0.7, color:"#faa", icon:(SB_OPTIONS.images + "/builder/growth_growth.png")},
	 		"maturity":		{end:0.14, mid:0.1, color:"#aaf", icon:(SB_OPTIONS.images + "/builder/growth_mature.png")},
	 		"decline":		{end:0.50, mid:0.20, color:"#fFa", icon:(SB_OPTIONS.images + "/builder/growth_decline.png")}
	 	},
	 	
		_massageGrowthRate: function(m) {
			var self = this;
			m.growth_rate_list = E.map(m.growth_rate_list, function(v,i) {
				var g = E.merge(v, {
					id: E._.camelCase(v.name),
				});
				return E.merge(self._growthProperties[g.id], g);
			});

		},


		_competitorsProperties: {
			"me": 		{id:"me", 		idx: 0, color:"#69839D", bsPrefix:"success"}, 
			"first": 	{id:"first", 	idx: 1, color:"#F6B568", bsPrefix:"danger"}, 
			"second": 	{id:"second",	idx: 2, color:"#F6B568", bsPrefix:"danger"}, 
			"third": 	{id:"third",	idx: 3, color:"#F6B568", bsPrefix:"danger"},
		},

		_massageCompetitors: function(m) {

			var self = this;

			var me = E._.find(m.competitors, {competitor:false});
			if(!me) { return; }

			me = E.merge(this._competitorsProperties.me, me);

			var them = E.filter(m.competitors, function(v) {
				// console.log("Competitor", v, v.name, v.competitor);
				return v.competitor == true;
			});

			// console.log("Competitors", them, them.length, m.competitors, m.competitors.length);
			them = E.map(them, function(v,i) {
				var c = E.merge(v, {
					id: ["first", "second", "third"][i]
				});

				return E.merge(self._competitorsProperties[c.id], c);
			});

			m.competitors = [me].concat(them);

		},


		_massageCapabilities: function(m) {
			var list = m.capabilities_list;
			var selected = E.map(m.capabilities, function(v) { return v.name;});

			m.capabilities_list = E.map(m.capabilities_list, function(v) {
				return E.merge({
					selected: 	(selected.indexOf(v.name) > -1),
					strength: 	(v.strength || 0),
					id: 		(v.id || E._.camelCase(v.name))
				},v);
			});
			m.capabilities = E.map(m.capabilities, function(v) {
				return E.merge({
					strength: 	(v.strength || 0),
					id: 		(v.id || E._.camelCase(v.name))
				},v);
			});

		},

		_massageOpportunities: function(m) {
			m.opportunities = E.map(m.opportunities, function(v,i) {
				return E.merge(v, {
					id: E._.camelCase(v.name),
				});
			});
		}


	});
	
	return Model;	
});


