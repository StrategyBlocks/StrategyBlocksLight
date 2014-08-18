


define([
	'sb_light/globals',
	'sb_light/models/tagsModel',
	'sb_light/models/newsModel',
	'sb_light/models/usersModel',
	'sb_light/models/blocksModel',
	'sb_light/models/levelsModel',
	'sb_light/models/focusModel',
	'sb_light/models/risksModel',
	'sb_light/models/kpisModel',
	'sb_light/models/metricsModel',
	'sb_light/models/companiesModel',
	'sb_light/models/groupsModel',
	'sb_light/models/timezonesModel',
	'sb_light/models/healthsModel',
	'sb_light/models/milestonesModel',
	'sb_light/models/capabilitiesModel'
], function(sb, tags,news,users,blocks,levels,focus,risks,kpis, metrics, companies, groups,timezones,healths, milestones, capabilities) {

	'use strict';
	
	var _models = {
		tags:						{klass:tags},
		news:						{klass:news},
		users:						{klass:users},
		blocks:						{klass:blocks},
		levels:						{klass:levels},
		focus:						{klass:focus},
		risks:						{klass:risks},
		kpis:						{klass:kpis},
		metrics:					{klass:metrics},
		groups:						{klass:groups},
		companies:					{klass:companies},
		timezones:					{klass:timezones},
		capabilities:				{klass:capabilities},
		health_calculations:		{klass:healths},
		milestone_definitions:		{klass:milestones}
	};
	
	var models = {};
	
	models.reset = function(publish) {
		for(var mn in _models) {
			var m = _models[mn] ? _models[mn].model : null;
			if(m) { m.reset(publish); }
		}
	};
	models.get = function(modelName) {
		var m = _verifyModel(modelName);
		return m.model;
	};

	models.find = function(modelName, id) {
		var m = _verifyModel(modelName);
		return m.model.find(id);
	};
	
	//adds a callback watcher. 
	//returns whether the model is valid or not. 
	models.subscribe = function(modelName,  cb, domNode/*==null*/) {
		var m = _verifyModel(modelName);
		return m.model.subscribe(cb, domNode);
	};
	
	//"remove" can be an actual cb function, or the id returned from the subscribe. 
	models.unsubscribe = function(modelName, remove) {
		var m = _verifyModel(modelName);
		return m.model.unsubscribe(remove);
	};
	

	//type is optional depending on the model
	models.rawArray = function(modelName, type) {
		var m = _verifyModel(modelName);
		if(m.model) {
			return m.model.rawArray(type);
		}
	};
	
	//type is optional depending on the model
	models.raw = function(modelName, type) {
		var m = _verifyModel(modelName);
		if(m.model) {
			return m.model.raw(type);
		}
	};
	
	//one-off selection that will wait until the model is ready
	//types:
	//  all: raw map
	//  array unsorted
	//	filter -- run array through a filter function
	models.select = function(modelName, type, cb, func) {
		var m = _verifyModel(modelName);
		if(m.model) {
			sb.ext.debug("Doing a select on the model.", modelName);
			m.model.select(type, cb, func);
		}
	};
	
	models.isValid = function(modelName) {
		var m = _verifyModel(modelName);
		var valid = false; 
		if(m.model) {
			valid =  m.model.isValid();
		}
		return valid;
	};
	
	function _verifyModel (modelName) {
		var m = _models[modelName];
		if(!m) {
			throw new Error("sb.appModel.js: Model name not found: " + modelName);
		}
		if(!m.model) {
			m.model = new (m.klass)();
		}

		return m;
	};
	
	
	return models;
	
});


