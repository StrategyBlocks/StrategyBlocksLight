


define([
	'sb_light/globals',
	'moment',		//needs to be mapped properly in the requirejs config
	'sb_light/utils/ext',	
	'sb_light/utils/svg',	
	'sb_light/utils/consts',
	'sb_light/utils/Class',
	'sb_light/models',		
	'sb_light/controller',
	'sb_light/api/state',	
	'sb_light/api/queries',	
	'sb_light/api/urls',	
	'sb_light/api/api',
	'sb_light/api/ajax'
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

