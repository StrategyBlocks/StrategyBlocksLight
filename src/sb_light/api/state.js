
/*globals define */

define(["sb_light/globals", "sb_light/utils/consts","sb_light/utils/ext"], function(sb,consts,ext) {
	//console.log("State:",sb.version);
	'use strict';

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

	//storage of application data. The properties can be extended simply by "watch"ing them.
	var storage = {
		//current application state (e.g., which page, block, tag, user....) -- stuff that can go into a url for bookmarking
		state: {
			block:null,		//normally block path
			news:null,		//news item id		
			kpi:null,		//kpi  id		
			risk:null,		//risk id		
			tag:null,		//tag id		

			user_id:null,
			company_id:null
		},

		//"uncontrolled" event data, like authentication state, flash message, errors, etc...
		//stuff that doesn"t belong in a url, but reflects the current state of the app
		context: {
			flash:null,
			session: state.session_startup,
			errors:null,
			company:null,
			user:null
		},

		// local cache of app data -- stuff that you might store in a cookie. or non-model data that unrelated
		// objects might need access to
		data: {
			flashHistory:[]
		}
	};

	var models = {};
	var watching = {
		state:{},
		context: {},
		data:{}
	};


	var _forceUpdateBuffer = {};
	var _forceUpdateBusy = {};
	
	
	state.host = "";
	

	state.registerModel = function(model, urlDef, cb) {
		var m = models;
		if(!m[model.name]) {
			m[model.name] = {timestamp:0, cb:cb, urlDef:urlDef};
			if(state.authorized() && !_forceUpdateBuffer && !_forceUpdateBuffer[model.name]) {
				//if we do a bunch of these at the same time, only run the first. The others will get picked up.
				_forceUpdateBuffer[model.name] = state.forceModelUpdate.bindDelay(state, 200, model);
			}
		}
	};


	//ACCESSS
	state.state = function(type, val,force)	{		return _accessStorage("state", type, val, force);			};
	state.context = function(type, val,force)	{	return _accessStorage("context", type, val, force);	 		};
	state.data = function(type, val,force)	{		return _accessStorage("data", type, val, force);			};

	
	//init
	//these functions are needed to initialize at an application level without specifically watching for changes
	//e.g., we know we'll need the properties and we want to set a default without having to specify it in 
	//each sub component that needs it. 
	state.initState = function(type, _default)		{		return _initStorage("state", type,_default);	};
	state.initContext = function(type, _default)	{		return _initStorage("context", type, _default);		};
	state.initData = function(type, _default)		{		return _initStorage("data", type, _default);		};

	//WATCH
	//* for "type" means it will watch everything in the group
	//watching a property will initialize it as well. 
	state.watchState = function(type, cb, _default, _urgent)	{		return state.watch("state", type,cb, _default, _urgent);	};
	state.watchContext = function(type, cb, _default, _urgent)	{		return state.watch("context", type,cb, _default, _urgent);	};
	state.watchData = function(type, cb, _default, _urgent)		{		return state.watch("data", type,cb, _default, _urgent);		};
	

	//REMOVE
	// When "remove" is a func, it will not work unless the function definition
	// has not changed. E.g., if you create a temporary
	// function using func.bind, then you need to store
	// that instance and use it for unsubscribing
	state.unwatchState = function(type, remove)			{		return state.unwatch("state", type,remove);		};
	state.unwatchContext = function(type, remove)		{		return state.unwatch("context", type,remove);	};
	state.unwatchData = function(type, remove)			{		return state.unwatch("data", type,remove);		};

	state.publish = function(group, type) {
		var s = watching[group];
		//var list = s[type] || [];
		var value = state[group](type);
		var ext= sb.ext;
		//ext.debug("Publish: ", type, value);
		ext.each(s[type], function(v) {
			v.callback.bindDelay(null, 0/*(v.urgent?0:50)*/, value, type);
		});
		//notify all the global subs
		ext.each(s["*"], function(v) {
			v.callback.bindDelay(null, 0/*(v.urgent?0:50)*/, value, type);
		});
	};


	var _accessStorage = function(group, type,val, force) {
		if(!type && sb.debug) {
			//provide access to the raw object. This may or may not be dangerous....
			//TODO: investigate benefits beyond debugging
			return storage[group];
		}

		var sg = storage[group];
		if(!sg.hasOwnProperty(type)) {
			throw "SBLIGHT::State - Trying to access a state property that hasn't been initialized. " + group + "::" + type;
		}

		if(val !== undefined) {
			//we still need to return "this" when 
			if(force || sg[type] != val) {
				sg[type] = val;
				state.publish(group, type);
			}
			return state;
		}
		return sg[type] || sg["_default_"+type] || null;
	};

	var _initStorage = function(group, type, _default) {
		var sg = storage[group];
		if(type !== "*") {
			if(!sg.hasOwnProperty(type)) {
				sg[type] = _default || null;
			}
			if(_default !== undefined) {
				sg["_default_"+type] = _default;
			}
		}

	};

	state.watch = function(group, type, cb, _default, _urgent/*==false*/) {
		if(!cb) {
			throw "Error: callback is not defined: " + group + " " + type;
		}
		_initStorage(group, type, _default);

		var w = watching[group];
		w[type] = w[type] || {};
		
		var id = ["watch_state",group, type, sb.ext.unique()].join("_");
		w[type][id] = {callback:cb, urgent:(_urgent||false)};

		return id;
	};

	state.unwatch = function(group, type, remove) {
		var del = [];
		var w = watching[group];
		//collect matches

		ext.each(w[type], function(v,k) {
			//"remove" can be the key or the cb func
			if(v.callback == remove || k == remove) {
				del.push(k);
			}
		});
		del.forEach(function(el) {
			delete w[type][el];
		});
	};

	state.getTimestamp = function(name) {
		var m = models;
		if(m[name]) {
			return m[name].timestamp  || 0;
		}
		return 0;
	};
	state.resetTimestamp = function(name) {
		var m = models;
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
		state.context("session", state.session_unknown);

		var url = sb.urls.url(sb.urls.LOGIN);

		sb.queue.add(sb.api.post.bind(sb.api, url, params, cb, errCb, state.unauthorized), "sblight_state_login");
	};
	
	state.reset = function(cid) {
		storage.context.session = state.session_startup;
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
	};

	state.logout = function() {
		sb.api.post(sb.urls.url(sb.urls.LOGOUT));
		state.reset();
	};
	
	state.changeCompany = function(cid) {
		state.reset(cid);
		sb.queue.add(state.publish.bind(state,"context", "session"), "sblight_state_publish_context");
		sb.queue.add(state.publish.bind(state,"state", "company_id"), "sblight_state_publish_state");
	};
	
	state.forceModelUpdate = function(model) {
		if(_forceUpdateBuffer[model.name]) {
			clearTimeout(_forceUpdateBuffer[model.name]);
			_forceUpdateBuffer[model.name] = null;
		}
		
		if(!_forceUpdateBusy[model.name] && state.authorized()) {
			_forceUpdateBusy[model.name] = true;
			var m = models[model.name];
			m.timestamp = 0;
			//request the model directly, but we will only process the high level model elements
			// IF THOSE HLM elements exist
			var url = sb.urls.url(m.urlDef);
			var cb = _handleModelResponse.bind(state,model);
			sb.api.get(url, null, cb);
		}
	};
	
	
	state.any = function()	{	return true;	};

	//startup -- the first state of this system. This used to be "unknown", but in some cases it's useful to
	//know that we're in the initialization phase. So we always start in the "startup" state, and then
	//move into the "unknown" state.  
	state.startup = function() {	return storage.context.session == state.session_startup; };
	
	//any state but unknown 
	state.known = function() {	return storage.context.session != state.session_unknown;	};
	//not tried auth yet. 
	state.unknown = function() {	return storage.context.session == state.session_unknown || storage.context.session == state.session_startup;	};
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
		sb.queue.add(state.publish.bind(state, "context", "session"), "sb_state_publish_context_session");

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
		if(value === null) {
			delete val[key];
		} else {
			val[key] = value;
		}
		state.state(type, sb.urls.o_to_s(val));
	};
	

	
	state.addTimestamps = function(params) {
		sb.ext.debug("Adding timestamp for ", Object.keys(models).join(","));
		
		for (var m in models) {
			params[m+"_timestamp"] = models[m].timestamp;
		}
	};

	function _updateSession (data) {
		if(data) {
			var uid = data.user ? data.user.id : null;
			var cid = data.company ? data.company.id : null;
			if(!state.authorized() || uid != storage.state.user_id || cid != storage.state.company_id) {
				storage.state.user_id = data.user ? data.user.id : null;
				storage.state.company_id = data.company ? data.company.id : storage.state.company_id;
				sb.queue.add(state.publish.bind(state, "state", "user_id"), "sb_state_publish_state_user_id", 100);
				sb.queue.add(state.publish.bind(state, "state", "company_id"), "sb_state_publish_state_company_id", 100);
			}
			
			storage.context.user = data.user || null;
			storage.context.company = data.company || null;


			//if we have a block id in the response and there's no block defined in the state, OR 
			//	 we have the  blocks model but the currentBlock is returning null
			if(data.block && (!storage.state.block || (sb.models.raw("blocks") && !sb.queries.currentBlock()))) {
				storage.state.block = String(data.block);
				//delay so notification happens after the session is valid
				sb.queue.add(state.publish.bind(state, "state", "block"), "sb_state_publish_state_block", 100);
			}
		} else {
			storage.state.user_id = null;
		}
		if(!storage.state.user_id) {
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
		for (var m in models) {
			if(data && data[m]) {
				_forceUpdateBusy[m] = _forceUpdateBuffer[m] = null;
				models[m].timestamp = data[m].timestamp;
				models[m].cb(data[m]);
			}
		}
	}


	//Handle the response from a model which doesn't use timestamps. 
	function _handleModelResponse (model, result) {
		var res = result && result.result;
		var m = res[model.name] || res;
		
		if(model.raw() === null && m) {
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

	return state;
	
});
