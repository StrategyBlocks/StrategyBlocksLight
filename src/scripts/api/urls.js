

define(['../globals'], function(sb) {
	//console.log("urls", sb.version);
	var _regExprs = {};

	var urls = {
		//******************************API URLS **********************************************/
		MODEL_BLOCKS:		{url: "/blocks.js", 					post:false},
		MODEL_COMPANIES:	{url: "/companies.js", 					post:false},
		MODEL_CAPABILITIES: {url: "/company_settings.js", 			post:false},
		MODEL_EXPORTS: 		{url: "/exports.js", 					post:false},
		MODEL_FOCUS: 		{url: "/focus.js", 						post:false},
		MODEL_GROUPS: 		{url: "/groups.js", 					post:false},
		MODEL_KPIS: 		{url: "/kpis.js", 						post:false},
		MODEL_RISKS: 		{url: "/risks.js", 						post:false},
		MODEL_LEVELS: 		{url: "/levels.js", 					post:false},
		MODEL_NEWS: 		{url: "/news.js", 						post:false},
		MODEL_LICENSES:		{url: "/licenses.js", 					post:false},
		MODEL_PROGRESS:		{url: "/blocks/progress.js", 			post:false},
		MODEL_HEALTH: 		{url: "/health_calculations.js", 		post:false},
		MODEL_NPV: 			{url: "/blocks/npv.js", 				post:false},		
		MODEL_RISK: 		{url: "/blocks/risk.js", 				post:false},		
		MODEL_USERS: 		{url: "/users.js", 						post:false},
		MODEL_TAGS:			{url: "/tags.js", 						post:false},
		MODEL_TIMEZONES: 	{url: "/companies/timezones.js", 		post:false},
		MODEL_DASHBOARD: 	{url: "/reports/dashboard_layout.js", 	post:false},
			
		BLOCKS_CONTEXT:					{url: "/blocks/context/%id%.js"},
		BLOCKS_CLOSE: 					{url: "/blocks/close/%id%.js", deleteId: true},
		BLOCKS_MANAGE_CHILDREN: 		{url: "/blocks/manage_children/%id%.js", deleteId: true},
		BLOCKS_DELETE :					{url: "/blocks/%type%/%id%.js", normalParams:true},
		BLOCKS_DOCUMENTS: 				{url: "/blocks/documents/%id%.js"},
		BLOCKS_IMPORT 	:				{url: "/blocks/import/%id%.js"},
		BLOCKS_INVITE 	:				{url: "/blocks/invite/%id%.js"},
		BLOCKS_MAKE_PUBLIC :			{url: "/blocks/make_public/%id%.js", normalParams:true},
		//BLOCKS_MOVE_POSITION 			{url: "/blocks/move_position_%dir%/%id%.js"},
		BLOCKS_MOVE :					{url: "/blocks/move/%id%.js", normalParams:true},
		BLOCKS_PROPERTIES: 				{url: "/blocks/%type%/%id%.js"},
		BLOCKS_RELOCATE: 				{url: "/blocks/reassign_parent/%id%.js", normalParams:true},
		BLOCKS_UPDATE: 					{url: "/blocks/update/%id%.js", massageParamsFunc: "massageParamsForBlockUpdate"},
		BLOCKS_UNWATCH: 				{url: "/blocks/unwatch/%id%.js"},
		BLOCKS_WATCHING_USERS: 			{url: "/blocks/watching_users/%id%.js"},
		BLOCKS_TAGGED: 					{url: "/blocks_for_tag/%name%.js"},
		BLOCKS_UPDATE_GROUPS :			{url: "/blocks/update_group_expression/%id%.js", normalParams:true},
		BLOCKS_CHANGE_CHARTED_KPI: 		{url: "/blocks/set_default_kpi/%id%.js"},
		BLOCKS_UPDATE_CASHFLOWS: 		{url: "/blocks/update_net_cashflows/%id%.js"},
		BLOCKS_HEALTH :					{url: "/blocks/health.js", normalParams:true},
		BLOCKS_PROGRESS :				{url: "/blocks/progress.js", normalParams:true},
	
		BLOCK_FILES_UPLOAD_URL: 		{url: "/blocks/%id%/documents/create.js"},
		BLOCK_FILES_DOWNLOAD_URL: 		{url: "/blocks/%id%/documents/show/%doc_id%.js"},
		BLOCK_FILES_DELETE: 			{url: "/blocks/%id%/documents/destroy/%doc_id%.js"},
		
		BOOKMARKS:						{url: "/saved_client_states/index.js"},
		BOOKMARK_CREATE_DYNAMIC:		{url: "/saved_client_states/create_dynamic.js"},
		BOOKMARK_SAVE_DYNAMIC:			{url: "/saved_client_states/%id%/save_dynamic.js", normalParams:true},
		BOOKMARK_CREATE:				{url: "/saved_client_states/create.js", normalParams:true},
		BOOKMARK_UPDATE:				{url: "/saved_client_states/%id%/update.js", normalParams:true},
		BOOKMARK_DELETE:				{url: "/saved_client_states/%id%/delete.js"},
				 
		COMMENT_PROPERTIES_ADD: 		{url: "/blocks/%id%/comment.js", normalParams:true, deleteId:true},
		
		
		COMPANIES_CREATE: 				{url: "/companies/create.js"},
		COMPANIES_UPDATE: 				{url: "/companies/update.js"},
		COMPANIES_HEALTH: 				{url: "/health_calculations.js"},
		COMPANIES_HEALTH_CREATE: 		{url: "/health_calculations/create.js"},
		COMPANIES_HEALTH_UPDATE :		{url: "/health_calculations/%id%/update.js"},
		COMPANIES_HEALTH_DELETE: 		{url: "/health_calculations/%id%/destroy.js"},
		COMPANIES_HEALTH_DEFAULT: 		{url: "/health_calculations/%id%/set_default.js"},
		COMPANIES_LOGO_PREVIEW_URL: 		{url: "/upload/company_logo_preview.js"},
		COMPANIES_REMOVE_PREVIEW_LOGO: 	{url: "/upload/remove_company_logo_preview.js"},
		
		
		CAPABILITIES_UPDATE: 			{url: "/company_settings/update.js"},
		
		
		
		EXPORTS_CREATE :			{url: "/exports/%id%/create.js"},
		EXPORTS_REPORT :			{url: "/exports/%id%/create.js"},
		EXPORTS_DELETE :			{url: "/exports/%id%/destroy.js"},
		
		FOCUS_CREATE :				{url: "/focus/create.js"},
		FOCUS_UPDATE: 				{url: "/focus/update/%id%.js", deleteId: true},
		FOCUS_DELETE :				{url: "/focus/destroy/%id%.js", deleteId: true},
		FOCUS_REPARENT :			{url: "/focus/reparent/%id%.js"},
		
		GROUPS_CREATE: 				{url: "/groups/create.js"},
		GROUPS_DELETE :				{url: "/groups/%id%/destroy.js", deleteId: true},
		GROUPS_UPDATE: 				{url: "/groups/%id%/update.js", deleteId: true},
		GROUPS_ADD 	:				{url: "/groups/%id%/add.js"},
		GROUPS_REMOVE :				{url: "/groups/%id%/remove.js"},
	
	
		RISKS_CREATE :				{url: "/risks/create.js"},
		RISKS_DESTROY :				{url: "/risks/%id%/destroy.js"},
		RISKS_UPDATE :				{url: "/risks/%id%/update.js"},
		RISKS_UPDATE_STATUS: 		{url: "/risks/%id%/update_status.js"},
		RISKS_ADD_IMPACT :			{url: "/risks/%id%/add_impact.js"},
		RISKS_REMOVE_IMPACT: 		{url: "/risks/%id%/remove_impact.js"},
		RISKS_ATTACH_DOC: 			{url: "/risks/%id%/attach_document.js"},
		RISKS_SHOW_DOC :			{url: "/risks/%id%/show_document/%doc_id%.js"},
		RISKS_DESTROY_DOC: 			{url: "/risks/%id%/destroy_document.js"},
		RISKS_DUMMY_REFRESH :		{url: "/risks/%id%/refresh_risk.js"},
		RISKS_SETTINGS: 			{url: "/risk_profiles/update_risk_settings.js"},
		RISKS_MATRIX_SIZE :			{url: "/risk_profiles/set_matrix_size.js"},
		RISKS_PROFILES_UPDATE: 		{url: "/risk_profiles/update_batch.js"},
		
		
	
		KPIS_CREATE :				{url: "/kpis/create.js"},
		KPIS_DESTROY: 				{url: "/kpis/%id%/destroy.js"},
		KPIS_UPDATE :				{url: "/kpis/%id%/update.js"},
		KPIS_ATTACH_BLOCK: 			{url: "/kpis/%id%/attach.js"},
		KPIS_DETACH_BLOCK :			{url: "/kpis/%id%/detach.js"},
		
		LEVELS_UPDATE: 				{url: "/levels/update.js"},
		
		MEASURES_BLOCKS: 			{url: "/blocks/measure_values/%id%.js"},
		
		USERS_CREATE :				{url: "/users/create.js"},
		USERS_CREATE_BATCH: 			{url: "/users/create_batch.js"},
		USERS_ADD_GROUP: 			{url: "/users/%id%/add_group.js", normalParams:true},
		USERS_REMOVE_GROUP: 			{url: "/users/%id%/remove_group.js", normalParams:true},
		USERS_ACTIVATE :				{url: "/users/%id%/activate.js"},
		USERS_DEACTIVATE: 			{url: "/users/%id%/deactivate.js"},
		USERS_UPDATE: 				{url: "/users/%id%/update.js", deleteId: true},
		USERS_REMOVE_MEMBERSHIP: 	{url: "/users/%id%/delete_membership.js"},
		USERS_CHANGE_MEMBERSHIP: 	{url: "/users/%id%/update_membership.js", deleteId: true},
		
		USERS_CHANGE_DEFAULT_COMPANY:	{url: "/users/%id%/change_default_company.js", normalParams:true},
		
		REGISTER_COMPANY: 		{url: "/registration/register_company.js"},
		
		LOGIN :						{url: "/login/auth.js"},
		LOGOUT: 					{url: "/login/logout.js"},
		
		//Args:
		//	username: users email address
		LOGIN_FORGOT_PASSWORD: 		{url: "/login/forgot_password.js", normalParams:true},
		
		LOGIN_REMEMBER_ME :			{url: "/login/remember_me.js"},
	
		URL_SAVE_BOOKMARK :			{url: "/users/save_bookmark.js"},
		PAYMENTS :					{url: "/purchases/index.js"},
		PAYMENTS_QUOTE :				{url: "/purchases/quote.js"},
		PAYMENTS_CREATE: 			{url: "/purchases/create.js"},
		
		ADMIN_RAISE: 				{url:"/admin/log_client_error.js"}
	};
	
	
	
	urls.url = function(urlObj, params) {
		if(!urlObj || !urlObj.url) {
			throw new Error("Url does not exist: " + urlObj);
		}
		params = params || {};
		var s = urlObj.url;
		for (var p in params) {
			s = s.replace(_regExpr(p), params[p]);
		}
		if(s.indexOf("%") > -1) {
			throw new Error( "Bad url." + s);
		}
		return sb.state.host + s ; 
	};
	
	var _regExpr = function(s) {
		//build and cache the regexp. There's a small finite number of them, so just cache them when they're created. 
		_regExprs[s] = _regExprs[s] || new RegExp("\%"+s+"\%");
		return _regExprs[s];
	};
	
	urls.massageParamsForBlockUpdate = function(params) {
		delete params.id;
		return params;
	};
	
	//convers a sub-url pattern into an object
	// e.g., blockSettings=blockA!bs_blockB!bp
	// into:
	//	{ blockA: bs, blockB:bp }
	urls.s_to_o = function(s) {
		var res = {};
		s.split("-").reduce(
			function(prev, el) { 
				if(el != "") {
					var parts = el.split("!");
					prev[parts[0]] = parts[1];
					return prev;
				}
			}, 	res
		);
		return res; 
	};

	//The reverse of s_to_o
	urls.o_to_s = function(o) {
		var a = [];
		sb.ext.each(o, function(k,v) {
			a.put([k,v].join("!"));
		})
		return a.join("-");
	};
	
	//converts several types into a url object
	//STRING: key=value;foo=bar
	//ARRAY: [[key,value],[foo,bar]]
	//		[{key:value}, {foo:bar}]
	// OBJECT: returns self.
	urls.url_to_o = function(url) {
		var o = typeof(url) == "string" ? url.split(";") : url;
		o = sb.ext.isArray(o)  ? o : o.reduce(function(prev,el) {
			el = typeof(el) == "string" ? el.split("=") : el;
			if(sb.ext.isArray(el)) {
				prev[el[0]] = el[1];
			} else if (el.key) {
				prev[el.key] = el.value;
			} else {
				throw "URL Cannot be parsed: " + JSON.stringify(url);
			}
			return prev;
		}, {});
		return o;
	};
	
	
	return urls;
});
