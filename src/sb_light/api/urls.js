/*globals define */

define(['sb_light/globals', "sb_light/utils/ext"], function(sb, E) {
	'use strict';

	//console.log("urls", sb.version);
	var _regExprs = {};

	var urls = {
		//******************************API URLS **********************************************/
		MODEL_BLOCKS:				{url: "/blocks.js", 					post:false},
		MODEL_COMPANIES:			{url: "/companies.js", 					post:false},
		MODEL_CAPABILITIES: 		{url: "/company_settings.js", 			post:false},
		MODEL_LIBRARY: 				{url: "/exports.js", 					post:false},
		MODEL_FOCUS: 				{url: "/focus.js", 						post:false},
		MODEL_GROUPS: 				{url: "/groups.js", 					post:false},
		MODEL_METRICS: 				{url: "/metrics.js", 					post:false},
		MODEL_RISKS: 				{url: "/risks.js", 						post:false},
		MODEL_LEVELS: 				{url: "/levels.js", 					post:false},
		MODEL_NEWS: 				{url: "/news.js", 						post:false},
		MODEL_HEALTHS: 				{url: "/health_calculations.js", 		post:false},
		MODEL_MILESTONES: 			{url: "/milestone_definitions.js", 		post:false},
		MODEL_USERS: 				{url: "/users.js", 						post:false},
		MODEL_TAGS:					{url: "/tags.js", 						post:false},
		MODEL_TIMEZONES: 			{url: "/companies/timezones.js", 		post:false},
		MODEL_HISTORY: 				{url: "/login/history.js", 				post:false},
		MODEL_BUILDERS: 			{url: "/builders.js", 					post:false},
		MODEL_METRICS_EXPRESSIONS: 	{url: "/metrics/calculation_functions.js", 	post:false},
		MODEL_DOCUMENTS: 			{url: "/documents.js", 					post:false},
		MODEL_DASHBOARDS: 			{url: "/dashboards.js", 				post:false},
		MODEL_BOOKMARKS: 			{url: "/saved_client_states.js", 		post:false},
		MODEL_CUSTOM_FIELDS:		{url: "/custom_fields/index.js", 		post:false},	


			
		BLOCKS_CLOSE: 					{url: "/blocks/%id%/close.js", 					post:true},
		BLOCKS_UNCLOSE:					{url: "/blocks/%id%/unclose.js", 				post:true},

		BLOCKS_MANAGE_CHILDREN: 		{url: "/blocks/%id%/manage_children.js", 		post:true},
		BLOCKS_DELETE :					{url: "/blocks/%id%/delete.js", 				post:true,		normalParams:true},
		BLOCKS_DOCUMENTS: 				{url: "/blocks/%id%/documents.js",				post:false},
		BLOCKS_IMPORT 	:				{url: "/blocks/%id%/import.js",					post:true, 		normalParams:true},
		BLOCKS_MAKE_PUBLIC :			{url: "/blocks/%id%/make_public.js", 			post:true, 		normalParams:true},
		BLOCKS_MOVE :					{url: "/blocks/%id%/move.js", 					post:true,		normalParams:true},
		BLOCKS_PROPERTIES: 				{url: "/blocks/%id%/%type%.js", 				post:false,		normalParams:true},
		BLOCKS_RELOCATE: 				{url: "/blocks/%id%/reassign_parent.js", 		post:true, 		normalParams:true},
		BLOCKS_UPDATE: 					{url: "/blocks/%id%/update.js", 				post:true},
		BLOCKS_ADD_DEPENDENCY:			{url: "/blocks/%id%/add_dependency.js", post:true, normalParams:true},
		BLOCKS_REMOVE_DEPENDENCY:		{url: "/blocks/%id%/remove_dependency.js", post:true, normalParams:true},

		BLOCKS_UPDATE_GROUPS :			{url: "/blocks/%id%/update_group_expression.js", normalParams:true, post:true},
		BLOCKS_HEALTH :					{url: "/blocks/health.js", normalParams:true},
		BLOCKS_PROGRESS :				{url: "/blocks/progress.js", normalParams:true},
		BLOCKS_EXTRA_INFO :				{url: "/blocks/extra_info.js", normalParams:true},
		BLOCKS_CLONE :					{url: "/blocks/clone_blocks.js", normalParams:true, post:true},
		BLOCKS_LOCK:					{url: "/blocks/admin_lock.js", post:true, normalParams:true},
		BLOCKS_UNLOCK:					{url: "/blocks/admin_unlock.js", post:true, normalParams:true},
		BLOCKS_EMAIL_REPORT:			{url: "/blocks/%id%/generate_report.js", post:true},
		BLOCKS_DOWNLOAD_HTML:			{url: "/blocks/%id%/generate_report.html", post:false, normalParams: true	},
		BLOCKS_DOWNLOAD_CSV:			{url: "/blocks/%id%/generate_report.csv", post:false, normalParams: true	},

	
		//singular block for controller convenience
		BLOCK_FILE_ADD: 				{url: "/blocks/%id%/documents/create.js", post:true},
		BLOCK_FILE_UPDATE: 				{url: "/blocks/%id%/documents/%doc_id%/update.js", post:true},
		BLOCK_FILE_DOWNLOAD: 			{url: "/blocks/%id%/documents/%doc_id%/show.js"},
		BLOCK_FILE_DELETE: 				{url: "/blocks/%id%/documents/%doc_id%/destroy.js", post:true},
		BLOCK_INVITE :					{url: "/blocks/%id%/invite.js",					post:true, normalParams:true},
		BLOCK_UNWATCH: 					{url: "/blocks/%id%/unwatch.js",				post:true},
		
		BLOCK_ATTACH_METRIC: 	 		{url: "/blocks/%id%/attach_metric.js", normalParams:true, post: true },
		BLOCK_DETACH_METRIC:  			{url: "/blocks/%id%/detach_metric.js", normalParams:true, post: true },


		BOOKMARK_CREATE:				{url: "/saved_client_states/create.js", normalParams:true, post:true},
		BOOKMARK_UPDATE:				{url: "/saved_client_states/%id%/update.js", normalParams:true, post:true},
		BOOKMARK_DELETE:				{url: "/saved_client_states/%id%/delete.js", post:true},
				 
		COMMENT_PROPERTIES_ADD: 		{url: "/blocks/%id%/comment.js", normalParams:true, post:true},
		COMMENT_PROPERTIES_REMOVE:		{url: "/blocks/%id%/delete_comment.js", normalParams:true, post:true},
		
		COMPANIES_UPDATE: 				{url: "/companies/update.js", post:true},
		COMPANIES_UPLOAD_LOGO: 			{url: "/companies/logo_upload.js", post:true},
		COMPANIES_REMOVE_LOGO: 			{url: "/companies/logo_remove.js", post:true},

		COMPANIES_HEALTH_CREATE: 		{url: "/health_calculations/create.js", post:true},
		COMPANIES_HEALTH_UPDATE :		{url: "/health_calculations/%id%/update.js", post:true},
		COMPANIES_HEALTH_DELETE: 		{url: "/health_calculations/%id%/destroy.js", post:true},
		COMPANIES_HEALTH_DEFAULT: 		{url: "/health_calculations/%id%/set_default.js", post:true},

		// COMPANIES BROADCASR
		COMPANIES_BROADCAST: 			{ url: "/companies/broadcast_message.js", post:true },
		COMPANIES_CONTACT: 				{ url: "/companies/send_message_to_admins.js", post:true },


		COMPANIES_MILESTONE_CREATE: 	{url: "/milestone_definitions/create.js", post:true},
		COMPANIES_MILESTONE_UPDATE :	{url: "/milestone_definitions/%id%/update.js", post:true},
		COMPANIES_MILESTONE_DELETE: 	{url: "/milestone_definitions/%id%/destroy.js", post:true},
		

		CUSTOM_FIELD_CREATE:			{url: "/custom_fields/create.js", post:true},
		CUSTOM_FIELD_UPDATE:			{url: "/custom_fields/%id%/update.js", post:true},
		CUSTOM_FIELD_DESTROY:			{url: "/custom_fields/%id%/delete.js", post:true, normalParams:true},


		
		CAPABILITIES_UPDATE: 			{url: "/company_settings/update.js", post:true},
		
		DASHBOARD_CREATE :				{url: "/dashboards/create.js", post:true},
		DASHBOARD_UPDATE :				{url: "/dashboards/%id%/update.js", post:true},
		DASHBOARD_DESTROY :				{url: "/dashboards/%id%/destroy.js", post:true},
		DASHBOARD_SHARE :				{url: "/dashboards/%id%/share.js", post:true, normalParams:true},
		
		EXPORTS_CREATE :			{url: "/exports/%id%/create.js", post:true},
		EXPORTS_UPDATE :			{url: "/exports/%id%/update.js", post:true},
		EXPORTS_DOWNLOAD :			{url: "/exports/download.js"},
		EXPORTS_DELETE :			{url: "/exports/%id%/destroy.js", normalParams:true, post:true},
		
		FOCUS_CREATE :				{url: "/focus/create.js", post:true},
		FOCUS_UPDATE: 				{url: "/focus/%id%/update.js", post:true},
		FOCUS_UPDATE_ALL: 			{url: "/focus/update_from_array.js", post:true},
		FOCUS_DELETE :				{url: "/focus/%id%/destroy.js", post:true},
		
		GROUPS_CREATE: 				{url: "/groups/create.js", 				post:true},
		GROUPS_DELETE :				{url: "/groups/%id%/destroy.js", post:true},
		GROUPS_UPDATE: 				{url: "/groups/%id%/update.js", post:true},
		GROUPS_ADD 	:				{url: "/groups/%id%/add.js", post:true},
		GROUPS_REMOVE :				{url: "/groups/%id%/remove.js", post:true},
	
		REPORT_BRIEFING_BOOK:		{url: "/reports/briefing_book.js", post:true},
		REPORT_DOWNLOAD:			{url: "/reports/download.html", post:false},
	
		RISKS_CREATE :				{url: "/risks/create.js", post:true},
		RISKS_DESTROY :				{url: "/risks/%id%/destroy.js", post:true},
		RISKS_UPDATE :				{url: "/risks/%id%/update.js", post:true},
		RISKS_UPDATE_STATUS: 		{url: "/risks/%id%/update_status.js", post:true},
		RISKS_ADD_IMPACT :			{url: "/risks/%id%/add_impact.js", normalParams:true, post:true},
		RISKS_REMOVE_IMPACT: 		{url: "/risks/%id%/remove_impact.js", normalParams:true, post:true},



		//singular risk for controller convenience
		RISK_FILE_ADD: 				{url: "/risks/%id%/attach_document.js", post:true},
		RISK_FILE_UPDATE:			{url: "/risks/%id%/update_document/%doc_id%.js", post:true},
		RISK_FILE_DOWNLOAD:			{url: "/risks/%id%/show_document/%doc_id%.js"},
		RISK_FILE_DELETE: 			{url: "/risks/%id%/destroy_document/%doc_id%.js", post:true},
		RISK_INVITE :				{url: "/risks/%id%/invite.js",		post:true, normalParams:true},
		RISK_UNWATCH: 				{url: "/risks/%id%/unwatch.js",		post:true},
		
		RISKS_UPDATE_GROUPS:  		{url: "/risks/%id%/update_group_expression.js", normalParams:true, post:true },
		RISKS_NEWS: 				{url: "/risks/%id%/news.js"},
		
		RISKS_SETTINGS: 			{url: "/risk_profiles/update_risk_settings.js", post:true},
		RISKS_MATRIX_SIZE :			{url: "/risk_profiles/set_matrix_size.js", post:true},
		RISKS_PROFILES_UPDATE: 		{url: "/risk_profiles/update_batch.js", post:true},

		RISKS_COMMENTS:				{url: "/risks/%id%/comments.js"},
		RISKS_COMMENT_ADD:			{url: "/risks/%id%/comment.js", normalParams:true, post:true},
		RISKS_COMMENT_REMOVE:		{url: "/risks/%id%/delete_comment.js", normalParams:true, post:true},

		
		METRICS_CREATE:  			{url: "/metrics/create.js", post:true},
		METRICS_DESTROY:  			{url: "/metrics/%id%/destroy.js", post:true},
		METRICS_UPDATE:  			{url: "/metrics/%id%/update.js", post:true},
		METRICS_UPDATE_GROUPS:  	{url: "/metrics/%id%/update_group_expression.js" , normalParams:true},
		METRICS_DOWNLOAD:  			{url: "/metrics.csv" },
		METRICS_HIERARCHY:			{url: "/metrics/%id%/hierarchy_values.js", normalParams:true},
		METRICS_NEWS: 				{url: "/metrics/%id%/news.js"},
		METRICS_LOCK:				{url: "/metrics/admin_lock.js", post:true, normalParams:true },
		METRICS_UNLOCK:				{url: "/metrics/admin_unlock.js", post:true, normalParams:true },


		METRICS_COMMENTS:			{url: "/metrics/%id%/comments.js"},
		METRICS_COMMENT_ADD:		{url: "/metrics/%id%/comment.js", normalParams:true, post:true},
		METRICS_COMMENT_REMOVE:		{url: "/metrics/%id%/delete_comment.js", normalParams:true, post:true},


		METRIC_FILE_ADD: 			{url: "/metrics/%id%/attach_document.js", post:true},
		METRIC_FILE_UPDATE:			{url: "/metrics/%id%/update_document/%doc_id%.js", post:true},
		METRIC_FILE_DOWNLOAD:		{url: "/metrics/%id%/show_document/%doc_id%.js"},
		METRIC_FILE_DELETE: 		{url: "/metrics/%id%/destroy_document/%doc_id%.js", post:true},
		METRIC_INVITE :				{url: "/metrics/%id%/invite.js",		post:true, normalParams:true},
		METRIC_UNWATCH: 			{url: "/metrics/%id%/unwatch.js",		post:true},

		
		LEVELS_UPDATE: 				{url: "/levels/update.js", post:true},
		
		USERS_CREATE :				{url: "/users/create.js", post:true},
		USERS_CREATE_BATCH: 		{url: "/users/create_batch.js", post:true},
		USERS_ADD_GROUP: 			{url: "/users/%id%/add_group.js", normalParams:true, post:true},
		USERS_REMOVE_GROUP: 		{url: "/users/%id%/remove_group.js", normalParams:true, post:true},
		USERS_ACTIVATE :			{url: "/users/%id%/activate.js", post:true},
		USERS_DEACTIVATE: 			{url: "/users/%id%/deactivate.js", post:true},
		USERS_UPDATE: 				{url: "/users/%id%/update.js", post:true},
		USERS_REASSIGN: 			{url: "/users/reassign_ownership.js?", post:true},
		USERS_DELETE: 				{url: "/users/%id%/delete_user.js", post:true},		
		USERS_CHANGE_MEMBERSHIP: 	{url: "/users/%id%/update_membership.js", post:true},
		USERS_CALENDAR_TOKEN:		{url: "/users/enable_todo_calendar.js", post:true},
		USERS_EMAIL_REPORT:			{url: "/users/generate_report.js", post:true},
		USERS_DOWNLOAD_HTML:		{url: "/users/generate_report.html", post:false, normalParams: true	},
		USERS_DOWNLOAD_CSV:			{url: "/users/generate_report.csv", post:false, normalParams: true	},
		USERS_CHECK_REPORT:			{url: "/users/check_report.js", post:false},
		USERS_DOWNLOAD_SQLITE:		{url: "/exports/sqlite.db", post:false},

		USERS_UPLOAD_LOGO: 			{url: "/users/logo_upload.js", post:true},
		USERS_REMOVE_LOGO: 			{url: "/users/remove_logo.js", post:true},

		
		USERS_CHANGE_DEFAULT_COMPANY:	{url: "/users/%id%/change_default_company.js", normalParams:true, post:true},
		
		REGISTER_COMPANY: 			{url: "/registration/register.js", post:true},
		REGISTER_INDUSTRIES: 		{url: "/registration/industries.js", post:false},

		
		LOGIN :						{url: "/login/auth.js"},
		LOGOUT: 					{url: "/login/logout.js"},
		//To check if there is a valid session without resetting the session expiry time:
		VALID_SESSION:				{url: "/login/valid_session.js"},
		
		//Args:
		//	username: users email address
		LOGIN_FORGOT_PASSWORD: 		{url: "/login/forgot_password.js", normalParams:true, post: true},
		
		LOGIN_REMEMBER_ME :			{url: "/login/remember_me.js"},
	
		PAYMENTS :					{url: "/purchases.js", post:false},
		PAYMENTS_QUOTE :			{url: "/purchases/quote.js", post:false},
		PAYMENTS_CREATE: 			{url: "/purchases/create.js", post:true},
		
		ADMIN_RAISE: 				{url:"/admin/log_client_error.js", post:true},
		ADMIN_SUPPORT:				{ url:"/admin/log_support.js", post:true},

		SSO_REFRESH: 				{ url:"/sso/refresh.js" },
		SSO_GOOGLE_REDIRECT: 		{ url:"/sso/google_sso_login_redirect.js?html=true" },
		SSO_SALESFORCE_REDIRECT: 	{ url:"/sso/salesforce_sso_login_redirect.html?html=true" },

		SSO_GOOGLE_REGO_REDIRECT: 			{ url:"/sso/google_sso_login_redirect.js?html=true&registration=true" },
		SSO_SALESFORCE_REGO_REDIRECT: 		{ url:"/sso/salesforce_sso_login_redirect.html?html=true&registration=true" },

		SSO_GOOGLE_BUILDER_REDIRECT: 		{ url:"/sso/google_sso_login_redirect.js?html=true&builder=true" },
		SSO_SALESFORCE_BUILDER_REDIRECT: 	{ url:"/sso/salesforce_sso_login_redirect.html?html=true&builder=true" },
		
		SSO_GOOGLE_FILES: 			{ url:"/sso/google_drive_files.js", normalParams:true },


		//BUILDER 
		BUILDER_TEMPLATE:			{url: "/builders/template.js",							post:false},
		BUILDER_CREATE:				{url: "/builders/create.js",							post:true},
		BUILDER_LICENSE:			{url: "/builders/check_license.js",						post:false},
		BUILDER_UPDATE:				{url: "/builders/%id%/update.js",						post:true},
		BUILDER_DESTROY:			{url: "/builders/%id%/destroy.js",						post:true},


		//admintool urls
		ADMIN_AUDITS:				{url: "/admin/audits.js", 								post:false, normalParams:true, company:"admin_company_id", user:"admin_user_id"},					
		ADMIN_BACKUP_COMPANY:		{url: "/admin/backup_company/%id%.js", 					post:true},					
		ADMIN_BACKUPS:				{url: "/admin/backups.js", 								post:false},					
		ADMIN_BACKUPS_COMPANY:		{url: "/admin/backups/%id%.js", 						post:false},					
		ADMIN_CLONE:				{url: "/admin/clone_company.js",						post:true},
		ADMIN_COMPANIES:			{url: "/admin/companies.js", 							post:false},
		ADMIN_COMPANY_DETAILS:		{url: "/admin/company/%id%.js", 						post:false},
		ADMIN_DELETE_COMPANY:		{url: "/admin/delete_company/%id%.js", 					post:true},					
		ADMIN_DELETE_PROGRESS:		{url: "/admin/delete_historic_progress/%id%.js", 		post:true, normalParams:true},					
		ADMIN_EXTEND_TRIAL:			{url: "/admin/extend_trial/%id%.js", 					post:true, normalParams:true},					
		
		
		ADMIN_CACHE_SERVER:			{url: "/admin/clear_cache.js", 							post:true, normalParams:true},
		ADMIN_CACHE_COMPANY:		{url: "/admin/clear_cache_for_company.js", 				post:true, normalParams:true},
		ADMIN_CACHE_BLOCKS:			{url: "/admin/clear_block_cache.js", 					post:true, normalParams:true},
		ADMIN_CACHE_METRICS:		{url: "/admin/clear_metric_cache.js", 					post:true, normalParams:true},
		ADMIN_CACHE_REGOS:			{url: "/admin/clear_rego_tokens_cache.js", 				post:true, normalParams:true},
		ADMIN_CACHE_SESSIONS:		{url: "/admin/clear_session_cache.js", 					post:true, normalParams:true},
		
		ADMIN_INVOICES:				{url: "/admin/invoices/%id%.js", 						post:false},
		ADMIN_INVOICE_QUOTE:		{url: "/admin/quote_invoice.js", 						post:false},
		ADMIN_INVOICE_CREATE:		{url: "/admin/create_invoice.js", 						post:true},
		ADMIN_INVOICE_DELETE:		{url: "/admin/delete_invoice/%id%.js", 					post:true},
		ADMIN_INVOICE_UPDATE:		{url: "/admin/update_invoice.js", 						post:true},
		ADMIN_INVOICE_SENT:			{url: "/admin/mark_invoice_as_sent.js", 				post:true, normalParams:true},
		ADMIN_INVOICE_PAID:			{url: "/admin/mark_invoice_as_paid.js", 				post:true, normalParams:true},
		ADMIN_LICENSES:				{url: "/admin/license_companies.js", 					post:false, normalParams:true},
		ADMIN_LICENSE_SUSPEND:		{url: "/admin/suspend_company/%id%.js", 				post:true, normalParams:true},
		ADMIN_LOGINS:				{url: "/admin/latest_login_attempts.js", 				post:false, normalParams:true, company:"admin_company_id", user:"admin_user_id"},
		ADMIN_LOGINS_UNKNOWN:		{url: "/admin/latest_unknown_user_login_attempts.js", 	post:false, normalParams:true},
		ADMIN_PUBLISH_DEMO:			{url: "/admin/publish_demo/%id%.js", 					post:true},
		ADMIN_RANDOMIZE:			{url: "/admin/randomize_progress_values/%id%.js", 		post:true, normalParams:true},
		ADMIN_RANDOMIZE_HISTORY:	{url: "/admin/randomize_progress_history/%id%.js",		post:true, normalParams:true},
		ADMIN_RECENT_ACTIVITY:		{url: "/admin/recent_activity.js", 						post:false, normalParams:true},
		ADMIN_REGOS:				{url: "/admin/rego_tokens.js", 							post:false, normalParams:true},
		ADMIN_REPORTS:				{url: "/admin/report.csv", 								post:false, normalParams:true, dataType:"text"},
		ADMIN_REGISTER_COMPANY:		{url: "/admin/register_company.js", 					post:true},
		ADMIN_REQUESTS:				{url: "/admin/current_requests.js", 					post:false, normalParams:true, company:"admin_company_id", user:"admin_user_id"},
		ADMIN_RESET_PASSWORD:		{url: "/admin/generate_new_password.js", 				post:true, normalParams:true},
		ADMIN_SESSIONS:				{url: "/admin/current_sessions.js", 					post:false, normalParams:true},
		ADMIN_SETTINGS:				{url: "/admin/settings.js", 							post:false},
		ADMIN_SETTINGS_CHANGE:		{url: "/admin/change_settings.js", 						post:true, normalParams:true},
		ADMIN_SHIFT_BLOCKS:			{url: "/admin/shift_company_strategy_dates/%id%.js", 	post:true, normalParams:true},
		ADMIN_SHIFT_METRICS:		{url: "/admin/shift_company_metric_dates/%id%.js", 		post:true, normalParams:true},
		//generic - TBD
		ADMIN_POST:					{														post:true, normalParams:true},
		ADMIN_USERS:				{url: "/admin/users/%admin_company_id%.js", 			post:false, normalParams:true, company:"admin_company_id"},
		ADMIN_USER_EMAILS:			{url: "/admin/emails.js", 								post:false, normalParams:true}


	};
	
	
	
	urls.url = function(urlObj, params) {
		if(!urlObj || !urlObj.url) {
			throw new Error("Url does not exist: " + urlObj);
		}
		params = params || {};
		var deleteParams = []; 
		var s = urlObj.url;
		for (var p in params) {
			var before = s;
			s = s.replace(_regExpr(p), params[p]);
			if (s != before) {
				deleteParams.push(p);
			}
		}
		E.each(deleteParams, function(p) { delete params[p]; } );

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
