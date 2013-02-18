


define([
	'./globals',
	'moment',		//needs to be mapped properly in the requirejs config
	'./utils/ext',	
	'./utils/svg',	
	'./utils/consts',
	'./utils/Class',
	'./models',		
	'./controller',
	'./api/state',	
	'./api/queries',	
	'./api/urls',	
	'./api/api',
	'./api/ajax'
], function(
	globals,
	moment,
	ext,	
	svg,
	consts,	 
	Class,	 
	models,	
	controller,
	state,	
	queries,	
	urls,	
	api,
	ajax
) {
	//globals.version = "0.0.1";
	globals.debug = true;
	
	globals.moment = moment;
	globals.ext = ext;
	globals.svg = svg;
	globals.consts = consts;
	globals.models = models;
	globals.controller = controller;
	globals.state = state;	 
	globals.queries = queries;	 
	globals.urls = urls;	 
	globals.api = api;	 
	globals.ajax = ajax; 
	globals.Class = Class;
	

	state.host = "https://app.strategyblocks.com";

	globals.ext.debug("Loaded SB: ", globals.state.host);


	return globals;
});
