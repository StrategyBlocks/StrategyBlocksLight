


define([
	'sb_light/globals',
	'sb_light/lib/moment',	
	'sb_light/utils/ext',	
	'sb_light/utils/svg',	
	'sb_light/utils/queue',	
	'sb_light/utils/events',	
	'sb_light/layout',	
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
	queue,
	events,
	layout,
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
	globals.queue = queue;
	globals.events = events;
	globals.layout = layout;
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

