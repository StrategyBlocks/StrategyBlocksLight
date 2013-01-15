


define([
	'./globals',
	'./utils/ext',	
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
	ext,	
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
	
	globals.ext = ext;
	globals.consts = consts;
	globals.models = models;
	globals.controller = controller;
	globals.state = state;	 
	globals.queries = queries;	 
	globals.urls = urls;	 
	globals.api = api;	 
	globals.ajax = ajax; 
	globals.Class = Class;

	state.host = "http://demo.strategyblocks.com";

	console.log("Loaded SB: ", globals.state.host);


	return globals;
});
