
/*globals define */

define(["sb_light/globals", "sb_light/utils/ext"], function(sb,E) {
	//console.log("State:",sb.version);
	'use strict';

	var state = {};
	
	state.stateKeys = [
		/*0*/"session_unknown",
		/*1*/"session_normal",
		/*2*/"session_payment",
		/*3*/"session_invalid",
		/*4*/"session_disconnected",
		/*5*/"session_startup"
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
			//kpi:null,		//kpi  id		
			metric:null,	//metric  id		
			risk:null,		//risk id		
			tag:null		//tag id		

		},

		//"uncontrolled" event data, like authentication state, flash message, errors, etc...
		//stuff that doesn"t belong in a url, but reflects the current state of the app
		//This stuff is unlikely to be preserved in url / localstorage. A reload of the webpage
		//should remove all this stuff.
		context: {
			flash:null,
			session: state.session_startup,
			errors:null,
			user_id:null,
			company_id:null,
			company:null,
			user:null
		},

		//this is session-based information. A page reload will not clear it, but when you restart your browser completely
		//it should be removed. 
		//probably stored using "sessionStorage" vs a session cookie, but same effective result 
		//https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API
		cookie: {

		},

		// local cache of app data -- this is stuff that you want to persist between sessions
		//this is probably storage using "localStorage"
		//https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API
		data: {
			flashHistory:[]
		}
	};

	var models = {};
	var watching = {
		state:{},
		context: {},
		cookie: {},
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

	E.each(storage, function(v,k) {
		var capsKey = E.caps(k);

		//ACCESSS
		state[k] =  function(type, val,force)	{		
			return _accessStorage(k, type, val, force);			
		};

		//INIT STORAGE
		//these functions are needed to initialize at an application level without specifically watching for changes
		//e.g., we know we'll need the properties and we want to set a default without having to specify it in 
		//each sub component that needs it. 
		state["init"+capsKey] = function(type, _default) {		
			return _initStorage(k, type,_default);	
		};


		//WATCH
		//* for "type" means it will watch everything in the group
		//watching a property will initialize it as well. 
		state["watch"+capsKey] = function(type, cb, _default, _urgent)	{		
			return state.watch(k, type,cb, _default, _urgent);	
		};	

		
		//REMOVE
		// When "remove" is a func, it will not work unless the function definition
		// has not changed. E.g., if you create a temporary
		// function using func.bind, then you need to store
		// that instance and use it for unsubscribing
		state["unwatch"+capsKey] = function(type, remove) {		
			return state.unwatch(k, type,remove);		
		};
	});

	
	
	state.publish = function(group, type) {
		var s = watching[group];
		//var list = s[type] || [];
		var value = state[group](type);
		// E.debug("Publish: ", type, value);
		E.each(s[type], function(v) {
			v.callback.bindDelay(null, 0/*(v.urgent?0:50)*/, value, type);
		});
		//notify all the global subs
		E.each(s["*"], function(v) {
			v.callback.bindDelay(null, 0/*(v.urgent?0:50)*/, value, type);
		});
	};


	var _accessStorage = function(group, type,val, force) {
		if(!type && sb.debug) {
			//provide access to the raw object. This may or may not be dangerous....
			//TODO: investigate benefits beyond debugging
			//GM APR 21 / 2015: Start using cloneDeep to avoid giving access to the raw stored object. This prevents changing the object
			//                  by accident when accessing it and making modifications directly without applying changes manually.   
			return E._.cloneDeep(storage[group]);
		}

		var sg = storage[group];
		if(!sg.hasOwnProperty(type)) {
			E.warn("SBLIGHT::State - Trying to access a state property that hasn't been initialized. " + group + "::" + type);
		}

		if(val !== undefined) {
			//we still need to return "this" when 
			if(force || sg[type] != val) {
				sg[type] = val;
				state.publish(group, type);
			}
			return state;
		}
		//GM APR 21 / 2015: Start using cloneDeep to avoid giving access to the raw stored object. This prevents changing the object
		//                  by accident when accessing it and making modifications directly without applying changes manually.   

		var retVal = sg[type];
		if(E.valid(retVal)) {
			return E._.cloneDeep(retVal);
		} 
		retVal = sg["_default_"+type];
		if(E.valid(retVal)) {
			return E._.cloneDeep(retVal); 
		}
		return null;
	};

	var _initStorage = function(group, type, _default) {
		var sg = storage[group];
		if(type !== "*") {
			if(!sg.hasOwnProperty(type)) {
				sg[type] = arguments.length == 3 ? _default :  null;
			}
			if(arguments.length == 3) {
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
		
		var id = ["watch_state",group, type, E.unique()].join("_");
		w[type][id] = {callback:cb, urgent:(_urgent||false)};

		return id;
	};

	state.unwatch = function(group, type, remove) {
		var del = [];
		var w = watching[group];
		//collect matches

		E.each(w[type], function(v,k) {
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
	state.setTimestamp = function(name, timestamp) {
		var m = models;
		if(m[name]) {
			m[name].timestamp  = timestamp;
			return timestamp;
		}
	};
	state.resetTimestamp = function(name) {
		var m = models;
		if(m[name]) {
			m[name].timestamp = 0;
		}
	};
	
	state._loginBusy = false;
	state.login = function(uname, pword, cb, errCb) {
		if(state._loginBusy) { return; }

		var params = {};
		if(uname && pword) {
			params.username = uname;
			params.password = pword;
		}
		if(storage.state.company_id) {
			params.company_id = storage.state.company_id;
		}

		if(!uname) {
			state.context("session", state.session_unknown);
		}


		var url = sb.urls.url(sb.urls.LOGIN);

		state._loginBusy = true;

		var cbf = function() { 
			state._loginBusy = false; 
			if(cb) {
				cb.apply(null, E.slice(arguments));	
			}
		};
		var errorCbf = function() { 
			state._loginBusy = false; 
			if(errCb) {
				errCb.apply(null, E.slice(arguments));	
			}
		};

		sb.queue.add(sb.api.post.bind(sb.api, url, params, cbf, errorCbf, state.unauthorized), "sblight_state_login");
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
	state.persistSession = function() {
		sb.api.post(sb.urls.urls(sb.urls.LOGIN_REMEMBER_ME));
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
	
	//any state but unknown / startup
	state.connected = function() {	return state.known() && !state.disconnected();	};

	//tried auth. 
	state.known = function() {	return  !state.unknown(); };

	//not tried auth yet. 
	state.unknown = function() {	return storage.context.session == state.session_unknown || storage.context.session == state.session_startup;	};


	//no auth
	state.unauthorized = function() {	return  !state.authorized();	};
	//invalid
	state.invalid = function() {	return  storage.context.session == state.session_invalid;	};
	//has user/company
	state.authorized = function() {	return storage.context.session == state.session_normal || storage.context.session == state.session_payment; };

	//has user/company
	state.normal = function() {		return storage.context.session == state.session_normal;  };
	state.payment = function() {	return storage.context.session == state.session_payment;  };


	//failed server response
	state.disconnected = function() { return storage.context.session == state.session_disconnected; };

	//only for users who are flagged as server admins. 
	state.admin = function() { return state.authorized() && storage.context.user && storage.context.user.is_server_admin; };
	state.notAdmin = function() { return state.authorized() && !state.admin(); };

	
	//returns true / false depending on whether the response session is valid
	state.update = function(data) {

		var session = state.context("session");

		_updateSession(data, session);
		_updateModels(data);

		if(session != state.context("session")) {
			state.publish.bindDelay(state, 100, "context", "session");
		}

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
		E.debug("Adding timestamp for ", Object.keys(models).join(","));
		
		for (var m in models) {
			params[m+"_timestamp"] = models[m].timestamp;
		}
	};

	function _updateSession (data, prevSession) {
		if(data) {
			var uid = data.user ? data.user.id : null;
			var cid = data.company ? data.company.id : null;
			if(!state.authorized() || uid != storage.state.user_id || cid != storage.state.company_id) {
				storage.state.user_id = data.user ? data.user.id : null;
				storage.state.company_id = data.company ? data.company.id : storage.state.company_id;
				state.publish.bindDelay(state, 100, "state", "user_id");
				state.publish.bindDelay(state, 100, "state", "company_id");
			}
			
			storage.context.user = data.user || null;
			storage.context.company = data.company || null;


			//if we have a block id in the response and there's no block defined in the state, OR 
			//	 we have the  blocks model but the currentBlock is returning null
			if(data.block && (!storage.state.block || (sb.models.raw("blocks") && !sb.queries.block()))) {
				storage.state.block = String(data.block);
				//delay so notification happens after the session is valid
				state.publish.bindDelay(state, 100, "state", "block");
			}
		} else {
			storage.state.user_id = null;
		}
		if(!storage.state.user_id) {
			E.debug("setting session to unauthorized");
			if(state.unknown() ) {
				data.flash = {
					notice:"Please enter your login credentials.",
					devInfo: "This flash message has been overriden by the state controller for initial login check" 
				};
			}
			storage.context.session =  state.session_invalid;
		} else {
			if (data.company && data.company.license && data.company.license.status =="expired") {
				E.debug("setting session to payment");
				storage.context.session =  state.session_payment;
			} else {
				E.debug("setting session to normal");
				storage.context.session =  state.session_normal;
			}
		}
		var fakeLogin = (!prevSession || prevSession == state.session_unknown || prevSession == state.session_startup); 
		if(!fakeLogin && data.flash && (data.flash.error || data.flash.warning)) {
			//prevent updating the flash message on dummy logins
			state.context("flash", data.flash);
		}
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

		var key = model.responseKey || model.name;
		var m = res[key] || res;
		
		if(model.raw() === null && m) {
			if(E.isArray(m)) {
				m = m.reduce( (function(prev,el) {
					if(!el.id) {
						E.debug("Warning:STATE:HandleMOdelResponse: model doesn't have an id: ", model.name, el);
						el.id = (el.id || el.name || el.key); 
					}
					prev[el.id] = el;
					return prev;
				}), {});
			}

			var data = {};
			data[model.name] = {
				"added": m,
				"timestamp": (res[key+"_timestamp"] || String(E.dateNumber()))
			};
			//this cleans up the timestamps and the force request buffers
			_updateModels(data);
		}
	}

	return state;
	
});
