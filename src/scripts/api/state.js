
define(['../globals'], function(sb) {
	console.log("State:",sb.version);
	var state = {
		session_unknown: 0,
		session_normal: 1,
		session_payment:  2,
		session_invalid: 3,
		session_disconnected: 4	
	};
		

	var _state = {
		page:"",
		block:null,		//normally block path
		news:null,		//news item id		
		kpi:null,		//kpi  id		
		risk:null,		//risk id		
		tag:null,		//tag id		

		userId:null,
		companyId:null,
		company: null,
		user: null,
		
		session: 0,
		url:"",

		
		childBlock:null,		
		
		blockTreeZoom:1,
		blockMapZoom:1,
		blockSettingsView: "",
		blockSettingsCollapse: "",
		blocksTreeView: "progress",
		blocksMapView: "radial",
		blocksTimelineView: "chart",
		manageBlockView: "block",
				
				
		previousBlock:null,
		previousPage:null
	};
	
	
	var _forceUpdateBuffer = {};
	var _forceUpdateBusy = {};
	var _stateFunctions = {};
	
	//the url definition. The order of the url parts will be consistent with this list.
	var _urlParts = ["page", "block", "childBlock", "blocksTreeView","blocksMapView","blocksTimelineView","manageBlockView"]; 
	
	
	state.host = "";
	state.models = {};
	state.subscriptions = {};
	
	state.session = state.session_unknown;
	
		
	//accepts several value types specified by: sb.urls.url_to_o
	//RETURNS: The string form of the url.
	state.url = function(value) {
		//update the url
		if(value !== undefined) { 
			value = typeof value == "string" ? sb.url.url_to_o(value) : value;
			sb.ext.each(value, function(k, v) {
				state.value(k,v, false);
			});
			state.publish("url");
		}
	
		return "#"+_urlParts.reduce(function(prev, el) {
			val = state.value(el);
			if(val !== null && val !== undefined) {
				return prev.put([el, state.value(el)].join("="));
			} 
			return prev;
		}, []).join(";");
	};
	
	state.register = function(model, urlDef, cb) {
		if(!state.models[model.name]) {
			state.models[model.name] = {timestamp:0, cb:cb, urlDef:urlDef};
			if(state.authorized() && !_forceUpdateBuffer && !_forceUpdateBuffer[model.name]) {
				//if we do a bunch of these at the same time, only run the first. The others will get picked up.
				_forceUpdateBuffer[model.name] = _forceModelUpdate.bindDelay(state, 200, model);
			}
		} 
	};
	
	state.resetTimestamp = function(name) {
		if(state.models[name]) {
			state.models[name].timestamp = 0;	
		}
	};
	
	state.login = function(uname, pword, cb, errCb) {
		var params = null;
		if(uname && pword) {
			params = { username:uname, password: pword };
		}
		sb.api.post(sb.urls.url(sb.urls.LOGIN), params, cb, errCb, state.unauthorized);
	};
	
	state.logout = function() {
		sb.api.post(sb.urls.url(sb.urls.LOGOUT));
		state.session = state.session_unknown;
	};
	
	state.changeCompany = function(cid) {
		state.session = state.session_unknown;
		sb.models.reset(false);

		sb.api.post(sb.urls.url(sb.urls.LOGIN), {company_id:cid});
	};
	
	state.forceModelUpdate = function(model) {
		if(_forceUpdateBuffer[model.name]) {
			clearTimeout(_forceUpdateBuffer[model.name]);
			_forceUpdateBuffer[model.name] = null;
		}
		
		if(!_forceUpdateBusy[model.name] && state.authorized()) {
			_forceUpdateBusy[model.name] = true;
			var m = state.models[model.name];
			m.timestamp = 0;
			//request the model directly, but we will only process the high level model elements
			// IF THOSE HLM elements exist
			var url = sb.urls.url(m.urlDef);
			var cb = _handleModelResponse.bind(state,model);
			sb.api.get(url, null, cb);
		}
	};
	
	
	state.any = function() { 		return true; };
	
	//not tried auth yet. 
	state.unknown = function() {	return _state.session == state.session_unknown;	};
	//no auth
	state.unauthorized = function() {	return  _state.session == state.session_unknown || _state.session == state.session_invalid;	};
	//invalid
	state.invalid = function() {	return  _state.session == state.session_invalid;	};
	//has user/company
	state.authorized = function() {	return _state.session == state.session_normal || _state.session == state.session_payment; };	

	//failed server response
	state.disconnected = function() { return _state.session == state.session_disconnected; };
	
	//returns true / false depending on whether the response session is valid
	state.update = function(data) {
		_updateSession(data);
		_updateModels(data);
		state.publish.bindDelay(state, 50, "session");
		return state.authorized();
	};
	
	
	//setter/getter
	//supports "State.value()" to determine the current session state
	// or normally: "sb.state.value("block") for fetching current block path. 
	state.value = function(type, val, publishUrl) {
		if(val !== undefined && _state[type] != val) {
			var from = _state[type];
			var func = _stateFunctions[type];
			var newVal = func ? func(from||null,val) : val;
			//$sblog("Setting Type: ", type, " To ", newVal, "Original:", from);
			if(type == "url") { throw "Please use State.url to change the url object directly."; }
			_state[type] = newVal;
			
			//publish is timeout delayed, so the state functions should execute before any notifications
			state.publish(type);
			
			if(_urlParts.indexOf(type) > -1) {
				_state.url = state.url();
				if(publishUrl !== false) {
					state.publish("url");
				}
			}
		}
		return _state[type];
	};
	
	state.clone = function() {
		return sb.ext.mixin({}, _state);
	};
	
	//only used for settings where we want to check the single value in a group of many
	//e.g., State.value(type) = <key 1>!<value 1>-<key 2>!<value 2>-...
	// 1223_232_222!bp-2232-223-233!bk-...
	state.getValueKey = function(type, key) {
		//$sblog("Get Value Key: ", type, key);
		var val = sb.urls.s_to_o(state.value(type));
		return val[key] || null;
	};
	
	state.setValueKey = function(type, key, value) {
		var val = sb.urls.s_to_o(state.value(type));
		if(value == null) {
			delete val[key];
		} else {
			val[key] = value;
		}
		state.value(type, sb.urls.o_to_s(val));
	};
	
	state.subscribe = function(type, cb) {
		console.log(sb.version);
		sb.ext.debug("subscribing to: ", type);
		state.subscriptions[type] = state.subscriptions[type] || [];
		
		state.subscriptions[type].push(cb);
	};

	/**
	*	This will not work unless the function definition
	*	has not changed. E.g., if you create a temporary
	*	function using func.bind, then you need to store
	*	that instance and use it for unsubscribing
	*/
	state.unsubscribe = function(type, cb) {
		var idx = state.subscriptions[type].indexOf(cb);
		if (idx > -1) {
			state.subscriptions[type].splice(idx, 1);
		}  
	};

	state.publish = function(type) {
		var list = state.subscriptions[type] || [];
		var value = state.value(type);
		var ext= sb.ext;
		list.forEach(function(v) {
			if(type.indexOf("Zoom") > -1) {
				ext.debug("Publish Zoom: ", type, value);
				v.bindDelay(null, 0, value);
			} else {
				ext.debug("Publish: ", type, value);
				v.bindDelay(null, 50, value);
			}
			
		});
	};
	
	state.addTimestamps = function(params) {
		sb.ext.debug("Adding timestamp for ", Object.keys(state.models).join(","));
		
		for (var m in state.models) {
			params[m+"_timestamp"] = state.models[m].timestamp;
		}
	};

	function _updateSession (data) {
		if(data) {
			var uid = data.user ? data.user.id : null;
			var cid = data.company ? data.company.id : null;
			if(uid != _state.userId || cid != _state.companyId) {
				_state.userId = data.user ? data.user.id : null;
				_state.companyId = data.company ? data.company.id : null;
			}
			if(_state.block == null && data.block != null) {
				//delay so notification happens after the session is valid
				_state.block = String(data.block);
			}
		} else {
			_state.userId = _state.companyId = null;
			_state.user = _state.company = null;
		}
		if(state.value("userId") == null) {
			sb.ext.debug("setting session to unauthorized");
			_state.session =  state.session_invalid;
		} else {
			_state.company = data.company;
			_state.user = data.user; 
			if (data.company && data.company.license && data.company.license.status =="expired") {
				sb.ext.debug("setting session to payment");
				_state.session =  state.session_payment;
			} else {
				sb.ext.debug("setting session to normal");
				_state.session =  state.session_normal;
			}
		}
		
		if(!state.authorized()) {
			sb.models.reset();
		}
	}
	
	function _updateModels (data) {
		for (var m in state.models) {
			if(data && data[m]) {
				_forceUpdateBusy[m] = _forceUpdateBuffer[m] = null;
				state.models[m].timestamp = data[m].timestamp;
				state.models[m].cb(data[m]);
			}
		}	
	}


	//Handle the response from a model which doesn't use timestamps. 
	function _handleModelResponse (model, result) {
		var res = result && result.result;
		var m = res[model.name] || res;
		
		if(model.raw() == null && m) {
			if(sb.ext.isArray(m)) {
				m = m.reduce( (function(prev,el) { 
					prev[el.id] = el;
					return prev;
				}), {});	
			}
			model._handleUpdate({added:m});
		}
		_forceUpdateBusy[model.name] = false;
	}
		
	function _handleBlockChange (oldVal, newVal) {
		state.value.bindDelay(state, 0, "previousBlock", oldVal);
		return sb.queries.blockPath(newVal).join("_");
	}
	function _handlePageChange (oldVal, newVal) {
		oldVal = oldVal || "home";
		state.value.bindDelay(state, 0, "previousPage", oldVal);
		sb.ext.debug("HandlePageChange: ", oldVal, " to ", newVal);
		return newVal;
	}
	

	return state; 	
	
});
