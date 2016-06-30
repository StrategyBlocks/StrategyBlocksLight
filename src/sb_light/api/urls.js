/*globals define */

define(['sb_light/globals'], function(sb) {
	'use strict';

	//console.log("urls", sb.version);
	var _regExprs = {};

	var urls = {
		//******************************API URLS **********************************************/
		MODEL_BLOCKS:		{url: "/blocks.js", 					post:false},
		MODEL_COMPANIES:	{url: "/companies.js", 					post:false},
		MODEL_CAPABILITIES: {url: "/company_settings.js", 			post:false},
		MODEL_LIBRARY: 		{url: "/exports.js", 					post:false},
		MODEL_FOCUS: 		{url: "/focus.js", 						post:false},
		MODEL_GROUPS: 		{url: "/groups.js", 					post:false},
		MODEL_METRICS: 		{url: "/metrics.js", 					post:false},
		MODEL_RISKS: 		{url: "/risks.js", 						post:false},
		MODEL_LEVELS: 		{url: "/levels.js", 					post:false},
		MODEL_NEWS: 		{url: "/news.js", 						post:false},
		MODEL_LICENSES:		{url: "/licenses.js", 					post:false},
		MODEL_PROGRESS:		{url: "/blocks/progress.js", 			post:false},
		MODEL_HEALTHS: 		{url: "/health_calculations.js", 		post:false},
		MODEL_MILESTONES: 	{url: "/milestone_definitions.js", 		post:false},
		MODEL_NPV: 			{url: "/blocks/npv.js", 				post:false},		
		MODEL_RISK: 		{url: "/blocks/risk.js", 				post:false},		
		MODEL_USERS: 		{url: "/users.js", 						post:false},
		MODEL_TAGS:			{url: "/tags.js", 						post:false},
		MODEL_TIMEZONES: 	{url: "/companies/timezones.js", 		post:false},
		MODEL_DASHBOARD: 	{url: "/reports/dashboard_layout.js", 	post:false},
		MODEL_HISTORY: 		{url: "/login/history.js", 				post:false},
		MODEL_BUILDERS: 	{url: "/builders.js", 					post:false},
		MODEL_METRICS_EXPRESSIONS: 		{url: "/metrics/calculation_functions.js", 	post:false},
		MODEL_DOCUMENTS: 	{url: "/documents.js", 					post:false},
		MODEL_DASHBOARDS: 	{url: "/dashboards.js", 				post:false},
		MODEL_BOOKMARKS: 	{url: "/saved_client_states/index.js", 	post:false},


			
		BLOCKS_CONTEXT:					{url: "/blocks/context/%id%.js", 				post:false},
		BLOCKS_CLOSE: 					{url: "/blocks/close/%id%.js", 					post:true,		deleteId: true},
		BLOCKS_UNCLOSE:					{url: "/blocks/unclose/%id%.js", deleteId:true},

		BLOCKS_MANAGE_CHILDREN: 		{url: "/blocks/manage_children/%id%.js", 		post:true,		deleteId: true},
		BLOCKS_DELETE :					{url: "/blocks/%type%/%id%.js", 				post:true,		normalParams:true},
		BLOCKS_DOCUMENTS: 				{url: "/blocks/documents/%id%.js",				post:false},
		BLOCKS_IMPORT 	:				{url: "/blocks/import/%id%.js",					post:true, 		deleteId:true, normalParams:true},
		BLOCKS_MAKE_PUBLIC :			{url: "/blocks/make_public/%id%.js", normalParams:true},
		//BLOCKS_MOVE_POSITION 			{url: "/blocks/move_position_%dir%/%id%.js"},
		BLOCKS_MOVE :					{url: "/blocks/move/%id%.js", normalParams:true, deleteId: true},
		BLOCKS_PROPERTIES: 				{url: "/blocks/%type%/%id%.js", normalParams:true, deleteId:true},
		BLOCKS_RELOCATE: 				{url: "/blocks/reassign_parent/%id%.js", normalParams:true, deleteId:true},
		BLOCKS_UPDATE: 					{url: "/blocks/update/%id%.js", 				post:true,		deleteId: true},

		// BLOCKS_WATCHING_USERS: 			{url: "/blocks/watching_users/%id%.js"},
		BLOCKS_TAGGED: 					{url: "/blocks_for_tag/%name%.js"},
		BLOCKS_UPDATE_GROUPS :			{url: "/blocks/update_group_expression/%id%.js", normalParams:true},
		BLOCKS_CHANGE_CHARTED_KPI: 		{url: "/blocks/set_default_kpi/%id%.js"},
		BLOCKS_UPDATE_CASHFLOWS: 		{url: "/blocks/update_net_cashflows/%id%.js"},
		BLOCKS_HEALTH :					{url: "/blocks/health.js", normalParams:true},
		BLOCKS_PROGRESS :				{url: "/blocks/progress.js", normalParams:true},
	
		//singular block for controller convenience
		BLOCK_FILE_ADD: 				{url: "/blocks/%id%/documents/create.js", deleteId:true, post:true},
		BLOCK_FILE_UPDATE: 				{url: "/blocks/%id%/documents/update/%doc_id%.js", deleteId:true, post:true},
		BLOCK_FILE_DOWNLOAD: 			{url: "/blocks/%id%/documents/show/%doc_id%.js"},
		BLOCK_FILE_DELETE: 				{url: "/blocks/%id%/documents/destroy/%doc_id%.js", deleteId:true, post:true},
		BLOCK_INVITE :					{url: "/blocks/%id%/invite.js",					post:true, normalParams:true},
		BLOCK_UNWATCH: 					{url: "/blocks/%id%/unwatch.js",				post:true},
		
		BOOKMARKS:						{url: "/saved_client_states/index.js"},
		BOOKMARK_CREATE_DYNAMIC:		{url: "/saved_client_states/create_dynamic.js"},
		BOOKMARK_SAVE_DYNAMIC:			{url: "/saved_client_states/%id%/save_dynamic.js", normalParams:true},
		BOOKMARK_CREATE:				{url: "/saved_client_states/create.js", normalParams:true},
		BOOKMARK_UPDATE:				{url: "/saved_client_states/%id%/update.js", normalParams:true, deleteId:true},
		BOOKMARK_DELETE:				{url: "/saved_client_states/%id%/delete.js", deleteId:true},
				 
		COMMENT_PROPERTIES_ADD: 		{url: "/blocks/%id%/comment.js", normalParams:true, deleteId:true},
		COMMENT_PROPERTIES_REMOVE:		{url: "/blocks/%id%/delete_comment.js", normalParams:true, deleteId:true},
		
		// COMPANIES_CREATE: 				{url: "/companies/create.js"},
		COMPANIES_REGISTER: 			{url: "/companies/create.js"},
		COMPANIES_UPDATE: 				{url: "/companies/update.js"},
		COMPANIES_UPLOAD_LOGO: 			{url: "/companies/logo_upload.js"},

		COMPANIES_HEALTH: 				{url: "/health_calculations.js"},
		COMPANIES_HEALTH_CREATE: 		{url: "/health_calculations/create.js"},
		COMPANIES_HEALTH_UPDATE :		{url: "/health_calculations/%id%/update.js", deleteId:true},
		COMPANIES_HEALTH_DELETE: 		{url: "/health_calculations/%id%/destroy.js"},
		COMPANIES_HEALTH_DEFAULT: 		{url: "/health_calculations/%id%/set_default.js"},

		// COMPANIES BROADCASR
		COMPANIES_BROADCAST: 			{ url: "/companies/broadcast_message.js", post:true },
		COMPANIES_CONTACT: 				{ url: "/companies/send_message_to_admins.js", post:true },

		//DEP///////////////////
		COMPANIES_LOGO_PREVIEW_URL: 	{url: "/upload/company_logo_preview.js"},
		COMPANIES_REMOVE_PREVIEW_LOGO: 	{url: "/upload/remove_company_logo_preview.js"},
		///////////////////


		COMPANIES_MILESTONE_CREATE: 	{url: "/milestone_definitions/create.js"},
		COMPANIES_MILESTONE_UPDATE :	{url: "/milestone_definitions/%id%/update.js", deleteId:true},
		COMPANIES_MILESTONE_DELETE: 	{url: "/milestone_definitions/%id%/destroy.js", deleteId:true},
		
		
		CAPABILITIES_UPDATE: 			{url: "/company_settings/update.js"},
		
		DASHBOARD_CREATE :				{url: "/dashboards/create.js", post:true},
		DASHBOARD_UPDATE :				{url: "/dashboards/%id%/update.js", deleteId:true, post:true},
		DASHBOARD_DESTROY :				{url: "/dashboards/%id%/destroy.js", deleteId:true, post:true},
		DASHBOARD_SHARE :				{url: "/dashboards/%id%/share.js",  deleteId:true, post:true, normalParams:true},
		
		EXPORTS_CREATE :			{url: "/exports/%id%/create.js", deleteId:true, post:true},
		EXPORTS_REPORT :			{url: "/exports/%id%/create.js", deleteId:true, post:true},
		EXPORTS_UPDATE :			{url: "/exports/update/%id%.js", deleteId:true, post:true},
		EXPORTS_DOWNLOAD :			{url: "/exports/download.js"},
		EXPORTS_DELETE :			{url: "/exports/%id%/destroy.js", deleteId:true, normalParams:true},
		
		FOCUS_CREATE :				{url: "/focus/create.js"},
		FOCUS_UPDATE: 				{url: "/focus/update/%id%.js", deleteId: true},
		FOCUS_UPDATE_ALL: 			{url: "/focus/update_from_array.js"},
		FOCUS_DELETE :				{url: "/focus/destroy/%id%.js", deleteId: true},
		FOCUS_REPARENT :			{url: "/focus/reparent/%id%.js"},
		
		GROUPS_CREATE: 				{url: "/groups/create.js", 				post:true},
		GROUPS_DELETE :				{url: "/groups/%id%/destroy.js", deleteId: true},
		GROUPS_UPDATE: 				{url: "/groups/%id%/update.js", deleteId: true},
		GROUPS_ADD 	:				{url: "/groups/%id%/add.js"},
		GROUPS_REMOVE :				{url: "/groups/%id%/remove.js"},
	
	
		//type: IMAGE  : pdf
		//email: true|FALSE
		HTML_REPORT:				{url: "/html/generate_report.js", post:true,normalParams:true},

		RISKS_CREATE :				{url: "/risks/create.js"},
		RISKS_DESTROY :				{url: "/risks/%id%/destroy.js"},
		RISKS_UPDATE :				{url: "/risks/%id%/update.js"},
		RISKS_UPDATE_STATUS: 		{url: "/risks/%id%/update_status.js", post:true, deleteId:true},
		RISKS_ADD_IMPACT :			{url: "/risks/%id%/add_impact.js", deleteId:true, normalParams:true},
		RISKS_REMOVE_IMPACT: 		{url: "/risks/%id%/remove_impact.js", deleteId:true, normalParams:true},



		//singular risk for controller convenience
		RISK_FILE_ADD: 				{url: "/risks/%id%/attach_document.js", deleteId:true, post:true},
		RISK_FILE_UPDATE:			{url: "/risks/%id%/update_document/%doc_id%.js", deleteId:true, post:true},
		RISK_FILE_DOWNLOAD:			{url: "/risks/%id%/show_document/%doc_id%.js"},
		RISK_FILE_DELETE: 			{url: "/risks/%id%/destroy_document.js", deleteId:true, post:true},
		RISK_INVITE :				{url: "/risks/invite/%id%.js",		post:true, normalParams:true},
		RISK_UNWATCH: 				{url: "/risks/unwatch/%id%.js",		post:true},
		
		RISKS_DUMMY_REFRESH :		{url: "/risks/%id%/refresh_risk.js"},
		RISKS_UPDATE_GROUPS:  		{url: "/risks/%id%/update_group_expression.js", deleteId:true, normalParams:true },
		RISKS_NEWS: 				{url: "/risks/%id%/news.js", deleteId:true},
		
		RISKS_SETTINGS: 			{url: "/risk_profiles/update_risk_settings.js"},
		RISKS_MATRIX_SIZE :			{url: "/risk_profiles/set_matrix_size.js"},
		RISKS_PROFILES_UPDATE: 		{url: "/risk_profiles/update_batch.js"},

		RISKS_COMMENTS:				{url: "/risks/%id%/comments.js", deleteId:true},
		RISKS_COMMENT_ADD:			{url: "/risks/%id%/comment.js", deleteId:true, normalParams:true},
		RISKS_COMMENT_REMOVE:		{url: "/risks/%id%/delete_comment.js", deleteId:true, normalParams:true},

		
		METRICS_CREATE:  			{url: "/metrics/create.js"},
		METRICS_DESTROY:  			{url: "/metrics/%id%/destroy.js", deleteId:true},
		METRICS_UPDATE:  			{url: "/metrics/%id%/update.js", deleteId:true},
		METRICS_ATTACH_BLOCK:  		{url: "/blocks/attach_metric/%id%.js", normalParams:true, deleteId:true },
		METRICS_DETACH_BLOCK:  		{url: "/blocks/detach_metric/%id%.js", normalParams:true, deleteId: true },
		METRICS_UPDATE_GROUPS:  	{url: "/metrics/%id%/update_group_expression.js" , deleteId:true, normalParams:true},
		METRICS_DOWNLOAD:  			{url: "/metrics.csv" },
		METRICS_HIERARCHY:			{url: "/metrics/hierarchy_values/%id%.js", deleteId:true, normalParams:true},
		METRICS_NEWS: 				{url: "/metrics/%id%/news.js", deleteId:true},


		METRICS_COMMENTS:			{url: "/metrics/%id%/comments.js", deleteId:true},
		METRICS_COMMENT_ADD:		{url: "/metrics/%id%/comment.js", deleteId:true, normalParams:true},
		METRICS_COMMENT_REMOVE:		{url: "/metrics/%id%/delete_comment.js", deleteId:true, normalParams:true},


		METRIC_FILE_ADD: 			{url: "/metrics/%id%/attach_document.js", deleteId:true, post:true},
		METRIC_FILE_UPDATE:			{url: "/metrics/%id%/update_document/%doc_id%.js", deleteId:true, post:true},
		METRIC_FILE_DOWNLOAD:		{url: "/metrics/%id%/show_document/%doc_id%.js"},
		METRIC_FILE_DELETE: 		{url: "/metrics/%id%/destroy_document.js", deleteId:true, post:true},
		METRIC_INVITE :				{url: "/metrics/invite/%id%.js",		post:true, normalParams:true},
		METRIC_UNWATCH: 			{url: "/metrics/unwatch/%id%.js",		post:true},

		
		LEVELS_UPDATE: 				{url: "/levels/update.js"},
		
		MEASURES_BLOCKS: 			{url: "/blocks/measure_values/%id%.js"},
		
		USERS_CREATE :				{url: "/users/create.js"},
		USERS_CREATE_BATCH: 		{url: "/users/create_batch.js"},
		USERS_ADD_GROUP: 			{url: "/users/%id%/add_group.js", normalParams:true},
		USERS_REMOVE_GROUP: 		{url: "/users/%id%/remove_group.js", normalParams:true},
		USERS_ACTIVATE :			{url: "/users/%id%/activate.js"},
		USERS_DEACTIVATE: 			{url: "/users/%id%/deactivate.js"},
		USERS_UPDATE: 				{url: "/users/%id%/update.js", deleteId: true},
		USERS_REASSIGN: 			{url: "/users/reassign_ownership.js?"},
		USERS_DELETE: 				{url: "/users/%id%/delete_user.js", deleteId:true},		
		USERS_REMOVE_MEMBERSHIP: 	{url: "/users/%id%/delete_membership.js"},
		USERS_CHANGE_MEMBERSHIP: 	{url: "/users/%id%/update_membership.js", deleteId: true},
		USERS_CALENDAR_TOKEN:		{url: "/users/enable_todo_calendar.js"},
		USERS_SEND_REPORT:			{url: "/users/send_report.js"},
		USERS_DOWNLOAD_SQLITE:		{url: "/exports/sqlite.db"},

		USERS_UPLOAD_LOGO: 			{url: "/users/logo_upload.js"},
		USERS_REMOVE_LOGO: 			{url: "/users/remove_logo.js"},

		
		USERS_CHANGE_DEFAULT_COMPANY:	{url: "/users/%id%/change_default_company.js", normalParams:true},
		
		REGISTER_COMPANY: 			{url: "/registration/register.js"},
		REGISTER_INDUSTRIES: 		{url: "/registration/industries.js"},

		
		LOGIN :						{url: "/login/auth.js"},
		LOGOUT: 					{url: "/login/logout.js"},
		
		//Args:
		//	username: users email address
		LOGIN_FORGOT_PASSWORD: 		{url: "/login/forgot_password.js", normalParams:true},
		
		LOGIN_REMEMBER_ME :			{url: "/login/remember_me.js"},
	
		URL_SAVE_BOOKMARK :			{url: "/users/save_bookmark.js"},
		PAYMENTS :					{url: "/purchases/index.js"},
		PAYMENTS_QUOTE :			{url: "/purchases/quote.js"},
		PAYMENTS_CREATE: 			{url: "/purchases/create.js"},
		
		ADMIN_RAISE: 				{url:"/admin/log_client_error.js"},
		ADMIN_SUPPORT:				{ url:"/admin/log_support.js", post:true},

		SSO_REFRESH: 				{ url:"/sso/refresh.js" },
		SSO_GOOGLE_REDIRECT: 		{ url:"/sso/google_sso_login_redirect.js?html=true" },
		SSO_SALESFORCE_REDIRECT: 	{ url:"/sso/salesforce_sso_login_redirect.html?html=true" },
		SSO_GOOGLE_FILES: 			{ url:"/sso/google_drive_files.js", normalParams:true },


		//BUILDER 
		BUILDER_TEMPLATE:			{url: "/builders/template.js",							post:false},
		BUILDER_CREATE:				{url: "/builders/create.js",							post:true},
		BUILDER_LICENSE:			{url: "/builders/check_license.js",						post:false},
		BUILDER_UPDATE:				{url: "/builders/%id%/update.js",						post:true, deleteId:true},
		BUILDER_DESTROY:			{url: "/builders/%id%/destroy.js",						post:true, deleteId:true},


		//admintool urls
		ADMIN_AUDITS:				{url: "/admin/audits.js", 								post:false, normalParams:true, company:"admin_company_id", user:"admin_user_id"},					
		ADMIN_BACKUP_COMPANY:		{url: "/admin/backup_company/%id%.js", 					post:true, deleteId: true},					
		ADMIN_BACKUPS:				{url: "/admin/backups.js", 								post:false},					
		ADMIN_BACKUPS_COMPANY:		{url: "/admin/backups/%id%.js", 						post:false, deleteId: true},					
		ADMIN_BLOCK_DETAILS:		{url: "/admin/block/%id%.js", 							post:false, deleteId: true},
		ADMIN_CLONE:				{url: "/admin/clone_company.js",						post:true},
		ADMIN_COMPANIES:			{url: "/admin/companies.js", 							post:false},
		ADMIN_COMPANY_DETAILS:		{url: "/admin/company/%id%.js", 						post:false, deleteId:true},
		ADMIN_DELETE_COMPANY:		{url: "/admin/delete_company/%id%.js", 					post:true, deleteId: true},					
		ADMIN_EXTEND_TRIAL:			{url: "/admin/extend_trial/%id%.js", 					post:true, deleteId: true, normalParams:true},					
		
		
		ADMIN_CACHE_SERVER:			{url: "/admin/clear_cache.js", 							post:true, normalParams:true},
		ADMIN_CACHE_COMPANY:		{url: "/admin/clear_cache_for_company.js", 				post:true, normalParams:true},
		ADMIN_CACHE_BLOCKS:			{url: "/admin/clear_block_cache.js", 					post:true, normalParams:true},
		ADMIN_CACHE_METRICS:		{url: "/admin/clear_kpi_cache.js", 						post:true, normalParams:true},
		ADMIN_CACHE_REGOS:			{url: "/admin/clear_rego_tokens_cache.js", 				post:true, normalParams:true},
		ADMIN_CACHE_SESSIONS:		{url: "/admin/clear_session_cache.js", 					post:true, normalParams:true},
		

		ADMIN_BUILDER_USERS:		{url: "/admin/builder_users.js", 						post:false},					
		ADMIN_HTML5_USERS:			{url: "/admin/html5_users.js", 							post:false},					
		ADMIN_ENABLE_BUILDER:		{url: "/admin/enable_builder.js", 						post:true, deleteId: true, normalParams:true},					
		ADMIN_DISABLE_BUILDER:		{url: "/admin/disable_builder.js", 						post:true, deleteId: true, normalParams:true},					
		ADMIN_ENABLE_HTML5:			{url: "/admin/enable_html5.js", 						post:true, deleteId: true, normalParams:true},					
		ADMIN_DISABLE_HTML5:		{url: "/admin/disable_html5.js", 						post:true, deleteId: true, normalParams:true},					
		ADMIN_INVOICES:				{url: "/admin/invoices/%id%.js", 						post:false, deleteId: true},
		ADMIN_INVOICE_QUOTE:		{url: "/admin/quote_invoice.js", 						post:false, deleteId: false},
		ADMIN_INVOICE_CREATE:		{url: "/admin/create_invoice.js", 						post:true, deleteId: false},
		ADMIN_INVOICE_DELETE:		{url: "/admin/delete_invoice/%id%.js", 					post:true, deleteId: true},
		ADMIN_INVOICE_UPDATE:		{url: "/admin/update_invoice.js", 						post:true, deleteId: false},
		ADMIN_INVOICE_SENT:			{url: "/admin/mark_invoice_as_sent.js", 				post:true, deleteId: false, normalParams:true},
		ADMIN_INVOICE_PAID:			{url: "/admin/mark_invoice_as_paid.js", 				post:true, deleteId: false, normalParams:true},
		ADMIN_LICENSES:				{url: "/admin/license_companies.js", 					post:false, normalParams:true},
		ADMIN_LICENSE_SUSPEND:		{url: "/admin/suspend_company/%id%.js", 				post:false, normalParams:true, deleteId:true},
		ADMIN_LOGINS:				{url: "/admin/latest_login_attempts.js", 				post:false, normalParams:true, company:"admin_company_id", user:"admin_user_id"},
		ADMIN_LOGINS_UNKNOWN:		{url: "/admin/latest_unknown_user_login_attempts.js", 	post:false, normalParams:true},
		ADMIN_PUBLISH_DEMO:			{url: "/admin/publish_demo/%id%.js", 					post:true, deleteId: true},
		ADMIN_PURCHASES:			{url: "/admin/purchases/%id%.js", 						post:false, deleteId: true},
		ADMIN_RANDOMIZE:			{url: "/admin/randomize_progress_values/%id%.js", 		post:false, normalParams:true, deleteId:true},
		ADMIN_RANDOMIZE_HISTORY:	{url: "/admin/randomize_progress_history/%id%.js",		post:false, normalParams:true, deleteId:true},
		ADMIN_RECALC_HEALTH:		{url: "/admin/recalculate_health/%id%.js", 				post:false, normalParams:true, deleteId:true},
		ADMIN_REGOS:				{url: "/admin/rego_tokens.js", 							post:false, normalParams:true},
		ADMIN_REPORTS:				{url: "/admin/report.csv", 								post:false, normalParams:true, dataType:"text"},
		ADMIN_REQUESTS:				{url: "/admin/current_requests.js", 					post:false, normalParams:true, company:"admin_company_id", user:"admin_user_id"},
		ADMIN_RESET_PASSWORD:		{url: "/admin/generate_new_password.js", 				post:true, normalParams:true},
		ADMIN_SESSIONS:				{url: "/admin/current_sessions.js", 					post:false, normalParams:true},
		ADMIN_SETTINGS:				{url: "/admin/settings.js", 							post:false},
		ADMIN_SETTINGS_CHANGE:		{url: "/admin/change_settings.js", 						post:true, normalParams:true},
		ADMIN_SHIFT_BLOCKS:			{url: "/admin/shift_company_strategy_dates/%id%.js", 	post:true, normalParams:true, deleteId:true},
		ADMIN_SHIFT_KPIS:			{url: "/admin/shift_company_kpi_dates/%id%.js", 		post:true, normalParams:true, deleteId:true},
		//generic - TBD
		ADMIN_POST:					{														post:true, normalParams:true},
		ADMIN_USERS:				{url: "/admin/users/%admin_company_id%.js", 			post:false, normalParams:true, company:"admin_company_id"},
		ADMIN_USER_EMAILS:			{url: "/admin/emails.js", 								post:false, normalParams:true},
		ADMIN_ZERO_PROGRESS:		{url: "/admin/companies_with_no_progress_closed_leaf_blocks.js", 	post:false, normalParams:true},


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
	
	// urls.massageParamsForBlockUpdate = function(params) {
	// 	delete params.id;
	// 	return params;
	// };
	
	//convers a sub-url pattern into an object
	// e.g., blockSettings=blockA!bs-blockB!bp
	// into:
	//	{ blockA: bs, blockB:bp }
	urls.s_to_o = function(s) {
		return !s ? {} : s.split("-").reduce(function(prev, el) { 
			//shorthand way of setting a property and returning it on one line
			return !el ? prev : sb.ext.set.apply(Object, ([prev]).concat(el.split("!")));
		}, 	{});
	};

	//The reverse of s_to_o
	urls.o_to_s = function(o) {
		return sb.ext.map(o, function(v,k) {
			return [k,v].join("!");
		}).join("-");
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
	

	//turn an object into url params
	urls.o_to_params = function(obj) {
		return sb.ext.map(obj, function(v,k){
			return k + "=" + encodeURIComponent(v);
		}).join("&");
	};
	
	return urls;
});
