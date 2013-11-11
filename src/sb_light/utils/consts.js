/*globals define*/

define(['sb_light/globals'], function(sb) {

	var consts  =  {};

	consts.blockWidth = function() {	return 350;	};
	consts.blockHeight= function(selected) {return selected ? 185 : 150;};
	consts.blockTreePadding= function(x) {return x ? 80 : 90;};
	consts.blockTypes = function(opts) {
		opts = opts || {};
		var types = [
			{name: "Status", 	shortkey: "bs", 	key: "status"},
			{name: "Progress", 	shortkey: "bp", 	key: "progress"},
			{name: "Health", 	shortkey: "bh", 	key: "health"},
			{name: "Outputs", 	shortkey: "bk", 	key: "outputs"},
			{name: "Risk", 		shortkey: "br", 	key: "risks"}
		];

		if(opts.def) {
			types.unshift({name:"Default", shortkey:"bd", key:"default"});
		}

		if(opts.key) {
			types = types.map(function(el) {
				return el[opts.key];
			});
		}
		return 	types;
	};
	
	
	return consts;
	
});
