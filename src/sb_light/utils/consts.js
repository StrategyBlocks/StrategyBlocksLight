/*globals define*/

define(['sb_light/globals'], function(sb) {

	var consts  =  {};

	consts.blockWidth = function() {	return 350;	};
	consts.blockHeight= function(selected) {return selected ? 185 : 150;};
	consts.blockTreePadding= function(x) {return x ? 80 : 110;};
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

	consts.blockRollupTypes = function() { 
		return [
			{key:"progressRollupDefault", 	name:"Default", 	value: -1},	//-1
			{key:"progressRollupCustom", 	name:"Custom", 		value: 0},	//0
			{key:"progressRollupDuration", 	name:"Duration", 	value: 0},	//1
			{key:"progressRollupEffort", 	name:"Effort", 		value: 0},	//2
			{key:"progressRollupPriority", 	name:"Priority", 	value: 0}	//3
		]
	};
	
	consts.blockLinkRollupTypes = function() { 
		return [
			{key:"progressLinkRollupDefault", 	name:"Default", 	value: -1},	//-1
			{key:"progressLinkRollupCustom", 	name:"None", 		value: 0},	//0
			{key:"progressLinkRollupDuration", 	name:"Eliminate", 	value: 1},	//1
			{key:"progressLinkRollupEffort", 	name:"Normal", 		value: 2}	//2
		]
	};
	
	
	
	return consts;
	
});
