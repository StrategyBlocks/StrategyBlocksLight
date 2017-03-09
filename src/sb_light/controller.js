

/*globals define */

define(['sb_light/globals', 'sb_light/utils/ext'], function(sb, E) {
	"use strict";
	var controller = {};

	controller.createCompany = function(obj, cb, errCb) {
		var user = E.cherryPick(obj, ["first_name", "last_name", "username"]);
		var company = E.cherryPick(obj, ["company_name", "vision", "industry"]);
		company.user = user;
		controller.invoke(sb.urls.REGISTER_COMPANY, company, cb, errCb, sb.state.any);
	};	

	controller.updateCompany = function(obj, cb) {
		controller.invoke(sb.urls.COMPANIES_UPDATE, obj, cb, cb);
	};
	controller.companyBroadcast = function(o, cb) {
		controller.invoke(sb.urls.COMPANIES_BROADCAST, o, cb, cb);
	};
	controller.companyContact = function(o, cb) {
		controller.invoke(sb.urls.COMPANIES_CONTACT, o, cb, cb);
	};

	controller.createBuilder = function(args, cb, errCb) {
		controller.invoke(sb.urls.BUILDER_CREATE, args, cb, errCb);
	};
	controller.updateBuilder = function(args, cb, errCb) {
		controller.invoke(sb.urls.BUILDER_UPDATE, args, cb, errCb);
	};
	controller.deleteBuilder = function(args, cb, errCb) {
		controller.invoke(sb.urls.BUILDER_DESTROY, args, cb, errCb);
	};



	controller.createBookmark = function(o, cb) {
		controller.invoke(sb.urls.BOOKMARK_CREATE, o, cb,cb);
	};

	controller.updateBookmark = function(o, cb) {
		controller.invoke(sb.urls.BOOKMARK_UPDATE, o, cb,cb);
	};
	controller.deleteBookmark = function(id, cb) {
		controller.invoke(sb.urls.BOOKMARK_DELETE, {id:id}, cb,cb);
	};



	controller.forgotPassword =  function(email,cb,errCb) {
		controller.invoke(sb.urls.LOGIN_FORGOT_PASSWORD, {username:email}, cb,errCb, sb.state.invalid);
	};



	controller.blockUpdate = function( changes, cb) {
		controller.invoke(sb.urls.BLOCKS_UPDATE,changes, cb,cb);
	};
	controller.blockManageChildren = function( changes, cb) {
		controller.invoke(sb.urls.BLOCKS_MANAGE_CHILDREN,changes, cb,cb);
	};

	controller.blockClone = function( list, cb) {
		controller.invoke(sb.urls.BLOCKS_CLONE,list, cb,cb);
	};

	controller.blockClose = function(o, cb) {
		//{"rating":[0-5], "comment":String}
		controller.invoke(sb.urls.BLOCKS_CLOSE, o, cb,cb);
	};
	controller.blockUnclose = function(id, cb) {
		//{"rating":[0-5], "comment":String}
		controller.invoke(sb.urls.BLOCKS_UNCLOSE, {id:id}, cb,cb);
	};
	controller.blockMove = function(args, cb) {
		controller.invoke(sb.urls.BLOCKS_MOVE, args, cb,cb);
	};
	controller.blockMoveRight = function(id, closeObj, cb) {
		//{"rating":[0-5], "comment":String}
		controller.invoke(sb.urls.BLOCKS_CLOSE, sb.ext.mixin({id:id}, closeObj), cb,cb);
	};
	controller.blockPublish = function(id, children, cb) {
		//children:bool
		//"recurse" is expected by server... 
		controller.invoke(sb.urls.BLOCKS_MAKE_PUBLIC, {id:id, recurse:children}, cb,cb);
	};
	controller.blockImport = function(o, cb) {
		controller.invoke(sb.urls.BLOCKS_IMPORT, o, cb,cb);
	};
	controller.blockExport = function(o, cb) {
		controller.invoke(sb.urls.EXPORTS_CREATE, o, cb,cb);
	};

	controller.blockUpdateTags = function(id, tags, cb) {
		var o = {id:id, type:"tags"};
		o["tag[list]"] = tags.join(" ");
		controller.invoke(sb.urls.BLOCKS_PROPERTIES, o, cb,cb, null, {post:true});
	};



	controller.comment = function(type, id, message, cb) {
		var url = type == "block" ?  sb.urls.COMMENT_PROPERTIES_ADD : (
			type == "metric" ? sb.urls.METRICS_COMMENT_ADD : sb.urls.RISKS_COMMENT_ADD
		);

		controller.invoke(url, {id:id, body:message}, cb,cb);
	};
	controller.commentDelete = function(type, id, cid, cb) {
		var url = type == "block" ?  sb.urls.COMMENT_PROPERTIES_REMOVE : (
			type == "metric" ? sb.urls.METRICS_COMMENT_REMOVE : sb.urls.RISKS_COMMENT_REMOVE
		);

		controller.invoke(url, {id:id, comment_id:cid}, cb,cb);
	};

	controller.blockUpdateGroups = function(id, groups, cb) {
		controller.invoke(sb.urls.BLOCKS_UPDATE_GROUPS, {id:id, expression:groups}, cb, cb);
	};

	controller.blockDelete = function(args, cb) {
		args.type = "delete"; //legacy url format requires this.
		controller.invoke(sb.urls.BLOCKS_DELETE, args, cb,cb );
	};

	controller.blockRelocate = function(args, cb) {
		//id: block_id
		//parent_id: new parentm
		//start_date/end_date server date strings for the new block
		controller.invoke(sb.urls.BLOCKS_RELOCATE, args, cb, cb);
	};
	controller.blocksInvite = function(modelType, args, cb) {
		var url = sb.urls[modelType.toUpperCase()+"_INVITE"];
		controller.invoke(url, args, cb, cb);
	};
	controller.blocksUnwatch = function(modelType, args, cb) {
		var url = sb.urls[modelType.toUpperCase()+"_UNWATCH"];
		controller.invoke(url, args, cb, cb);
	};

	controller.metricUpdate = function( changes, cb) {
		controller.invoke(sb.urls.METRICS_UPDATE,changes, cb,cb);
	};
	controller.metricCreate = function( changes, cb) {
		controller.invoke(sb.urls.METRICS_CREATE,changes, cb,cb);
	};
	controller.metricDelete = function( id, cb) {
		controller.invoke(sb.urls.METRICS_DESTROY,{id:id}, cb,cb);
	};
	controller.metricAttach = function( list, bid, cb) {
		controller.invoke(sb.urls.METRICS_ATTACH_BLOCK,{id:bid, "metric_ids":String(list)}, cb,cb);
	};
	controller.metricDetach = function( mid, bid, cb) {
		controller.invoke(sb.urls.METRICS_DETACH_BLOCK,{id:bid, "metric_id":mid}, cb,cb);
	};
	controller.metricDownload = function( o,  cb) {
		controller.invoke(sb.urls.METRICS_DOWNLOAD,o, cb,cb, null, {dataType:"text"});
	};
	controller.metricHierarchy = function( mid, nid, cb, errCb) {
		var o  = {id:mid};
		if(nid) {
			o.node_ids = nid;
		}
		controller.invoke(sb.urls.METRICS_HIERARCHY,o, cb,errCb);
	};
	controller.metricUpdateGroups = function(id, groups, cb) {
		var changes = {id:id, group_expression:groups};
		controller.invoke(sb.urls.METRICS_UPDATE,changes, cb,cb);
		// controller.invoke(sb.urls.METRICS_UPDATE_GROUPS, {id:id, expression:groups}, cb, cb);
	};

	controller.riskCreate = function( changes, cb) {
		controller.invoke(sb.urls.RISKS_CREATE,changes, cb,cb);
	};
	controller.riskUpdate = function( changes, cb) {
		controller.invoke(sb.urls.RISKS_UPDATE,changes, cb,cb);
	};
	controller.riskDelete = function( id, cb) {
		controller.invoke(sb.urls.RISKS_DESTROY,{id:id}, cb,cb);
	};
	controller.riskUpdateStatus = function( changes, cb) {
		controller.invoke(sb.urls.RISKS_UPDATE_STATUS,changes, cb,cb);
	};
	controller.riskUpdateGroups = function(id, groups, cb) {
		controller.invoke(sb.urls.RISKS_UPDATE_GROUPS, {id:id, expression:groups}, cb, cb);
	};
	controller.riskAddImpact = function(rid, bid, cb) {
		controller.invoke(sb.urls.RISKS_ADD_IMPACT, {id:rid, strategy_item_id:bid}, cb,cb);
	}
	controller.riskRemoveImpact = function(rid, bid, cb) {
		controller.invoke(sb.urls.RISKS_REMOVE_IMPACT, {id:rid, strategy_item_id:bid}, cb,cb);
	}


	controller.riskMatrixSizeUpdate = function(size, cb) {
		var args = {size:size};
		if(size == 3) { 
			args.impact_map = [2,2];
			args.likelihood_map = [2,2];
		}
		controller.invoke(sb.urls.RISKS_MATRIX_SIZE, args, cb, cb);

	};
	controller.riskMatrixProfileUpdate = function(data, cb) {
		controller.invoke(sb.urls.RISKS_PROFILES_UPDATE, data, cb, cb);

	};
	controller.riskMatrixSettingsUpdate = function(data, cb) {
		controller.invoke(sb.urls.RISKS_SETTINGS, data, cb, cb);

	};


	controller.userUpdate = function( changes, cb) {
		controller.invoke(sb.urls.USERS_UPDATE,changes, cb,cb);
	};
	controller.usersCreate = function( list, cb) {
		controller.invoke(sb.urls.USERS_CREATE_BATCH,list, cb,cb);
	};
	controller.usersSendReport = function( o, cb) {
		controller.invoke(sb.urls.USERS_SEND_REPORT,o, cb,cb);
	};
	controller.userGenerateCalendar = function(cb) {
		controller.invoke(sb.urls.USERS_CALENDAR_TOKEN, null, cb,cb);
	}

	controller.exportDelete = function(id, cb) {
		controller.invoke(sb.urls.EXPORTS_DELETE,{id:id}, cb,cb);
	};
	controller.exportUpdate = function(o, cb) {
		controller.invoke(sb.urls.EXPORTS_UPDATE,o, cb,cb);
	};



	controller.dashboardsUpdate = function(o, cb) {
		if(o.id === "new") {
			delete o.id; 
			controller.invoke(sb.urls.DASHBOARD_CREATE, o, cb,cb);
		} else {
			controller.invoke(sb.urls.DASHBOARD_UPDATE, o, cb,cb);
		}
	};
	controller.dashboardsDelete = function(id, cb) {
		controller.invoke(sb.urls.DASHBOARD_DESTROY, {id:id}, cb, cb);
	};	
	controller.dashboardShare = function(o, cb) {
		controller.invoke(sb.urls.DASHBOARD_SHARE, o, cb, cb);
	}


	controller.groupsUpdate = function(o, cb) {
		if(o.id === "new") {
			delete o.id; 
			controller.invoke(sb.urls.GROUPS_CREATE, o, cb,cb);
		} else {
			controller.invoke(sb.urls.GROUPS_UPDATE, o, cb,cb);
		}
	};
	controller.groupsDelete = function(id, cb) {
		controller.invoke(sb.urls.GROUPS_DELETE, {id:id}, cb, cb);
	};
	
	controller.changeDefaultCompany = function(id,cb, errCb) {
		controller.invoke(sb.urls.USERS_CHANGE_DEFAULT_COMPANY, {id:sb.state.state("user_id"),default_company_id:id}, cb,errCb);
	};
	controller.changeCompanyMembership = function(changes, cb, errCb) {
		controller.invoke(sb.urls.USERS_CHANGE_MEMBERSHIP, changes, cb, errCb||cb);
	};
	controller.toggleUserGroup = function(id, groupId, selected, cb, errCb) {
		if(selected) {
			controller.invoke(sb.urls.USERS_ADD_GROUP, {id:id, group_id:groupId}, cb,errCb);
		} else {
			controller.invoke(sb.urls.USERS_REMOVE_GROUP, {id:id, group_id:groupId}, cb,errCb);
		}
	};

	controller.updateCapabilities = function(o, cb) {
		controller.invoke(sb.urls.CAPABILITIES_UPDATE, o, cb,cb);
	};


	controller.updateLevels = function(data, cb) {
		data = E.map(data, function(v) {
			return {
				title:v.title,
				color:E.from_color(v.color)
			};
		});
		controller.invoke(sb.urls.LEVELS_UPDATE, data, cb, cb);
	};



	controller.updateFocusAreaList = function(list, cb) {
		controller.invoke(sb.urls.FOCUS_UPDATE_ALL, list, cb,cb);
	};
	controller.updateFocusArea = function(data, cb) {
		if(data.id === "new") {
			delete data.id;
			controller.invoke(sb.urls.FOCUS_CREATE, data, cb,cb);
		} else {
			controller.invoke(sb.urls.FOCUS_UPDATE, data, cb,cb);
		}
	};

	controller.deleteFocusArea = function(id, cb) {
		controller.invoke(sb.urls.FOCUS_DELETE, {id:id}, cb,cb);
	};
	

	controller.updateHealthCalculation = function(data, cb, errorCb) {
		if(E.isStr(data)) {
			controller.invoke(sb.urls.COMPANIES_HEALTH_DEFAULT, {id:data}, cb,errorCb);
		} else if(data.id == "new") {
			delete data.id;
			controller.invoke(sb.urls.COMPANIES_HEALTH_CREATE, data,cb,errorCb);
		} else {
			controller.invoke(sb.urls.COMPANIES_HEALTH_UPDATE, data,cb,errorCb);
		}
	};	
	controller.deleteHealthCalculation = function(id, cb, errorCb) {
		controller.invoke(sb.urls.COMPANIES_HEALTH_DELETE, {id:id},cb,errorCb);
	};	

	controller.updateMilestoneDefinition = function(data, cb) {
		if(data.id == "new") {
			delete data.id;
			controller.invoke(sb.urls.COMPANIES_MILESTONE_CREATE, data,cb,cb);
		} else {
			controller.invoke(sb.urls.COMPANIES_MILESTONE_UPDATE, data,cb,cb);
		}
	};	

	controller.deleteMilestoneDefinition = function(id, cb) {
		controller.invoke(sb.urls.COMPANIES_MILESTONE_DELETE, {id:id},cb,cb);
	};	

	controller.uploadFile = function(file, object, object_type, cb) {
		var url;
		if(file.doc_id) {
			//UPDATE
			url = sb.urls[object_type.toUpperCase() + "_FILE_UPDATE"];
			controller.invoke(url, E.merge(file, {id:object.id}), 	cb, cb);

		} else {
			//ADD
			url = sb.urls[object_type.toUpperCase() + "_FILE_ADD"];
			controller.invoke(url, E.merge(file, {id:object.id}), 	cb, cb);
		}
	};

	controller.downloadFile = function(oid, fid, object_type) {
		var urlObj = sb.urls[object_type.toUpperCase() + "_FILE_DOWNLOAD"];
		var url = sb.urls.url(urlObj, {id:oid, doc_id:fid});

		// var frame = d3.select("body iframe.downloadHack");
		// if(frame.empty) {
		// 	frame = d3.select("body").append("iframe").class("downloadHack");
		// }
		// frame.attr("src", url);

		window.open(url);

		// controller.invoke(url, {id:oid, doc_id:fid});
	};

	controller.deleteFile = function(file, object_type, cb) {
		var url = sb.urls[object_type.toUpperCase() + "_FILE_DELETE"];
		controller.invoke(url, file, cb, cb);
	};

	controller.ssoGoogleLogin = function() {
		window.open(sb.urls.SSO_GOOGLE_REDIRECT.url, "_blank");
	};
	controller.ssoSalesforceLogin = function() {
		window.open(sb.urls.SSO_SALESFORCE_REDIRECT.url, "_blank");
	};
	controller.ssoGoogleRegoLogin = function() {
		window.open(sb.urls.SSO_GOOGLE_REGO_REDIRECT.url, "_blank");
	};
	controller.ssoSalesforceRegoLogin = function() {
		window.open(sb.urls.SSO_SALESFORCE_REGO_REDIRECT.url, "_blank");
	};
	controller.ssoGoogleBuilderLogin = function() {
		window.open(sb.urls.SSO_GOOGLE_BUILDER_REDIRECT.url, "_blank");
	};
	controller.ssoSalesforceBuilderLogin = function() {
		window.open(sb.urls.SSO_SALESFORCE_BUILDER_REDIRECT.url, "_blank");
	};

	controller.ssoRefresh = function(cb) {
		controller.invoke(sb.urls.SSO_REFRESH, null, cb,cb);	
	};
	controller.ssoGoogleSearch = function(str, cb) {
		controller.invoke(sb.urls.SSO_GOOGLE_FILES, {query:str}, cb,cb);	
	};


	controller.adminPublishDemo = function(cid,cb) {
		controller.invoke(sb.urls.ADMIN_PUBLISH_DEMO, {id:cid}, cb,cb);	
	};



	controller.fetch = function(urlObj, args, successCb, errorCb, stateCheck, overrides) {
		args = args || {};
		if(urlObj.company) {
			var c = sb.state.context("selectedCompany");
			if(c) {
				args[urlObj.company] = c;
			}
		}
		if(urlObj.user) {
			var u = sb.state.context("selectedUser");
			if(u) {
				args[urlObj.user] = u;
			}
		} 
		controller.invoke(urlObj, args, successCb, errorCb,stateCheck,overrides);
	};

	/*****
	* urlObj: a constant url from sb.urls
	* args: arguments for the request (e.g. form items)
	* successCB / errorCB : callbacks on response
	* stateCheck: prevents making the request unless we're in a specific sb.state like "authorized" (default)
	* overrides: placeholder for extra options to override the default ajax settings (like passing "text" instead of "json" for csv data)
	********************/
	controller.invoke = function(urlObj, args, successCb, errorCb, stateCheck, overrides) {
		var url = sb.urls.url(urlObj, args);
		var params = {};
		overrides = sb.ext.merge({}, overrides);
		
		if (urlObj.deleteId) {
			delete args.id;
		}
		
		var requestArgs = urlObj.massageParamsFunc ? sb.urls[urlObj.massageParamsFunc](args) : args;
		
		if (requestArgs != null) {
			if (requestArgs instanceof Array) {
				params.json = JSON.stringify(requestArgs);
			}
			else if (Object.keys(requestArgs).length > 0) {
				if (urlObj.normalParams) {
					params = requestArgs;
				}
				else {
					params.json = JSON.stringify(requestArgs);
				}
			}
		}
		var post = (urlObj.post !== undefined && urlObj.post) || overrides.post || false;
		delete overrides.post;

		
		if(urlObj.dataType) {
			overrides.dataType = urlObj.dataType;
		}

		sb.api.request(url, params, post, successCb, errorCb, stateCheck||null, overrides);
	};

	
	
	return controller;
});

