
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

	controller.createBuilder = function(args, cb, errCb) {
		controller.invoke(sb.urls.BUILDER_CREATE, args, cb, errCb);
	};
	controller.updateBuilder = function(args, cb, errCb) {
		controller.invoke(sb.urls.BUILDER_UPDATE, args, cb, errCb);
	};
	controller.deleteBuilder = function(args, cb, errCb) {
		controller.invoke(sb.urls.BUILDER_DESTROY, args, cb, errCb);
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
	controller.blockClose = function(id, closeObj, cb) {
		//{"rating":[0-5], "comment":String}
		controller.invoke(sb.urls.BLOCKS_CLOSE, sb.ext.mixin({id:id}, closeObj), cb,cb);
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
		controller.invoke(sb.urls.BLOCKS_MAKE_PUBLIC, {id:id, children:children}, cb,cb);
	};


	controller.blockComment = function(id, message, cb) {
		controller.invoke(sb.urls.COMMENT_PROPERTIES_ADD, {id:id, body:message}, cb,cb);
	};
	controller.blockCommentDelete = function(id, cid, cb) {
		controller.invoke(sb.urls.COMMENT_PROPERTIES_REMOVE, {id:id, comment_id:cid}, cb,cb);
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
	controller.metricAttach = function( mid, bid, cb) {
		controller.invoke(sb.urls.METRICS_ATTACH_BLOCK,{id:bid, "metric_id":mid}, cb,cb);
	};
	controller.metricDetach = function( mid, bid, cb) {
		controller.invoke(sb.urls.METRICS_DETACH_BLOCK,{id:bid, "metric_id":mid}, cb,cb);
	};
	controller.metricHierarchy = function( mid, nid, cb) {
		controller.invoke(sb.urls.METRICS_HIERARCHY,{id:mid, "node_ids":nid}, cb,cb);
	};
	controller.metricUpdateGroups = function(id, groups, cb) {
		var changes = {id:id, group_expression:groups};
		controller.invoke(sb.urls.METRICS_UPDATE,changes, cb,cb);
		// controller.invoke(sb.urls.METRICS_UPDATE_GROUPS, {id:id, expression:groups}, cb, cb);
	};

	controller.riskUpdate = function( changes, cm) {
		controller.invoke(sb.urls.RISKS_UPDATE,changes, cm,cm);
	};
	controller.riskUpdateGroups = function(id, groups, cb) {
		controller.invoke(sb.urls.RISKS_UPDATE_GROUPS, {id:id, expression:groups}, cb, cb);
	};

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

	controller.dashboardsUpdate = function(o, cb) {
		if(o.id === "new") {
			delete o.id; 
			controller.invoke(sb.urls.DASHBOARD_CREATE, o, cb,cb);
		} else {
			controller.invoke(sb.urls.DASHBOARD_UPDATE, o, cb,cb);
		}
	};
	controller.dashboardsDelete = function(id, cb) {
		controller.invoke(sb.urls.DASHBOARD_DESTROY, {id:id}, cb);
	};	


	controller.dashboardPrint = function(data, cb) {
		controller.invoke(sb.urls.HTML_REPORT, data, cb);
	};


	controller.groupsUpdate = function(o, cb) {
		if(o.id === "new") {
			delete o.id; 
			controller.invoke(sb.urls.GROUPS_CREATE, o, cb,cb);
		} else {
			controller.invoke(sb.urls.GROUPS_UPDATE, o, cb,cb);
		}
	};
	controller.groupsDelete = function(id, cb) {
		controller.invoke(sb.urls.GROUPS_DELETE, {id:id}, cb);
	};
	
	controller.changeDefaultCompany = function(id,cb, errCb) {
		controller.invoke(sb.urls.USERS_CHANGE_DEFAULT_COMPANY, {id:sb.state.state("user_id"),default_company_id:id}, cb,errCb);
	};
	controller.changeCompanyMembership = function(changes, cb, errCb) {
		controller.invoke(sb.urls.USERS_CHANGE_MEMBERSHIP, changes, cb,errCb);
	};
	controller.toggleUserGroup = function(id, groupId, selected, cb, errCb) {
		if(selected) {
			controller.invoke(sb.urls.USERS_ADD_GROUP, {id:id, group_id:groupId}, cb,errCb);
		} else {
			controller.invoke(sb.urls.USERS_REMOVE_GROUP, {id:id, group_id:groupId}, cb,errCb);
		}
	};


	controller.updateLevels = function(data, cb) {
		data = E.map(data, function(v) {
			return {
				title:v.title,
				color:E.from_color(v.color)
			};
		});
		controller.invoke(sb.urls.LEVELS_UPDATE, data, cb);
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

	controller.updateMilestoneDefinition = function(data, cb, errorCb) {
		if(data.id == "new") {
			delete data.id;
			controller.invoke(sb.urls.COMPANIES_MILESTONE_CREATE, data,cb,errorCb);
		} else {
			controller.invoke(sb.urls.COMPANIES_MILESTONE_UPDATE, data,cb,errorCb);
		}
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
		var post = (urlObj.post !== undefined && urlObj.post) || false;

		
		if(urlObj.dataType) {
			overrides.dataType = urlObj.dataType;
		}

		sb.api.request(url, params, post, successCb, errorCb, stateCheck||null, overrides);
	};

	
	
	return controller;
});

