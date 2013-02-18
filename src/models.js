


define([
	'./globals',
	'./models/tagsModel',
	'./models/newsModel',
	'./models/usersModel',
	'./models/blocksModel',
	'./models/levelsModel',
	'./models/focusModel',
	'./models/risksModel',
	'./models/kpisModel',
	'./models/groupsModel',
	'./models/companiesModel',
	'./models/timezonesModel'
], function(sb, tags,news,users,blocks,levels,focus,risks,kpis,groups,companies,timezones) {
	
	var _models = {
		tags:		{klass:tags},
		news:		{klass:news},
		users:		{klass:users},
		blocks:		{klass:blocks},
		levels:		{klass:levels},
		focus:		{klass:focus},
		risks:		{klass:risks},
		kpis:		{klass:kpis},
		groups:		{klass:groups},
		companies:	{klass:companies},
		timezones:	{klass:timezones}
	};
	
	var models = {};
	
	models.reset = function(publish) {
		for(var mn in _models) {
			var m = _models[mn] ? _models[mn].model : null;
			if(m) { m.reset(publish); }
		}
	},
	models.get = function(modelName) {
		var m = _verifyModel(modelName);
		return m.model;
	},
	
	//adds a callback watcher. 
	//returns whether the model is valid or not. 
	models.subscribe = function(modelName,  cb) {
		var m = _verifyModel(modelName);
		m.model.subscribe(cb);
	},
	
	models.unsubscribe = function(modelName, cb) {
		var m = _verifyModel(modelName);
		m.model.unsubscribe(cb);
	},
	
	
	models.rawArray = function(modelName) {
		var m = _verifyModel(modelName);
		if(m.model) {
			return m.model.rawArray();
		}
	},
	
	models.raw = function(modelName) {
		var m = _verifyModel(modelName);
		if(m.model) {
			return m.model.raw();
		}
	},
	
	//one-off selection that will wait until the model is ready
	models.select = function(modelName, type, cb, func) {
		var m = _verifyModel(modelName);
		if(m.model) {
			sb.ext.debug("Doing a select on the model.", modelName);
			m.model.select(type, cb, func);
		}
	},
	
	models.isValid = function(modelName) {
		var m = _verifyModel(modelName);
		var valid = false; 
		if(m.model) {
			valid =  m.model.isValid();
		}
		return valid;
	}
	
	function _verifyModel (modelName) {
		var m = _models[modelName];
		if(!m) {
			throw new Error("sb.appModel.js: Model name not found: " + modelName);
		}
		if(!m.model) {
			m.model = new (m.klass)(sb);
		}

		return m;
	}
	
	
	return models;
	
});


