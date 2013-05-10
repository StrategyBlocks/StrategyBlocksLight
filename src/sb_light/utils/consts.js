/*globals define*/

define(['sb_light/globals'], function(sb) {

	var consts  =  {};
	
	consts.COLOR = {
		BLOCK: {
			"green":	"#176717",
			"yellow":	"#77771B",
			"red":		"#641717"
		}
	};
	
	consts.STATE = {
			BLOCK: 					"block",
			BLOCK_TREE_ZOOM: 		"blockTreeZoom",
			BLOCK_MAP_ZOOM: 		"blockMapZoom",
			CHILD_BLOCK: 			"childBlock",
			BLOCK_SETTINGS_VIEW: 	"blockSettingsView",
			BLOCK_SETTINGS_COLLAPSE:"blockSettingsCollapse",
			BLOCKS_TREE_VIEW: 		"blocksTreeView",
			BLOCKS_MAP_VIEW: 		"blocksMapView",
			BLOCKS_TIMELINE_VIEW: 	"blocksTimelineView",
			MANAGE_BLOCK_VIEW: 		"manageBlockView",
			PAGE: 					"page",
			USER_ID: 				"userId",
			COMPANY_ID:				"companyId",
			COMPANY: 				"company",
			USER: 					"user",
			SESSION: 				"session",
			PREV_PAGE: 				"previousPage",
			PREV_BLOCK: 			"previousBlock"
			
	};
		
	
	consts.BLOCK_SETTINGS = {
			VIEW: {
				DEFAULT: 	{name: "Default", 	key: "bd"},
				STATUS: 	{name: "Status", 	key: "bs"},
				PROGRESS: 	{name: "Progress", 	key: "bp"},
				HEALTH: 	{name: "Health", 	key: "bh"},
				KPI: 		{name: "Outputs", 	key: "bk"},
				RISK: 		{name: "Risk", 		key: "br"},
				NPV: 		{name: "Value", 	key: "bn"}
			},
			COLLAPSE: "c"
	};
		
	consts.BLOCKS_MAP = {
			VIEW: {
				RADIAL: "radial",
				HIERARCHY: "hierarchy"
			}
	};
	
	consts.BLOCKS_TREE = {
			VIEW: {
				STATUS: 	consts.BLOCK_SETTINGS.VIEW.STATUS.key,
				PROGRESS: 	consts.BLOCK_SETTINGS.VIEW.PROGRESS.key,
				HEALTH: 	consts.BLOCK_SETTINGS.VIEW.HEALTH.key,
				KPI: 		consts.BLOCK_SETTINGS.VIEW.KPI.key,
				RISK: 		consts.BLOCK_SETTINGS.VIEW.RISK.key,
				NPV: 		consts.BLOCK_SETTINGS.VIEW.NPV.key
			}
	};
	
	consts.BLOCKS_TIMELINE = {
		VIEW: {
			CHART:		"chart",
			TABLE:		"table"
		}
	};
	
	consts.MANAGE_BLOCK = {
		VIEW: {
			BLOCK:			"block",
			NEW_CHILD:		"newChild",
			EDIT_CHILD:		"editChild",
			CHILDREN_LIST:	"childrenList",
			NEW_LINK:		"newLink",
			EDIT_LINK:		"editLink"
		}
	};
		
		
	consts.SIZES = {
		BLOCK_WIDTH: 350,
		BLOCK_HEIGHT: 185,
		BLOCK_HEIGHT_SMALL: 150,
		BLOCK_PADDING_X: 80,
		BLOCK_PADDING_Y: 90
	};

	return consts;
	
});
