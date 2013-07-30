
define(['sb_light/globals', 'sb_light/utils/consts','sb_light/utils/ext'], function(sb,consts,ext) {
	//console.log("State:",sb.version);
	
	var state = {};
	
	state.stateKeys = [ 
		"session_unknown", 
		"session_normal", 
		"session_payment", 
		"session_invalid", 
		"session_disconnected",
		"session_startup"
	];
	//create a map
	state.stateKeys.reduce(function(prev,el,i) {
		prev[el] = i;
		return prev;
	}, state);



	var storage = {
		//current application state (e.g., which page, block, tag, user....) -- stuff that can go into a url for bookmarking
		state: {
			block:null,		//normally block path
			news:null,		//news item id		
			kpi:null,		//kpi  id		
			risk:null,		//risk id		
			tag:null,		//tag id		

			user_id:null,
			company_id:null,
		},

		//"uncontrolled" event data, like authentication state, flash message, errors, etc...
		//stuff that doesn't belong in a url, but reflects the current state of the app
		context: {
			flash:null,
			session: state.session_startup,
			errors:null,
			prevBlocks: null,
			prevPages: null,
		},

		// local cache of app data -- stuff that you might store in a cookie. or non-model data that unrelated
		// objects might need access to
		data: {

		}
	};



	var _forceUpdateBuffer = {};
	var _forceUpdateBusy = {};
	var _stateFunctions = {};
	
	
	state.host = "";
	state.models = {};

	state.watch = {
		state:{},
		context: {},
		data:{}
	};

	

	state.registerModel = function(model, urlDef, cb) {
		var m = state.models;
		if(!m[model.name]) {
			m[model.name] = {timestamp:0, cb:cb, urlDef:urlDef};
			if(state.authorized() && !_forceUpdateBuffer && !_forceUpdateBuffer[model.name]) {
				//if we do a bunch of these at the same time, only run the first. The others will get picked up.
				_forceUpdateBuffer[model.name] = _forceModelUpdate.bindDelay(state, 200, model);
			}
		} 
	};


	//ACCESSS
	state.state = function(type, val) 	{		return _accessStorage("state", type, val);			};
	state.context = function(type, val) {		return _accessStorage("context", type, val);		};
	state.data = function(type, val) 	{		return _accessStorage("data", type, val);			};

	
	//WATCH
	//* for "type" means it will watch everything in the group
	state.watchState = function(type, cb, _default) 	{		return _watch("state", type,cb, _default);		};
	state.watchContext = function(type, cb, _default) 	{		return _watch("context", type,cb, _default);	};
	state.watchData = function(type, cb, _default) 		{		return _watch("data", type,cb, _default);		};
	

	//REMOVE
	// When "remove" is a func, it will not work unless the function definition
	// has not changed. E.g., if you create a temporary
	// function using func.bind, then you need to store
	// that instance and use it for unsubscribing
	state.unwatchState = function(type, remove) 		{		return _unwatch("state", type,remove);		};
	state.unwatchContext = function(type, remove) 		{		return _unwatch("context", type,remove);	};
	state.unwatchData = function(type, remove) 			{		return _unwatch("data", type,remove);		};

	state.publish = function(group, type) {
		var s = state.watch[group];
		var list = s[type] || [];
		var value = state[group](type);
		var ext= sb.ext;
		ext.each(s[type], function(v) {
			ext.debug("Publish: ", type, value, v.urgent);
			v.callback.bindDelay(null, (v.urgent?0:50), value, type);
		});
		//notify all the global subs
		ext.each(s["*"], function(v) {
			ext.debug("Publish(*): ", type, value, v.urgent);
			v.callback.bindDelay(null, (v.urgent?0:50), value, type);
		});
	};


	var _accessStorage = function(group, type,val) {
		var sg = storage[group];
		if(!sg.hasOwnProperty(type)) {
			throw "SBLIGHT::State - Trying to access a state property that hasn't been initialized." + type;
		};

		if(typeof val !== "undefined" && sg[type] != val) {
			sg[type] = val;
			state.publish(group, type);
			return this;
		}
		return sg[type];
	};


	var _watch = function(group, type, cb, _default, _urgent/*==false*/) {
		var sg = storage[group];
		if(type !== "*" && !sg.hasOwnProperty(type)) {
			sg[type] = _default || null;
		};

		var w = state.watch[group];
		w[type] = w[type] || {};
		
		var id = ["watch_state",group, type, sb.ext.unique()].join("_");
		w[type][id] = {callback:cb, urgent:(_urgent||false)};

		return id;
	};

	var _unwatch = function(group, type, remove) {
		var del = [];
		var w = state.watch[group];
		//collect matches

		ext.each(w[type], function(v,k) {
			//"remove" can be the key or the cb func
			if(v.callback == remove || k == remove) { 
				del.push(k);
			}
		});
		del.forEach(function(el) {
			delete w[type][el];
		})
	};


	state.resetTimestamp = function(name) {
		var m = state.models;
		if(m[name]) {
			m[name].timestamp = 0;	
		}
	};
	
	state.login = function(uname, pword, cb, errCb) {
		var params = {};
		if(uname && pword) {
			params.username = uname;
			params.password = pword;
		}
		if(storage.state.company_id) {
			params.company_id = storage.state.company_id;
		}
		sb.api.post(sb.urls.url(sb.urls.LOGIN), params, cb, errCb, state.unauthorized);
	};
	
	state.reset = function(cid) {
		storage.context.session = state.session_unknown;
		storage.context.flash = null;

		if(cid) {
			storage.state.company_id = cid;
		}
		storage.state.block = null;
		storage.state.news = null;
		storage.state.kpi = null;
		storage.state.risk = null;
		storage.state.tag = null;

		sb.queue.add(sb.models.reset.bind(sb.models), "sblight_models_reset");
	}

	state.logout = function() {
		sb.api.post(sb.urls.url(sb.urls.LOGOUT));
		state.reset();
	};
	
	state.changeCompany = function(cid) {
		state.reset(cid);
		sb.queue.add(state.publish.bind(state, "session"), "sblight_state_publish");
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

	//startup -- the first state of this system. This used to be "unknown", but in some cases it's useful to
	//know that we're in the initialization phase. So we always start in the "startup" state, and then
	//move into the "unknown" state.  
	state.startup = function() {	return storage.context.session == state.session_startup;	};
	
	//any state but unknown 
	state.known = function() {	return storage.context.session != state.session_unknown;	};
	//not tried auth yet. 
	state.unknown = function() {	return storage.context.session == state.session_unknown;	};
	//no auth
	state.unauthorized = function() {	return  storage.context.session == state.session_unknown || storage.context.session == state.session_invalid || storage.context.session == state.session_startup;	};
	//invalid
	state.invalid = function() {	return  storage.context.session == state.session_invalid;	};
	//has user/company
	state.authorized = function() {	return storage.context.session == state.session_normal || storage.context.session == state.session_payment; };	

	//failed server response
	state.disconnected = function() { return storage.context.session == state.session_disconnected; };
	
	//returns true / false depending on whether the response session is valid
	state.update = function(data) {
		_updateSession(data);
		_updateModels(data);
		state.publish.bindDelay(state, 50, "context", "session");
		return state.authorized();
	};
	


	
	//only used for settings where we want to check the single value in a group of many
	//e.g., State.value(type) = <key 1>!<value 1>-<key 2>!<value 2>-...
	// 1223_232_222!bp-2232-223-233!bk-...
	state.getStateKey = function(type, key) {
		//$sblog("Get Value Key: ", type, key);
		var val = sb.urls.s_to_o(state.state(type));
		return val[key] || null;
	};
	
	state.setStateKey = function(type, key, value) {
		var val = sb.urls.s_to_o(state.state(type));
		if(value == null) {
			delete val[key];
		} else {
			val[key] = value;
		}
		state.state(type, sb.urls.o_to_s(val));
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
			if(uid != storage.state.user_id || cid != storage.state.company_id) {
				storage.state.user_id = data.user ? data.user.id : null;
				storage.state.company_id = data.company ? data.company.id : storage.state.company_id;
			}
			if(storage.state.block == null && data.block != null) {
				//delay so notification happens after the session is valid
				storage.state.block = String(data.block);
			}
		} else {
			storage.state.user_id = null;
		}
		if(storage.state.user_id == null) {
			sb.ext.debug("setting session to unauthorized");
			if(state.unknown() || state.startup()) {
				data.flash = {notice:"Please enter your login credentials."};
			}
			storage.context.session =  state.session_invalid;
		} else {
			if (data.company && data.company.license && data.company.license.status =="expired") {
				sb.ext.debug("setting session to payment");
				storage.context.session =  state.session_payment;
			} else {
				sb.ext.debug("setting session to normal");
				storage.context.session =  state.session_normal;
			}
		}
		
		if(!state.authorized()) {
			sb.models.reset();
		}
		state.context("flash", data.flash);
		state.context("errors", data.errors);
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
		state.context.bindDelay(state, 0, "previousBlock", oldVal);
		return sb.queries.blockPath(newVal).join("_");
	}
	function _handlePageChange (oldVal, newVal) {
		oldVal = oldVal || "home";
		state.context.bindDelay(state, 0, "previousPage", oldVal);
		sb.ext.debug("HandlePageChange: ", oldVal, " to ", newVal);
		return newVal;
	}
	

	return state; 	
	
});
