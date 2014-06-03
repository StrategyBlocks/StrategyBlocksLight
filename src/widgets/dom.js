/* globals define, $, d3 */

define([
	'sb_light/utils/Class', 
	//no args
	"d3"
], function( Class ) {
	
	'use strict';

	var E, ST, M, sb;

	var Dom = Class.extend({

		_listeners:null,
		_watching:null,
		_dom



		//do not override
		init:function(_sb, _parentDom) {
			sb = _sb;
			E = sb.ext;
			ST = sb.state;
			M = sb.models;
		},

		create: function() {

		},
		

		listen: function(type, cb) {
			this._listeners[type] = this._listeners[type] || [];
			this._listeners[type].push(cb);
			this.dom.addEventListener(type, cb);
		},


		//which models this widget subscribes to
		models: function(/*string list...*/) {
			var args = E.slice(arguments, 0);
			var m = this._sb.models;
			var ms = this._models;
			var df = this.bind("dirty");
			args.forEach(function(v,i) {
				ms[v] = m.subscribe(v, df);
			});
		},

		//watch a list of state properties
		watch: function(funcName, type /*, string list*/) {
			var args = E.slice(arguments, 1);
			var s = this._sb.state;
			var ss = this._watchers[type];
			var df = this.bind(funcName);
			args.forEach(function(v,i) {
				ss[v] = s.watch(type, v, df);
			});

		},





	});

	return Dom;

});