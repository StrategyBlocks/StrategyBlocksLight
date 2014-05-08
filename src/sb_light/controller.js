
define(['sb_light/globals'], function(sb) {

	var controller = {};

	controller.forgotPassword =  function(email,cb,errCb) {
		controller.invoke(sb.urls.LOGIN_FORGOT_PASSWORD, {username:email}, cb,errCb, sb.state.invalid);
	};

	controller.blockUpdate = function( changes, cb) {
		controller.invoke(sb.urls.BLOCKS_UPDATE,changes, cb,cb);
	};
	controller.blockClose = function(id, closeObj, cb) {
		//{"rating":[0-5], "comment":String}
		controller.invoke(sb.urls.BLOCKS_CLOSE, sb.ext.mixin({id:id}, closeObj), cb,cb);
	};
	controller.blockPublish = function(id, children, cb) {
		//children:bool
		controller.invoke(sb.urls.BLOCKS_MAKE_PUBLIC, {id:id, children:children}, cb,cb);
	};
	controller.userUpdate = function( changes, cb) {
		controller.invoke(sb.urls.USERS_UPDATE,changes, cb,cb);
	};
	controller.usersCreate = function( list, cb) {
		controller.invoke(sb.urls.USERS_CREATE_BATCH,list, cb,cb);
	};
	
	controller.blockComment = function(id, message, cb) {
		controller.invoke(sb.urls.COMMENT_PROPERTIES_ADD, {id:id, body:message}, cb,cb);
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
		controller.invoke(sb.urls.LEVELS_UPDATE, data, cb,errCb);
	};
	controller.updateFocus = function(data, cb,errCb) {
		controller.invoke(sb.urls.FOCUS_UPDATE, data, cb,errCb);
	};
	
	controller.invoke = function(urlObj, args, successCb, errorCb, stateCheck) {
		var url = sb.urls.url(urlObj, args);
		var params = {};
		
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
		sb.api.request(url, params, post, successCb, errorCb, stateCheck||null);
	};
	
	
	
	return controller;
});

