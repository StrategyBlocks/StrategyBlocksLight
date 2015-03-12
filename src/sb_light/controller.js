
define(['sb_light/globals', 'sb_light/utils/ext'], function(sb, E) {
	var controller = {};

	controller.createCompany = function(obj, cb, errCb) {
		var user = E.cherryPick(obj, ["first_name", "last_name", "username"]);
		var company = E.cherryPick(obj, ["company_name", "vision"]);
		company.user = user;
		controller.invoke(sb.urls.REGISTER_COMPANY, company, cb, errCb, sb.state.any);
	};	


	controller.createBuilder = function(args, cb, errCb) {
		controller.invoke(sb.urls.BUILDER_CREATE, args, cb, errCb);
	};
	controller.updateBuilder = function(args, name,  cb, errCb) {
		var func = controller.invoke.bind(controller,sb.urls.BUILDER_UPDATE, args,cb,errCb);
		sb.queue.buffer(func, "controller_update_builder_"+name, 5000, true);
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
	// controller.blockMove = function(id, left, cb) {
	// 	// var vars:Object = { relative_to_id:s.id, parent_id:p.id };
	// 	var pb = sb.queries.
	// 	var args = {id: id, }

	// 	controller.invoke(sb.urls.BLOCKS_MOVE, sb.ext.mixin({id:id}, closeObj), cb,cb);
	// };
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



	controller.metricUpdate = function( changes, cm) {
		controller.invoke(sb.urls.METRICS_UPDATE,changes, cm,cm);
	};



	controller.userUpdate = function( changes, cb) {
		controller.invoke(sb.urls.USERS_UPDATE,changes, cb,cb);
	};
	controller.usersCreate = function( list, cb) {
		controller.invoke(sb.urls.USERS_CREATE_BATCH,list, cb,cb);
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


	controller.updateLevels = function(data, cb,errCb) {
		data = E.map(data, function(v,i) {
			return {
				title:v.title,
				color:E.from_color(v.color)
			}
		});
		controller.invoke(sb.urls.LEVELS_UPDATE, data, cb,errCb);
	};



	controller.updateFocus = function(data, cb,errCb) {
		controller.invoke(sb.urls.FOCUS_UPDATE, data, cb,errCb);
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
	}	




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

