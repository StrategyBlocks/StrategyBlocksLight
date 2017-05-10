/*globals define*/


define([
	'sb_light/globals',
	'moment',	
	'sb_light/utils/polyfills',	
	'sb_light/utils/ext',	
	'sb_light/utils/dates',	
	'sb_light/utils/subman',	
	'sb_light/utils/svg',	
	'sb_light/utils/queue',	
	'sb_light/utils/events',	
	'sb_light/layout',	
	'sb_light/utils/Class',
	'sb_light/models',		
	'sb_light/controller',
	'sb_light/api/state',	
	'sb_light/api/queries',	
	'sb_light/api/urls',	
	'sb_light/api/api',
	'sb_light/api/ajax',
	'widgets/main',

	//ignore
	'sb_light/utils/jqueryPlugins',	
], function(
	globals,
	moment,
	polyfills,
	ext,
	dates,
	subman,	
	svg,
	queue,
	events,
	layout,
	Class,	 
	models,	
	controller,
	state,	
	queries,	
	urls,	
	api,
	ajax,
	widgets
) {
	'use strict';

	//globals.version = "0.0.1";

	//sometimes the way moment.js gets loaded is different. If it's not loaded properly via AMD, check the global context (this, window).
	globals.moment = moment || this.moment || window.moment;
	if(!globals.moment && !globals.moment.version) { throw "Moment JS has not been loaded properly."; }

	globals.polyfills = polyfills;
	globals.ext = ext;
	globals.subman = subman;
	globals.dates = dates;
	globals.svg = svg;
	globals.queue = queue;
	globals.events = events;
	globals.layout = layout;
	globals.models = models;
	globals.controller = controller;
	globals.state = state;	 
	globals.queries = queries;	 
	globals.urls = urls;	 
	globals.api = api;	 
	globals.ajax = ajax; 
	globals.Class = Class;
	globals.widgets = widgets;
	

	globals.debug = false;
	state.host = "https://app.strategyblocks.com";

	return globals;
});

