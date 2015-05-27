


define(['sb_light/utils/ext','sb_light/api/state', 'sb_light/globals'], function(E, ST, sb) {
	'use strict';

	var api = {};

	var _errorData = null;
	var _errorTimeout = 50;
	var _errorTimeoutDefault = 50;
	var _requestQueue =  [];


		
	api.get = function(url, params, success, failure, stateCheck, overrides) {
		api.request(url,params, false, success,failure,stateCheck, overrides);
	};
	
	api.post = function(url, params, success, failure, stateCheck, overrides) {
		api.request(url,params, true, success,failure,stateCheck, overrides);
	};

	api.request =  function(url, params, post, success,failure, stateCheck, overrides) {
		var stateFunc = (stateCheck || ST.authorized);
		if(stateFunc.call(ST)) {
			_request(url, params, post, success, failure, overrides); 
		} else if(failure) {
			failure(null);
		} else if (success) {
			success(null);
		}
	};
	
	function _request (url, params, post, success, failure, overrides) {
		sb.ext.debug("Sending request to ", url, post, JSON.stringify(params));
		if(!api.ajax) {
			throw "Error: sb.api.ajax has not been inititalized. Please set this value to one of the functions available in sb.ajax";
		}
		params = params || {};
		ST.addTimestamps(params);

		var opts = sb.ext.merge({
			url: url,
			type: (post ? "POST" : "GET"),
			data:params,
			dataType: 'json',
			context: api,
		}, overrides);

		var args = {url:url, params:params, post:post, opts:opts, success:success, failure:failure};
		opts.success = _success.bind(null, args)
		opts.error = _failure.bind(null, args)

		api.ajax(sb.ext.merge(opts, overrides||{}));
	}

	function _success(reqArgs, data) {
		sb.ext.debug("SUCCESS: SB_Api", reqArgs.url);
		_errorTimeout = _errorTimeoutDefault;
		
		var wasValid = ST.authorized();
		
		var opts = reqArgs.opts;

		//skip post-processing if we're dealing with non-json responses
		if(opts && opts.dataType != "json") {
			reqArgs.success(data);
			_popQueue();
			return;
		}

		if (ST.update(data) ) {
			//success function in the original call
			var errors = sb.helpers.getResultMessages(data).errors;
			
			if(!errors && reqArgs.success) {
				reqArgs.success(data);
				_popQueue();
			}
			if(errors && reqArgs.failure) {
				reqArgs.failure(data);
				_popQueue();
			}
		} else {
			if(wasValid) {
				//clear the queue
				_requestQueue.length = 0;
			}
			if(reqArgs.failure) {
				reqArgs.failure(data);	
			}	
		}

		_popQueue();
	}
	
	function _failure (reqArgs, data) {
		sb.ext.debug("FAILURE SB_Api", JSON.stringify(reqArgs), JSON.stringify(data));

		if(data && data.status == 200) {
			reqArgs.failure(data);
			if(sb.helpers && sb.helpers.showMessage) {
				sb.helpers.showMessage("Something bad happened with your last update and the response could not be processed.\
										 Please contact <a href='mailto:help@strategyblocks.com'>StrategyBlocks Support</a> \
										 and let us know what happened.", "danger")
				;
			}
			return;
		}

		if(!ST.disconnected()) {
			ST.context("session", ST.session_disconnected);
			if(sb.options && sb.options.isDevice) {
				reqArgs.failure(data);
			} else {
				_pushQueue(reqArgs);
			}
		} else if(!(sb.options && sb.options.isDevice)) {
			_watchConnection();
		}

	}
	
	function _pushQueue (data) {
		var key = data.url + (JSON.stringify(data.params) || "");
		sb.ext.debug("Pushing request on the queue: ", key);
		if(_requestQueue.filter(function(el) { return el.key == key; } ).length === 0) {
			_requestQueue.push({key:key, data:data});
		}
	}

	function _popQueue () {
		if(_errorData) {
			sb.ext.debug("Running Error Request");
			_request.apply(this, this._errorData);
		} else if (_requestQueue.length > 0) {
			var r = _requestQueue.shift().data;
			api.request.call(null, r.url, r.params, r.post, r.success, r.failure);
		}
	}
	
	var _checkContext = 0;
	function _watchConnection() {
		sb.ext.debug("Watching Connection ", ST.context("session"), _checkContext);
		if(ST.disconnected()) {
			_checkContext = E.range(50, 10000, _checkContext*2);
			sb.ext.debug("Disconnected. Try login periodically until it succeeds", _checkContext);
			
			api.post.bindDelay(null, _checkContext, sb.urls.url(sb.urls.LOGIN), {}, null, null, ST.disconnected);

		} else if(_checkContext > 0) {
			sb.ext.debug("Popup Queue. Connection Success");
			_checkContext = 0;
			_popQueue();
		}
	}

	

	//check the connection
	ST.watchContext("session", _watchConnection);




	return api;
});

